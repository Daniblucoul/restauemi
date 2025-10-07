const express = require('express');
const router = express.Router();
const { db } = require('../database/db');

// Sales summary
router.get('/sales', (req, res) => {
  const { start_date, end_date } = req.query;
  
  let query = `SELECT 
    COUNT(*) as total_orders,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as average_order_value,
    DATE(created_at) as date
    FROM orders WHERE status = 'completed'`;
  
  const params = [];
  
  if (start_date && end_date) {
    query += ' AND DATE(created_at) BETWEEN ? AND ?';
    params.push(start_date, end_date);
  }
  
  query += ' GROUP BY DATE(created_at) ORDER BY date DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Inventory costs
router.get('/inventory-costs', (req, res) => {
  db.all(`SELECT 
    category,
    SUM(quantity * cost_per_unit) as total_value,
    COUNT(*) as item_count
    FROM inventory
    GROUP BY category
    ORDER BY total_value DESC`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Dashboard stats
router.get('/dashboard', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  
  const stats = {};
  
  // Today's revenue
  db.get(`SELECT SUM(total_amount) as revenue, COUNT(*) as orders 
          FROM orders WHERE DATE(created_at) = ? AND status = 'completed'`, 
    [today], (err, row) => {
      stats.today_revenue = row?.revenue || 0;
      stats.today_orders = row?.orders || 0;
      
      // Low stock items
      db.get('SELECT COUNT(*) as count FROM inventory WHERE quantity <= min_quantity', [], (err, row) => {
        stats.low_stock_items = row?.count || 0;
        
        // Today's reservations
        db.get('SELECT COUNT(*) as count FROM reservations WHERE DATE(reservation_time) = ?', [today], (err, row) => {
          stats.today_reservations = row?.count || 0;
          
          // Active staff
          db.get('SELECT COUNT(*) as count FROM staff WHERE status = ?', ['active'], (err, row) => {
            stats.active_staff = row?.count || 0;
            
            res.json(stats);
          });
        });
      });
    });
});

module.exports = router;
