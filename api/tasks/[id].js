import { supabase } from '../_lib/supabase.js';
import { mapIntensity } from '../_lib/wxpusher.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;

  if (req.method === 'PUT') {
    const updates = req.body;
    const fields = {};

    if (updates.title !== undefined) fields.title = updates.title.trim();
    if (updates.description !== undefined) fields.description = updates.description || '';
    if (updates.scheduledDate !== undefined) fields.scheduled_date = updates.scheduledDate;
    if (updates.startTime !== undefined) fields.start_time = updates.startTime;
    if (updates.endTime !== undefined) fields.end_time = updates.endTime || '';
    if (updates.brainTokens !== undefined) {
      const tokens = Math.max(0, parseInt(updates.brainTokens, 10) || 0);
      fields.brain_tokens = tokens;
      fields.intensity = mapIntensity(tokens);
    }
    if (updates.priority !== undefined) {
      fields.priority = Math.min(5, Math.max(1, parseInt(updates.priority, 10) || 3));
    }
    if (updates.status !== undefined) fields.status = updates.status;
    if (updates.autoRollover !== undefined) fields.auto_rollover = !!updates.autoRollover;

    const { data, error } = await supabase
      .from('tasks')
      .update(fields)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Task not found' });
    return res.json(data);
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ message: 'Task deleted' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
