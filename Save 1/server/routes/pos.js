const express = require('express');
const router = express.Router();
const { db } = require('../database/db');

// Get orders ready for payment (status 'served')
router.get('/pending', (req, res) => {
  const query = `
    SELECT o.id, o.order_number, o.total_amount, o.table_id, t.table_number
    FROM orders o
    LEFT JOIN tables t ON o.table_id = t.id
    WHERE o.status = 'served'
    ORDER BY o.created_at ASC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Process a payment for an order
router.post('/pay', (req, res) => {
  const { order_id, payment_method, amount } = req.body;

  if (!order_id || !payment_method || !amount) {
    return res.status(400).json({ error: 'Missing required payment information.' });
  }

  db.serialize(() => {
    // 1. Insert into payments table
    const insertPayment = 'INSERT INTO payments (order_id, payment_method, amount) VALUES (?, ?, ?)';
    db.run(insertPayment, [order_id, payment_method, amount], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // 2. Update order status to 'paid'
      const updateOrder = 'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      db.run(updateOrder, ['paid', order_id], function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // 3. Free up the table
        db.get('SELECT table_id FROM orders WHERE id = ?', [order_id], (err, order) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          if (order && order.table_id) {
            db.run('UPDATE tables SET status = ? WHERE id = ?', ['available', order.table_id]);
          }

          res.status(200).json({ message: 'Payment successful and order completed.' });
        });
      });
    });
  });
});

module.exports = router;
