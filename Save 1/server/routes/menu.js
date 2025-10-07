const express = require('express');
const router = express.Router();
const { db } = require('../database/db');

// Get all menu items
router.get('/', (req, res) => {
  db.all('SELECT * FROM menu_items ORDER BY category, name', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

module.exports = router;
