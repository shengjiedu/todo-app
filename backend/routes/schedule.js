const express = require('express');
const AV = require('leancloud-storage');

const router = express.Router();
const Task = AV.Object.extend('Task');
const History = AV.Object.extend('History');
const Settings = AV.Object.extend('Settings');

async function getSettings() {
  const query = new AV.Query(Settings);
  query.equalTo('key', 'default');
  let settings = await query.first().catch(() => null);
  if (!settings) {
    settings = new Settings();
    settings.set('key', 'default');
    settings.set('dailyTokenBudget', 1000);
    await settings.save();
  }
  return settings;
}

// POST /api/schedule/rollover
router.post('/rollover', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    // 1. Find pending tasks for today
    const pendingQuery = new AV.Query(Task);
    pendingQuery.equalTo('scheduledDate', today);
    pendingQuery.equalTo('status', 'pending');
    pendingQuery.equalTo('autoRollover', true);
    const pendingTasks = await pendingQuery.find();

    // 2. Roll them over to tomorrow
    for (const task of pendingTasks) {
      const newRolloverCount = (task.get('rolloverCount') || 0) + 1;
      const newPriority = newRolloverCount >= 3 ? 5 : (task.get('priority') || 3);
      task.set('scheduledDate', tomorrow);
      task.set('rolloverCount', newRolloverCount);
      task.set('priority', newPriority);
    }
    if (pendingTasks.length > 0) {
      await AV.Object.saveAll(pendingTasks);
    }

    // 3. Redistribute tomorrow tasks
    const tomorrowQuery = new AV.Query(Task);
    tomorrowQuery.equalTo('scheduledDate', tomorrow);
    tomorrowQuery.addDescending('priority');
    tomorrowQuery.addAscending('startTime');
    const tomorrowTasks = await tomorrowQuery.find();

    const startHour = 6;
    const endHour = 22;
    const availableHours = endHour - startHour;
    const hourStep = availableHours / Math.max(tomorrowTasks.length, 1);

    for (let i = 0; i < tomorrowTasks.length; i++) {
      const hour = Math.floor(startHour + i * hourStep);
      const minute = Math.floor((i * hourStep % 1) * 60);
      const newStartTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      tomorrowTasks[i].set('startTime', newStartTime);
    }
    if (tomorrowTasks.length > 0) {
      await AV.Object.saveAll(tomorrowTasks);
    }

    // 4. Archive today
    const todayQuery = new AV.Query(Task);
    todayQuery.equalTo('scheduledDate', today);
    const allToday = await todayQuery.find();
    const completedCount = allToday.filter(t => t.get('status') === 'completed').length;
    const totalTokens = allToday.reduce((sum, t) => sum + (t.get('brainTokens') || 0), 0);

    const history = new History();
    history.set('date', today);
    history.set('totalTasks', allToday.length);
    history.set('completedTasks', completedCount);
    history.set('rolledTasks', pendingTasks.length);
    history.set('totalTokens', totalTokens);
    history.set('snapshot', JSON.stringify(allToday.map(t => t.toJSON())));
    await history.save();

    res.json({
      message: 'Rollover completed',
      rolledCount: pendingTasks.length,
      tomorrowTaskCount: tomorrowTasks.length
    });
  } catch (err) {
    console.error('Rollover error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/schedule/today
router.get('/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const query = new AV.Query(Task);
    query.equalTo('scheduledDate', today);
    query.addAscending('startTime');
    const tasks = await query.find();

    const totalTokens = tasks.reduce((sum, t) => sum + (t.get('status') === 'pending' ? (t.get('brainTokens') || 0) : 0), 0);
    const settings = await getSettings();

    res.json({
      date: today,
      tasks: tasks.map(t => t.toJSON()),
      stats: {
        total: tasks.length,
        pending: tasks.filter(t => t.get('status') === 'pending').length,
        completed: tasks.filter(t => t.get('status') === 'completed').length,
        totalTokens,
        budget: settings.get('dailyTokenBudget') || 1000
      }
    });
  } catch (err) {
    console.error('Today query error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
