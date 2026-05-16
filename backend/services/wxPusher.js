const axios = require('axios');
const AV = require('leancloud-storage');

const WXPUSHER_API = 'https://wxpusher.zjiecode.com/api/send/message';
const Settings = AV.Object.extend('Settings');

async function getSettings() {
  const query = new AV.Query(Settings);
  query.equalTo('key', 'default');
  const settings = await query.first().catch(() => null);
  return settings;
}

async function pushMessage(content, summary = '') {
  const settings = await getSettings();
  if (!settings || !settings.get('wxPusherUID') || !settings.get('wxPusherToken')) {
    console.log('[WxPusher] Skip: no UID or Token configured');
    return { ok: false, reason: 'not_configured' };
  }

  try {
    const resp = await axios.post(WXPUSHER_API, {
      appToken: settings.get('wxPusherToken'),
      content,
      summary: summary || content.slice(0, 50),
      contentType: 1,
      uids: [settings.get('wxPusherUID')]
    }, { timeout: 15000 });

    if (resp.data?.success) {
      console.log('[WxPusher] Push OK');
      return { ok: true };
    } else {
      console.warn('[WxPusher] Push failed:', resp.data?.msg);
      return { ok: false, reason: resp.data?.msg };
    }
  } catch (err) {
    console.error('[WxPusher] Error:', err.message);
    return { ok: false, reason: err.message };
  }
}

async function pushDailySummary(date, tasks, stats) {
  const lines = tasks.map((t, i) =>
    `${i + 1}. ${t.title || t.get?.('title')} ${t.startTime || t.get?.('startTime')} 🧠${t.brainTokens || t.get?.('brainTokens')}${(t.rolloverCount || t.get?.('rolloverCount')) > 0 ? ' 🔥' : ''}`
  );

  const content = [
    `📅 ${date} 待办（${stats.pending}个进行中）`,
    '',
    ...lines,
    '',
    `今日预算：${stats.totalTokens}/${stats.budget} token`
  ].join('\n');

  return pushMessage(content, `${date} 待办提醒`);
}

async function pushRemind(tomorrowTaskCount, totalTokens) {
  if (tomorrowTaskCount === 0) {
    return pushMessage('📋 明天还没有安排任务哦，快来规划一下', '待办提醒');
  }
  return pushMessage(
    `📋 明日待办已就绪（${tomorrowTaskCount}个任务，共 ${totalTokens} token）`,
    '待办提醒'
  );
}

module.exports = { pushMessage, pushDailySummary, pushRemind };
