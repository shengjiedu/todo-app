import { pushDailySummary } from '../_lib/wxpusher.js';
import { supabase } from '../_lib/supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('scheduled_date', tomorrow)
    .order('start_time', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  const totalTokens = (tasks || []).reduce((sum, t) => sum + (t.brain_tokens || 0), 0);
  const pending = (tasks || []).filter(t => t.status === 'pending').length;

  const { data: settings } = await supabase
    .from('settings')
    .select('daily_token_budget')
    .eq('id', 1)
    .single();

  const result = await pushDailySummary(tomorrow, tasks || [], {
    pending,
    totalTokens,
    budget: settings?.daily_token_budget || 1000
  });

  res.json(result);
}