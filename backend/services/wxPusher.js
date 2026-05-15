import axios from 'axios';
import db from '../database.js';

const WXPUSHER_API = 'https://wxpusher.zjiecode.com/api/send/message';

export async function pushMessage(content, summary = '') {
  const settings = db.prepare('SELECT wxPusherUID, wxPusherToken FROM settings WHERE id = 1').get();
  if (!settings?.wxPusherUID || !settings?.wxPusherToken) {
    console.log('[WxPusher] Skip: no UID or Token configured');
    return { ok: false, reason: 'not_configured' };
  }

  try {
    const resp = await axios.post(WXPUSHER_API, {
      appToken: settings.wxPusherToken,
      content,
      summary: summary || content.slice(0, 50),
      contentType: 1, // text
      uids: [settings.wxPusherUID]
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

export async function pushDailySummary(date, tasks, stats) {
  const lines = tasks.map((t, i) =>
    `${i + 1}. ${t.title} ${t.startTime} 🧠${t.brainTokens}${t.rolloverCount > 0 ? ' 🔥' : ''}`
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

export async function pushRemind(tomorrowTaskCount, totalTokens) {
  if (tomorrowTaskCount === 0) {
    return pushMessage('📋 明天还没有安排任务哦，快来规划一下', '待办提醒');
  }
  return pushMessage(
    `📋 明日待办已就绪（${tomorrowTaskCount}个任务，共 ${totalTokens} token）`,
    '待办提醒'
  );
}
