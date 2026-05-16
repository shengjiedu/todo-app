const express = require('express');
const AV = require('leancloud-storage');

const router = express.Router();
const Settings = AV.Object.extend('Settings');

async function getOrCreateSettings() {
  const query = new AV.Query(Settings);
  query.equalTo('key', 'default');
  let settings = await query.first().catch(() => null);
  if (!settings) {
    settings = new Settings();
    settings.set('key', 'default');
    settings.set('dailyTokenBudget', 1000);
    settings.set('wxPusherUID', '');
    settings.set('wxPusherToken', '');
    settings.set('remindTime', '22:00');
    settings.set('morningPushTime', '08:00');
    await settings.save();
  }
  return settings;
}

// GET /api/settings
router.get('/', async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.json(settings.toJSON());
  } catch (err) {
    console.error('GET settings error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/settings
router.put('/', async (req, res) => {
  try {
    const { dailyTokenBudget, wxPusherUID, wxPusherToken, remindTime, morningPushTime } = req.body;
    const settings = await getOrCreateSettings();

    if (dailyTokenBudget !== undefined) {
      settings.set('dailyTokenBudget', Math.max(1, parseInt(dailyTokenBudget, 10) || 1000));
    }
    if (wxPusherUID !== undefined) {
      settings.set('wxPusherUID', wxPusherUID || '');
    }
    if (wxPusherToken !== undefined) {
      settings.set('wxPusherToken', wxPusherToken || '');
    }
    if (remindTime !== undefined) {
      settings.set('remindTime', remindTime);
    }
    if (morningPushTime !== undefined) {
      settings.set('morningPushTime', morningPushTime);
    }

    const updated = await settings.save();
    res.json(updated.toJSON());
  } catch (err) {
    console.error('PUT settings error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
