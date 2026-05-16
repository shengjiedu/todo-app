const AV = require('leancloud-storage');
const { pushRemind, pushDailySummary } = require('./services/wxPusher');

const Task = AV.Object.extend('Task');
const Settings = AV.Object.extend('Settings');
const History = AV.Object.extend('History');

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

function getTomorrowStr() {
  return new Date(Date.now() + 86400000).toISOString().split('T')[0];
}

function mapIntensity(tokens) {
  if (tokens <= 50) return 'low';
  if (tokens <= 150) return 'medium';
  if (tokens <= 300) return 'high';
  return 'extreme';
}

async function getSettings() {
  const query = new AV.Query(Settings);
  query.equalTo('key', 'default');
  let settings = await query.first().catch(() => null);
  if (!settings) {
    settings = new Settings();
    settings.set('key', 'default');
    settings.set('dailyTokenBudget', 1000);
    settings.set('remindTime', '22:00');
    settings.set('morningPushTime', '08:00');
    await settings.save();
  }
  return settings;
}

// 晚上 22:00 提醒
AV.Cloud.define('dailyRemind', async (request) => {
  console.log('[Cloud] dailyRemind started');
  const tomorrow = getTomorrowStr();
  const query = new AV.Query(Task);
  query.equalTo('scheduledDate', tomorrow);
  const tasks = await query.find();
  const totalTokens = tasks.reduce((sum, t) => sum + (t.get('brainTokens') || 0), 0);
  await pushRemind(tasks.length, totalTokens);
  return { ok: true, taskCount: tasks.length };
});

// 早上 08:00 重排 + 推送
AV.Cloud.define('dailyRollover', async (request) => {
  console.log('[Cloud] dailyRollover started');
  const today = getTodayStr();
  const tomorrow = getTomorrowStr();

  // 1. 查找今天未完成的任务
  const pendingQuery = new AV.Query(Task);
  pendingQuery.equalTo('scheduledDate', today);
  pendingQuery.equalTo('status', 'pending');
  pendingQuery.equalTo('autoRollover', true);
  const pendingTasks = await pendingQuery.find();

  // 2. 顺延到明天
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

  // 3. 获取明天的所有任务
  const tomorrowQuery = new AV.Query(Task);
  tomorrowQuery.equalTo('scheduledDate', tomorrow);
  tomorrowQuery.addDescending('priority');
  tomorrowQuery.addAscending('startTime');
  const tomorrowTasks = await tomorrowQuery.find();

  // 4. 重新分配时间段
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

  // 5. 归档今天的数据
  const todayQuery = new AV.Query(Task);
  todayQuery.equalTo('scheduledDate', today);
  const allToday = await todayQuery.find();
  const completedCount = allToday.filter(t => t.get('status') === 'completed').length;
  const totalTokensToday = allToday.reduce((sum, t) => sum + (t.get('brainTokens') || 0), 0);

  const history = new History();
  history.set('date', today);
  history.set('totalTasks', allToday.length);
  history.set('completedTasks', completedCount);
  history.set('rolledTasks', pendingTasks.length);
  history.set('totalTokens', totalTokensToday);
  history.set('snapshot', JSON.stringify(allToday.map(t => t.toJSON())));
  await history.save();

  // 6. 推送日报
  const freshQuery = new AV.Query(Task);
  freshQuery.equalTo('scheduledDate', tomorrow);
  freshQuery.addAscending('startTime');
  const freshTasks = await freshQuery.find();
  const freshTotalTokens = freshTasks.reduce((sum, t) => sum + (t.get('brainTokens') || 0), 0);
  const settings = await getSettings();

  await pushDailySummary(tomorrow, freshTasks.map(t => t.toJSON()), {
    pending: freshTasks.filter(t => t.get('status') === 'pending').length,
    totalTokens: freshTotalTokens,
    budget: settings.get('dailyTokenBudget') || 1000
  });

  console.log('[Cloud] dailyRollover completed');
  return { ok: true, rolledCount: pendingTasks.length, tomorrowCount: freshTasks.length };
});

// 手动触发重排（调试用）
AV.Cloud.define('manualRollover', async (request) => {
  return AV.Cloud.run('dailyRollover');
});

module.exports = { getSettings, mapIntensity };
