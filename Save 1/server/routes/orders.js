const express = require('express');
const router = express.Router();
const { db } = require('../database/db');

// Get all orders
router.get('/', (req, res) => {
  const { status, date } = req.query;
  let query = 'SELECT * FROM orders';
  const params = [];

  if (status || date) {
    query += ' WHERE';
    if (status) {
      query += ' status = ?';
      params.push(status);
    }
    if (date) {
      if (status) query += ' AND';
      query += ' DATE(created_at) = ?';
      params.push(date);
    }
  }

  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    // Parse items JSON
    const orders = rows.map(order => ({
      ...order,
      items: JSON.parse(order.items)
    }));
    res.json(orders);
  });
});

// Get single order
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM orders WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({
      ...row,
      items: JSON.parse(row.items)
    });
  });
});

// Create new order
router.post('/', (req, res) => {
  const { table_id, customer_name, items, total_amount, order_type, notes } = req.body;
  
  // Generate order number
  const orderNumber = 'ORD-' + Date.now();
  
  const query = `INSERT INTO orders (table_id, order_number, customer_name, items, total_amount, order_type, notes) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(query, [table_id, orderNumber, customer_name, JSON.stringify(items), total_amount, order_type || 'dine-in', notes], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Update table status if applicable
    if (table_id) {
      db.run('UPDATE tables SET status = ? WHERE id = ?', ['occupied', table_id]);
    }
    
    res.status(201).json({
      id: this.lastID,
      order_number: orderNumber,
      message: 'Order created successfully'
    });
  });
});

// Update order status
router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'preparing', 'ready', 'served', 'paid', 'cancelled'];
  
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  
  db.run('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
    [status, req.params.id], 
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      // If order is paid, free up the table
      if (status === 'paid') {
        db.get('SELECT table_id FROM orders WHERE id = ?', [req.params.id], (err, row) => {
          if (row && row.table_id) {
            db.run('UPDATE tables SET status = ? WHERE id = ?', ['available', row.table_id]);
          }
        });
      }
      
      res.json({ message: 'Order status updated successfully' });
    }
  );
});

// Delete order
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM orders WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({ message: 'Order deleted successfully' });
  });
});

module.exports = router;
