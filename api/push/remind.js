import { pushRemind } from '../_lib/wxpusher.js';
import { supabase } from '../_lib/supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('scheduled_date', tomorrow);

  if (error) return res.status(500).json({ error: error.message });

  const totalTokens = (tasks || []).reduce((sum, t) => sum + (t.brain_tokens || 0), 0);
  const result = await pushRemind(tasks?.length || 0, totalTokens);

  res.json(result);
}