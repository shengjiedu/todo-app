import { supabase } from './_lib/supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      // Create default settings
      const { data: created, error: createError } = await supabase
        .from('settings')
        .insert({ id: 1, daily_token_budget: 1000, remind_time: '22:00', morning_push_time: '08:00' })
        .select()
        .single();
      if (createError) return res.status(500).json({ error: createError.message });
      return res.json(created);
    }

    return res.json(data);
  }

  if (req.method === 'PUT') {
    const { dailyTokenBudget, wxPusherUID, wxPusherToken, remindTime, morningPushTime } = req.body;
    const fields = {};

    if (dailyTokenBudget !== undefined) fields.daily_token_budget = Math.max(1, parseInt(dailyTokenBudget, 10) || 1000);
    if (wxPusherUID !== undefined) fields.wx_pusher_uid = wxPusherUID || '';
    if (wxPusherToken !== undefined) fields.wx_pusher_token = wxPusherToken || '';
    if (remindTime !== undefined) fields.remind_time = remindTime;
    if (morningPushTime !== undefined) fields.morning_push_time = morningPushTime;

    const { data, error } = await supabase
      .from('settings')
      .update(fields)
      .eq('id', 1)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}