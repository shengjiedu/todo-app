import { supabase } from '../_lib/supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  // 1. Find pending tasks for today
  const { data: pendingTasks, error: pendingError } = await supabase
    .from('tasks')
    .select('*')
    .eq('scheduled_date', today)
    .eq('status', 'pending')
    .eq('auto_rollover', true);

  if (pendingError) return res.status(500).json({ error: pendingError.message });

  // 2. Roll them over to tomorrow
  for (const task of (pendingTasks || [])) {
    const newRolloverCount = (task.rollover_count || 0) + 1;
    const newPriority = newRolloverCount >= 3 ? 5 : (task.priority || 3);
    await supabase.from('tasks').update({
      scheduled_date: tomorrow,
      rollover_count: newRolloverCount,
      priority: newPriority
    }).eq('id', task.id);
  }

  // 3. Redistribute tomorrow tasks
  const { data: tomorrowTasks, error: tomorrowError } = await supabase
    .from('tasks')
    .select('*')
    .eq('scheduled_date', tomorrow)
    .order('priority', { ascending: false })
    .order('start_time', { ascending: true });

  if (tomorrowError) return res.status(500).json({ error: tomorrowError.message });

  const startHour = 6;
  const endHour = 22;
  const availableHours = endHour - startHour;
  const hourStep = availableHours / Math.max((tomorrowTasks || []).length, 1);

  for (let i = 0; i < (tomorrowTasks || []).length; i++) {
    const hour = Math.floor(startHour + i * hourStep);
    const minute = Math.floor((i * hourStep % 1) * 60);
    const newStartTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    await supabase.from('tasks').update({ start_time: newStartTime }).eq('id', tomorrowTasks[i].id);
  }

  // 4. Archive today
  const { data: allToday } = await supabase
    .from('tasks')
    .select('*')
    .eq('scheduled_date', today);

  const completedCount = (allToday || []).filter(t => t.status === 'completed').length;
  const totalTokens = (allToday || []).reduce((sum, t) => sum + (t.brain_tokens || 0), 0);

  await supabase.from('history').upsert({
    date: today,
    total_tasks: allToday?.length || 0,
    completed_tasks: completedCount,
    rolled_tasks: pendingTasks?.length || 0,
    total_tokens: totalTokens,
    snapshot: allToday || []
  }, { onConflict: 'date' });

  res.json({
    message: 'Rollover completed',
    rolledCount: pendingTasks?.length || 0,
    tomorrowTaskCount: tomorrowTasks?.length || 0
  });
}
