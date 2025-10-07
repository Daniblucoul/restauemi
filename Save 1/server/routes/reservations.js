const express = require('express');
const router = express.Router();
const { db } = require('../database/db');

// Get all reservations
router.get('/', (req, res) => {
  const { date, status } = req.query;
  let query = 'SELECT r.*, t.table_number FROM reservations r LEFT JOIN tables t ON r.table_id = t.id';
  const params = [];

  if (date || status) {
    query += ' WHERE';
    if (date) {
      query += ' r.reservation_date = ?';
      params.push(date);
    }
    if (status) {
      if (date) query += ' AND';
      query += ' r.status = ?';
      params.push(status);
    }
  }

  query += ' ORDER BY r.reservation_date, r.reservation_time';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get single reservation
router.get('/:id', (req, res) => {
  const query = 'SELECT r.*, t.table_number FROM reservations r LEFT JOIN tables t ON r.table_id = t.id WHERE r.id = ?';
  
  db.get(query, [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    res.json(row);
  });
});

// Create new reservation
router.post('/', (req, res) => {
  const { customer_name, customer_phone, customer_email, party_size, reservation_date, reservation_time, table_id, notes } = req.body;
  
  const query = `INSERT INTO reservations (customer_name, customer_phone, customer_email, party_size, reservation_date, reservation_time, table_id, notes) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(query, [customer_name, customer_phone, customer_email, party_size, reservation_date, reservation_time, table_id, notes], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({
      id: this.lastID,
      message: 'Reservation created successfully'
    });
  });
});

// Update reservation
router.put('/:id', (req, res) => {
  const { customer_name, customer_phone, customer_email, party_size, reservation_date, reservation_time, table_id, status, notes } = req.body;
  
  const query = `UPDATE reservations 
                 SET customer_name = ?, customer_phone = ?, customer_email = ?, party_size = ?, 
                     reservation_date = ?, reservation_time = ?, table_id = ?, status = ?, notes = ?
                 WHERE id = ?`;
  
  db.run(query, [customer_name, customer_phone, customer_email, party_size, reservation_date, reservation_time, table_id, status, notes, req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    res.json({ message: 'Reservation updated successfully' });
  });
});

// Update reservation status
router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  const validStatuses = ['confirmed', 'seated', 'completed', 'cancelled', 'no-show'];
  
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  
  db.run('UPDATE reservations SET status = ? WHERE id = ?', [status, req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    res.json({ message: 'Reservation status updated successfully' });
  });
});

// Delete reservation
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM reservations WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    res.json({ message: 'Reservation deleted successfully' });
  });
});

module.exports = router;
