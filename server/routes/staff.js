const express = require('express');
const router = express.Router();
const { db } = require('../database/db');

// Get all staff members
router.get('/', (req, res) => {
  db.all('SELECT * FROM staff ORDER BY last_name, first_name', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get single staff member
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM staff WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Staff member not found' });
    }
    res.json(row);
  });
});

// Add new staff member
router.post('/', (req, res) => {
  const { first_name, last_name, role, status } = req.body;
  
  const query = `INSERT INTO staff (first_name, last_name, role, status) 
                 VALUES (?, ?, ?, ?)`;
  
  db.run(query, [first_name, last_name, role, status || 'active'], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({
      id: this.lastID,
      message: 'Staff member added successfully'
    });
  });
});

// Update staff member
router.put('/:id', (req, res) => {
  const { first_name, last_name, role, status } = req.body;
  
  const query = `UPDATE staff 
                 SET first_name = ?, last_name = ?, role = ?, status = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`;
  
  db.run(query, [first_name, last_name, role, status, req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Staff member updated successfully' });
  });
});

// Delete staff member
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM staff WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Staff member deleted successfully' });
  });
});

// Get staff schedule
router.get('/:id/schedule', (req, res) => {
  const { start_date, end_date } = req.query;
  let query = 'SELECT * FROM staff_schedule WHERE staff_id = ?';
  const params = [req.params.id];

  if (start_date && end_date) {
    query += ' AND shift_date BETWEEN ? AND ?';
    params.push(start_date, end_date);
  }

  query += ' ORDER BY shift_date, start_time';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Add schedule
router.post('/:id/schedule', (req, res) => {
  const { shift_date, start_time, end_time, notes } = req.body;
  
  const query = `INSERT INTO staff_schedule (staff_id, shift_date, start_time, end_time, notes) 
                 VALUES (?, ?, ?, ?, ?)`;
  
  db.run(query, [req.params.id, shift_date, start_time, end_time, notes], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({
      id: this.lastID,
      message: 'Schedule added successfully'
    });
  });
});

// Get staff leaves
router.get('/:id/leaves', (req, res) => {
  db.all('SELECT * FROM staff_leaves WHERE staff_id = ? ORDER BY start_date DESC', [req.params.id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Request leave
router.post('/:id/leaves', (req, res) => {
  const { leave_type, start_date, end_date, reason } = req.body;
  
  const query = `INSERT INTO staff_leaves (staff_id, leave_type, start_date, end_date, reason) 
                 VALUES (?, ?, ?, ?, ?)`;
  
  db.run(query, [req.params.id, leave_type, start_date, end_date, reason], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({
      id: this.lastID,
      message: 'Leave request submitted successfully'
    });
  });
});

module.exports = router;
