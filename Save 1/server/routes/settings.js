const express = require('express');
const router = express.Router();
const { db } = require('../database/db');

// Ensure settings table exists and has a default currency
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`);
  db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('currency', 'FCFA')`);
});

// @route   GET /api/settings/currency
// @desc    Get the current currency
// @access  Public
router.get('/currency', (req, res) => {
  db.get("SELECT value FROM settings WHERE key = 'currency'", (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ currency: row ? row.value : 'FCFA' });
  });
});

// @route   PUT /api/settings/currency
// @desc    Update the currency
// @access  Public
router.put('/currency', (req, res) => {
  const { currency } = req.body;
  if (!currency) {
    return res.status(400).json({ error: 'Currency is required' });
  }

  db.run("UPDATE settings SET value = ? WHERE key = 'currency'", [currency], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Currency updated successfully', currency });
  });
});

module.exports = router;
