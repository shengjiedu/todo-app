import { supabase } from './_lib/supabase.js';
import { mapIntensity } from './_lib/wxpusher.js';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'date parameter is required' });
    }
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('scheduled_date', date)
      .order('start_time', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data || []);
  }

  if (req.method === 'POST') {
    const { title, description, scheduledDate, startTime, endTime, brainTokens, priority, autoRollover } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'title is required' });
    }
    if (!scheduledDate) {
      return res.status(400).json({ error: 'scheduledDate is required' });
    }
    if (!startTime) {
      return res.status(400).json({ error: 'startTime is required' });
    }

    const tokens = Math.max(0, parseInt(brainTokens, 10) || 0);
    const intensity = mapIntensity(tokens);
    const prio = Math.min(5, Math.max(1, parseInt(priority, 10) || 3));

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: title.trim(),
        description: description || '',
        scheduled_date: scheduledDate,
        start_time: startTime,
        end_time: endTime || '',
        brain_tokens: tokens,
        intensity,
        priority: prio,
        status: 'pending',
        auto_rollover: autoRollover !== false,
        rollover_count: 0
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
