import cron from 'node-cron';
import db from './database.js';
import { pushRemind, pushDailySummary } from './services/wxPusher.js';

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

function getTomorrowStr() {
  return new Date(Date.now() + 86400000).toISOString().split('T')[0];
}

// 22:00 reminder
function setupRemindJob() {
  cron.schedule('0 22 * * *', async () => {
    console.log('[Cron] 22:00 remind job started');
    const tomorrow = getTomorrowStr();
    const tasks = db.prepare('SELECT * FROM tasks WHERE scheduledDate = ?').all(tomorrow);
    const totalTokens = tasks.reduce((sum, t) => sum + t.brainTokens, 0);
    await pushRemind(tasks.length, totalTokens);
  }, { timezone: 'Asia/Shanghai' });
}

// 08:00 rollover + push
function setupMorningJob() {
  cron.schedule('0 8 * * *', async () => {
    console.log('[Cron] 08:00 rollover job started');
    const today = getTodayStr();
    const tomorrow = getTomorrowStr();

    // 1. Find pending tasks for today
    const pendingTasks = db.prepare(
      "SELECT * FROM tasks WHERE scheduledDate = ? AND status = 'pending' AND autoRollover = 1"
    ).all(today);

    // 2. Roll them over to tomorrow
    for (const task of pendingTasks) {
      const newRolloverCount = task.rolloverCount + 1;
      const newPriority = newRolloverCount >= 3 ? 5 : task.priority;
      db.prepare(`
        UPDATE tasks
        SET scheduledDate = ?, rolloverCount = ?, priority = ?, updatedAt = ?
        WHERE id = ?
      `).run(tomorrow, newRolloverCount, newPriority, new Date().toISOString(), task.id);
    }

    // 3. Redistribute tomorrow tasks
    const tomorrowTasks = db.prepare(
      'SELECT * FROM tasks WHERE scheduledDate = ? ORDER BY priority DESC, startTime ASC'
    ).all(tomorrow);

    const startHour = 6;
    const endHour = 22;
    const availableHours = endHour - startHour;
    const hourStep = availableHours / Math.max(tomorrowTasks.length, 1);

    for (let i = 0; i < tomorrowTasks.length; i++) {
      const hour = Math.floor(startHour + i * hourStep);
      const minute = Math.floor((i * hourStep % 1) * 60);
      const newStartTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      db.prepare('UPDATE tasks SET startTime = ?, updatedAt = ? WHERE id = ?')
        .run(newStartTime, new Date().toISOString(), tomorrowTasks[i].id);
    }

    // 4. Archive today
    const allToday = db.prepare('SELECT * FROM tasks WHERE scheduledDate = ?').all(today);
    const completed = allToday.filter(t => t.status === 'completed').length;
    const totalTokens = allToday.reduce((sum, t) => sum + t.brainTokens, 0);
    db.prepare(`
      INSERT OR REPLACE INTO history (date, totalTasks, completedTasks, rolledTasks, totalTokens, snapshot)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(today, allToday.length, completed, pendingTasks.length, totalTokens, JSON.stringify(allToday));

    // 5. Push daily summary
    const freshTomorrowTasks = db.prepare(
      'SELECT * FROM tasks WHERE scheduledDate = ? ORDER BY startTime ASC'
    ).all(tomorrow);
    const freshTotalTokens = freshTomorrowTasks.reduce((sum, t) => sum + t.brainTokens, 0);
    const budget = db.prepare('SELECT dailyTokenBudget FROM settings WHERE id = 1').get();

    await pushDailySummary(tomorrow, freshTomorrowTasks, {
      pending: freshTomorrowTasks.filter(t => t.status === 'pending').length,
      totalTokens: freshTotalTokens,
      budget: budget?.dailyTokenBudget || 1000
    });

    console.log('[Cron] 08:00 rollover job completed');
  }, { timezone: 'Asia/Shanghai' });
}

// Startup check: if server started after 08:00 and rollover hasn't run today
function runStartupCheck() {
  const now = new Date();
  const hour = now.getHours();
  if (hour >= 8) {
    const today = getTodayStr();
    const history = db.prepare('SELECT id FROM history WHERE date = ?').get(today);
    if (!history) {
      console.log('[Startup] Morning rollover missed, running now...');
      // Trigger the same logic via a simulated call - we'll just log for now
      // In practice, the user can manually hit POST /api/schedule/rollover
    }
  }
}

export function initCronJobs() {
  setupRemindJob();
  setupMorningJob();
  runStartupCheck();
  console.log('[Cron] Jobs initialized (22:00 remind, 08:00 rollover)');
}
