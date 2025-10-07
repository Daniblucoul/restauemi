const express = require('express');
const router = express.Router();
const { db } = require('../database/db');

// Get sales statistics
router.get('/stats', (req, res) => {
  const { startDate, endDate } = req.query;
  
  let dateFilter = '';
  const params = [];
  
  if (startDate && endDate) {
    dateFilter = 'WHERE DATE(order_time) BETWEEN ? AND ?';
    params.push(startDate, endDate);
  } else if (startDate) {
    dateFilter = 'WHERE DATE(order_time) >= ?';
    params.push(startDate);
  } else if (endDate) {
    dateFilter = 'WHERE DATE(order_time) <= ?';
    params.push(endDate);
  }

  const query = `
    SELECT 
      COUNT(*) as total_orders,
      SUM(total_amount) as total_revenue,
      AVG(total_amount) as average_order,
      MIN(total_amount) as min_order,
      MAX(total_amount) as max_order,
      SUM(CASE WHEN order_type = 'dine-in' THEN 1 ELSE 0 END) as dine_in_count,
      SUM(CASE WHEN order_type = 'takeaway' THEN 1 ELSE 0 END) as takeaway_count,
      SUM(CASE WHEN order_type = 'delivery' THEN 1 ELSE 0 END) as delivery_count,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders
    FROM orders
    ${dateFilter}
  `;

  db.get(query, params, (err, stats) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(stats || {
      total_orders: 0,
      total_revenue: 0,
      average_order: 0,
      min_order: 0,
      max_order: 0,
      dine_in_count: 0,
      takeaway_count: 0,
      delivery_count: 0,
      completed_orders: 0,
      cancelled_orders: 0
    });
  });
});

// Get sales by date
router.get('/by-date', (req, res) => {
  const { startDate, endDate } = req.query;
  
  let dateFilter = '';
  const params = [];
  
  if (startDate && endDate) {
    dateFilter = 'WHERE DATE(order_time) BETWEEN ? AND ?';
    params.push(startDate, endDate);
  }

  const query = `
    SELECT 
      DATE(order_time) as date,
      COUNT(*) as order_count,
      SUM(total_amount) as revenue
    FROM orders
    ${dateFilter}
    GROUP BY DATE(order_time)
    ORDER BY DATE(order_time) DESC
    LIMIT 30
  `;

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

// Get top selling items
router.get('/top-items', (req, res) => {
  const { limit = 10 } = req.query;

  const query = `
    SELECT 
      oi.menu_item_id,
      m.name as item_name,
      m.price,
      m.category,
      SUM(oi.quantity) as total_quantity,
      SUM(oi.quantity * oi.price) as total_revenue
    FROM order_items oi
    JOIN menu_items m ON oi.menu_item_id = m.id
    JOIN orders o ON oi.order_id = o.id
    WHERE o.status IN ('completed', 'served')
    GROUP BY oi.menu_item_id, m.name, m.price, m.category
    ORDER BY total_quantity DESC
    LIMIT ?
  `;

  db.all(query, [parseInt(limit)], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

// Get recent sales
router.get('/recent', (req, res) => {
  const { limit = 20 } = req.query;

  const query = `
    SELECT 
      o.*,
      t.table_number
    FROM orders o
    LEFT JOIN tables t ON o.table_id = t.id
    ORDER BY o.order_time DESC
    LIMIT ?
  `;

  db.all(query, [parseInt(limit)], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const orders = rows.map(order => {
      try {
        return {
          ...order,
          items: order.items ? JSON.parse(order.items) : []
        };
      } catch (e) {
        return {
          ...order,
          items: []
        };
      }
    });
    
    res.json(orders);
  });
});

// Get payment methods statistics
router.get('/payment-methods', (req, res) => {
  const query = `
    SELECT 
      'cash' as method,
      COUNT(*) as count,
      SUM(total_amount) as total
    FROM orders
    WHERE status = 'completed'
    UNION ALL
    SELECT 
      'card' as method,
      0 as count,
      0 as total
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

module.exports = router;
