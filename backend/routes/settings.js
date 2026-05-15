import { Router } from 'express';
import db from '../database.js';

const router = Router();

// GET /api/settings
router.get('/', (req, res) => {
  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  if (!settings) {
    return res.status(404).json({ error: 'Settings not found' });
  }
  // Don't expose sensitive token to frontend? For now expose all since it's local app
  res.json(settings);
});

// PUT /api/settings
router.put('/', (req, res) => {
  const { dailyTokenBudget, wxPusherUID, wxPusherToken, remindTime, morningPushTime } = req.body;

  const updates = [];
  const params = {};

  if (dailyTokenBudget !== undefined) {
    updates.push('dailyTokenBudget = @dailyTokenBudget');
    params.dailyTokenBudget = Math.max(1, parseInt(dailyTokenBudget, 10) || 1000);
  }
  if (wxPusherUID !== undefined) {
    updates.push('wxPusherUID = @wxPusherUID');
    params.wxPusherUID = wxPusherUID || null;
  }
  if (wxPusherToken !== undefined) {
    updates.push('wxPusherToken = @wxPusherToken');
    params.wxPusherToken = wxPusherToken || null;
  }
  if (remindTime !== undefined) {
    updates.push('remindTime = @remindTime');
    params.remindTime = remindTime;
  }
  if (morningPushTime !== undefined) {
    updates.push('morningPushTime = @morningPushTime');
    params.morningPushTime = morningPushTime;
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  updates.push('updatedAt = @updatedAt');
  params.updatedAt = new Date().toISOString();

  db.prepare(`UPDATE settings SET ${updates.join(', ')} WHERE id = 1`).run(params);

  const updated = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  res.json(updated);
});

export default router;
