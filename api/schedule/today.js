import { supabase } from '../_lib/supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const today = new Date().toISOString().split('T')[0];

  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .eq('scheduled_date', today)
    .order('start_time', { ascending: true });

  if (tasksError) return res.status(500).json({ error: tasksError.message });

  const totalTokens = (tasks || []).reduce((sum, t) =>
    sum + (t.status === 'pending' ? (t.brain_tokens || 0) : 0), 0);

  const { data: settings } = await supabase
    .from('settings')
    .select('daily_token_budget')
    .eq('id', 1)
    .single();

  res.json({
    date: today,
    tasks: tasks || [],
    stats: {
      total: tasks?.length || 0,
      pending: tasks?.filter(t => t.status === 'pending').length || 0,
      completed: tasks?.filter(t => t.status === 'completed').length || 0,
      totalTokens,
      budget: settings?.daily_token_budget || 1000
    }
  });
}
