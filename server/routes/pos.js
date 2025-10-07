const express = require('express');
const router = express.Router();
const { db } = require('../database/db');

// Get orders ready for payment (status 'served' or 'ready')
router.get('/pending', (req, res) => {
  const query = `
    SELECT o.id, o.total_amount, o.table_id, t.table_number as table_name, o.customer_name, o.status
    FROM orders o
    LEFT JOIN tables t ON o.table_id = t.id
    WHERE o.status IN ('served', 'ready', 'preparing')
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
router.post('/pay/:id', (req, res) => {
  const orderId = req.params.id;
  const { payment_method } = req.body;

  if (!payment_method) {
    return res.status(400).json({ error: 'Payment method is required.' });
  }

  db.serialize(() => {
    // 1. Get order items to deduct inventory
    db.all(`
      SELECT oi.menu_item_id, oi.quantity
      FROM order_items oi
      WHERE oi.order_id = ?
    `, [orderId], (err, orderItems) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // 2. For each order item, deduct ingredients from inventory
      const deductPromises = orderItems.map(item => {
        return new Promise((resolve, reject) => {
          // Get recipe for this menu item
          db.all(`
            SELECT r.inventory_item_id, r.quantity_required
            FROM recipes r
            WHERE r.menu_item_id = ?
          `, [item.menu_item_id], (err, ingredients) => {
            if (err) {
              return reject(err);
            }

            // Deduct each ingredient
            if (ingredients && ingredients.length > 0) {
              const deductStmt = db.prepare('UPDATE inventory SET quantity = quantity - ? WHERE id = ?');
              ingredients.forEach(ing => {
                const totalToDeduct = ing.quantity_required * item.quantity;
                deductStmt.run(totalToDeduct, ing.inventory_item_id);
              });
              deductStmt.finalize(resolve);
            } else {
              resolve();
            }
          });
        });
      });

      // 3. Wait for all deductions, then update order status
      Promise.all(deductPromises)
        .then(() => {
          // Update order status to 'completed'
          const updateOrder = 'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
          db.run(updateOrder, ['completed', orderId], function(err) {
            if (err) {
              return res.status(500).json({ error: err.message });
            }

            // Free up the table
            db.get('SELECT table_id FROM orders WHERE id = ?', [orderId], (err, order) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }
              if (order && order.table_id) {
                db.run('UPDATE tables SET status = ? WHERE id = ?', ['available', order.table_id]);
              }

              res.status(200).json({ 
                message: 'Payment successful, order completed, and inventory updated.',
                orderId: orderId,
                paymentMethod: payment_method
              });
            });
          });
        })
        .catch(err => {
          res.status(500).json({ error: 'Failed to update inventory: ' + err.message });
        });
    });
  });
});

module.exports = router;
