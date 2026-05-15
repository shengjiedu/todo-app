import { Router } from 'express';
import { randomUUID } from 'crypto';
import db from '../database.js';

const router = Router();

function mapIntensity(tokens) {
  if (tokens <= 50) return 'low';
  if (tokens <= 150) return 'medium';
  if (tokens <= 300) return 'high';
  return 'extreme';
}

// GET /api/tasks?date=YYYY-MM-DD
router.get('/', (req, res) => {
  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ error: 'date parameter is required' });
  }
  const tasks = db.prepare(
    'SELECT * FROM tasks WHERE scheduledDate = ? ORDER BY startTime ASC'
  ).all(date);
  res.json(tasks);
});

// POST /api/tasks
router.post('/', (req, res) => {
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

  const now = new Date().toISOString();
  const tokens = Math.max(0, parseInt(brainTokens, 10) || 0);
  const intensity = mapIntensity(tokens);
  const prio = Math.min(5, Math.max(1, parseInt(priority, 10) || 3));
  const rollover = autoRollover !== false ? 1 : 0;

  const task = {
    id: randomUUID(),
    title: title.trim(),
    description: description || null,
    scheduledDate,
    startTime,
    endTime: endTime || null,
    brainTokens: tokens,
    intensity,
    priority: prio,
    status: 'pending',
    autoRollover: rollover,
    rolloverCount: 0,
    createdAt: now,
    updatedAt: now
  };

  db.prepare(`
    INSERT INTO tasks (id, title, description, scheduledDate, startTime, endTime, brainTokens, intensity, priority, status, autoRollover, rolloverCount, createdAt, updatedAt)
    VALUES (@id, @title, @description, @scheduledDate, @startTime, @endTime, @brainTokens, @intensity, @priority, @status, @autoRollover, @rolloverCount, @createdAt, @updatedAt)
  `).run(task);

  res.status(201).json(task);
});

// PUT /api/tasks/:id
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, scheduledDate, startTime, endTime, brainTokens, priority, status, autoRollover } = req.body;

  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const updates = [];
  const params = { id };

  if (title !== undefined) {
    updates.push('title = @title');
    params.title = title.trim();
  }
  if (description !== undefined) {
    updates.push('description = @description');
    params.description = description || null;
  }
  if (scheduledDate !== undefined) {
    updates.push('scheduledDate = @scheduledDate');
    params.scheduledDate = scheduledDate;
  }
  if (startTime !== undefined) {
    updates.push('startTime = @startTime');
    params.startTime = startTime;
  }
  if (endTime !== undefined) {
    updates.push('endTime = @endTime');
    params.endTime = endTime || null;
  }
  if (brainTokens !== undefined) {
    const tokens = Math.max(0, parseInt(brainTokens, 10) || 0);
    updates.push('brainTokens = @brainTokens');
    params.brainTokens = tokens;
    updates.push('intensity = @intensity');
    params.intensity = mapIntensity(tokens);
  }
  if (priority !== undefined) {
    updates.push('priority = @priority');
    params.priority = Math.min(5, Math.max(1, parseInt(priority, 10) || 3));
  }
  if (status !== undefined) {
    updates.push('status = @status');
    params.status = status;
  }
  if (autoRollover !== undefined) {
    updates.push('autoRollover = @autoRollover');
    params.autoRollover = autoRollover ? 1 : 0;
  }

  updates.push('updatedAt = @updatedAt');
  params.updatedAt = new Date().toISOString();

  if (updates.length > 1) {
    db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = @id`).run(params);
  }

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  res.json(updated);
});

// DELETE /api/tasks/:id
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Task not found' });
  }
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  res.json({ message: 'Task deleted' });
});

export default router;
