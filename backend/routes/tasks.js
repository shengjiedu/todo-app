const express = require('express');
const AV = require('leancloud-storage');
const { mapIntensity } = require('../cloud');

const router = express.Router();
const Task = AV.Object.extend('Task');

// GET /api/tasks?date=YYYY-MM-DD
router.get('/', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'date parameter is required' });
    }
    const query = new AV.Query(Task);
    query.equalTo('scheduledDate', date);
    query.addAscending('startTime');
    const tasks = await query.find();
    res.json(tasks.map(t => t.toJSON()));
  } catch (err) {
    console.error('GET tasks error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks
router.post('/', async (req, res) => {
  try {
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

    const task = new Task();
    task.set('title', title.trim());
    task.set('description', description || '');
    task.set('scheduledDate', scheduledDate);
    task.set('startTime', startTime);
    task.set('endTime', endTime || '');
    task.set('brainTokens', tokens);
    task.set('intensity', intensity);
    task.set('priority', prio);
    task.set('status', 'pending');
    task.set('autoRollover', autoRollover !== false);
    task.set('rolloverCount', 0);

    const saved = await task.save();
    res.status(201).json(saved.toJSON());
  } catch (err) {
    console.error('POST task error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/tasks/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const task = AV.Object.createWithoutData('Task', id);

    if (updates.title !== undefined) task.set('title', updates.title.trim());
    if (updates.description !== undefined) task.set('description', updates.description || '');
    if (updates.scheduledDate !== undefined) task.set('scheduledDate', updates.scheduledDate);
    if (updates.startTime !== undefined) task.set('startTime', updates.startTime);
    if (updates.endTime !== undefined) task.set('endTime', updates.endTime || '');
    if (updates.brainTokens !== undefined) {
      const tokens = Math.max(0, parseInt(updates.brainTokens, 10) || 0);
      task.set('brainTokens', tokens);
      task.set('intensity', mapIntensity(tokens));
    }
    if (updates.priority !== undefined) {
      task.set('priority', Math.min(5, Math.max(1, parseInt(updates.priority, 10) || 3)));
    }
    if (updates.status !== undefined) task.set('status', updates.status);
    if (updates.autoRollover !== undefined) task.set('autoRollover', !!updates.autoRollover);

    const saved = await task.save();
    res.json(saved.toJSON());
  } catch (err) {
    console.error('PUT task error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const task = AV.Object.createWithoutData('Task', id);
    await task.destroy();
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error('DELETE task error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
