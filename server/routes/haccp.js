const express = require('express');
const router = express.Router();
const { db } = require('../database/db');

// Get temperature logs
router.get('/temperature', (req, res) => {
  const { date } = req.query;
  let query = 'SELECT * FROM haccp_temperature_logs';
  const params = [];

  if (date) {
    query += ' WHERE DATE(created_at) = ?';
    params.push(date);
  }

  query += ' ORDER BY created_at DESC LIMIT 100';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Add temperature log
router.post('/temperature', (req, res) => {
  const { equipment_name, temperature, unit, min_temp, max_temp, recorded_by, notes } = req.body;
  
  let status = 'normal';
  if ((min_temp && temperature < min_temp) || (max_temp && temperature > max_temp)) {
    status = 'alert';
  }
  
  const query = `INSERT INTO haccp_temperature_logs (equipment_name, temperature, unit, min_temp, max_temp, status, recorded_by, notes) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(query, [equipment_name, temperature, unit || 'celsius', min_temp, max_temp, status, recorded_by, notes], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({
      id: this.lastID,
      status: status,
      message: 'Temperature log added successfully'
    });
  });
});

// Get hygiene checks
router.get('/hygiene', (req, res) => {
  const { date } = req.query;
  let query = 'SELECT * FROM haccp_hygiene_checks';
  const params = [];

  if (date) {
    query += ' WHERE DATE(created_at) = ?';
    params.push(date);
  }

  query += ' ORDER BY created_at DESC LIMIT 100';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Add hygiene check
router.post('/hygiene', (req, res) => {
  const { check_type, area, status, corrective_action, checked_by, notes } = req.body;
  
  const query = `INSERT INTO haccp_hygiene_checks (check_type, area, status, corrective_action, checked_by, notes) 
                 VALUES (?, ?, ?, ?, ?, ?)`;
  
  db.run(query, [check_type, area, status, corrective_action, checked_by, notes], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({
      id: this.lastID,
      message: 'Hygiene check added successfully'
    });
  });
});

module.exports = router;
