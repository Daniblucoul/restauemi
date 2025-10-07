const express = require('express');
const router = express.Router();
const { db } = require('../database/db');

// Get all tables
router.get('/', (req, res) => {
  db.all('SELECT * FROM tables ORDER BY table_number', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Update table status
router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  const validStatuses = ['available', 'occupied', 'reserved'];
  
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  
  db.run('UPDATE tables SET status = ? WHERE id = ?', [status, req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Table status updated successfully' });
  });
});

module.exports = router;
