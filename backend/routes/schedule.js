import { Router } from 'express';
import db from '../database.js';

const router = Router();

// Helper: distribute tasks evenly from 06:00 to 22:00
function distributeTimeSlots(tasks) {
  const startHour = 6;
  const endHour = 22;
  const availableHours = endHour - startHour;

  // Sort by priority desc, then by original startTime
  const sorted = [...tasks].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return a.startTime.localeCompare(b.startTime);
  });

  const hourStep = availableHours / Math.max(sorted.length, 1);

  return sorted.map((task, index) => {
    const hour = Math.floor(startHour + index * hourStep);
    const minute = Math.floor((index * hourStep % 1) * 60);
    const newStartTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    return { ...task, startTime: newStartTime };
  });
}

// POST /api/schedule/rollover — 手动触发重排（也供 cron 调用）
router.post('/rollover', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

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

  // 3. Get all tomorrow tasks (rolled + originally scheduled)
  const tomorrowTasks = db.prepare(
    'SELECT * FROM tasks WHERE scheduledDate = ? ORDER BY priority DESC, startTime ASC'
  ).all(tomorrow);

  // 4. Redistribute time slots
  const redistributed = distributeTimeSlots(tomorrowTasks);

  // 5. Update start times
  for (const task of redistributed) {
    db.prepare('UPDATE tasks SET startTime = ?, updatedAt = ? WHERE id = ?')
      .run(task.startTime, new Date().toISOString(), task.id);
  }

  // 6. Archive today's data
  const allToday = db.prepare('SELECT * FROM tasks WHERE scheduledDate = ?').all(today);
  const completed = allToday.filter(t => t.status === 'completed').length;
  const totalTokens = allToday.reduce((sum, t) => sum + t.brainTokens, 0);

  db.prepare(`
    INSERT OR REPLACE INTO history (date, totalTasks, completedTasks, rolledTasks, totalTokens, snapshot)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(today, allToday.length, completed, pendingTasks.length, totalTokens, JSON.stringify(allToday));

  res.json({
    message: 'Rollover completed',
    rolledCount: pendingTasks.length,
    tomorrowTaskCount: redistributed.length,
    redistributed
  });
});

// GET /api/schedule/today
router.get('/today', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const tasks = db.prepare(
    'SELECT * FROM tasks WHERE scheduledDate = ? ORDER BY startTime ASC'
  ).all(today);

  const totalTokens = tasks.reduce((sum, t) => sum + (t.status === 'pending' ? t.brainTokens : 0), 0);
  const budget = db.prepare('SELECT dailyTokenBudget FROM settings WHERE id = 1').get();

  res.json({
    date: today,
    tasks,
    stats: {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      totalTokens,
      budget: budget?.dailyTokenBudget || 1000
    }
  });
});

export default router;
export { distributeTimeSlots };
