import axios from 'axios';
import { supabase } from './supabase.js';

const WXPUSHER_API = 'https://wxpusher.zjiecode.com/api/send/message';

async function getSettings() {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 1)
    .single();
  if (error) return null;
  return data;
}

export async function pushMessage(content, summary = '') {
  const settings = await getSettings();
  if (!settings?.wx_pusher_uid || !settings?.wx_pusher_token) {
    console.log('[WxPusher] Skip: no UID or Token configured');
    return { ok: false, reason: 'not_configured' };
  }

  try {
    const resp = await axios.post(WXPUSHER_API, {
      appToken: settings.wx_pusher_token,
      content,
      summary: summary || content.slice(0, 50),
      contentType: 1,
      uids: [settings.wx_pusher_uid]
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
    `${i + 1}. ${t.title} ${t.start_time} 🧠${t.brain_tokens}${t.rollover_count > 0 ? ' 🔥' : ''}`
  );

  const content = [
    `📅 ${date} 待办（${stats.pending}个进行中）`,
    '',
    ...lines,
    '',
    `今日预算：${stats.total_tokens}/${stats.budget} token`
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

function mapIntensity(tokens) {
  if (tokens <= 50) return 'low';
  if (tokens <= 150) return 'medium';
  if (tokens <= 300) return 'high';
  return 'extreme';
}

export { mapIntensity };
