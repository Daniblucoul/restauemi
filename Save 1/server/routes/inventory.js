const express = require('express');
const router = express.Router();
const { db } = require('../database/db');

// Get all inventory items
router.get('/', (req, res) => {
  const { category, low_stock } = req.query;
  let query = 'SELECT * FROM inventory';
  const params = [];

  if (category || low_stock) {
    query += ' WHERE';
    if (category) {
      query += ' category = ?';
      params.push(category);
    }
    if (low_stock === 'true') {
      if (category) query += ' AND';
      query += ' quantity <= min_quantity';
    }
  }

  query += ' ORDER BY item_name';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get single inventory item
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM inventory WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(row);
  });
});

// Add new inventory item
router.post('/', (req, res) => {
  const { item_name, category, quantity, unit, min_quantity, cost_per_unit, supplier } = req.body;
  
  const query = `INSERT INTO inventory (item_name, category, quantity, unit, min_quantity, cost_per_unit, supplier)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(query, [item_name, category, quantity, unit, min_quantity || 0, cost_per_unit || 0, supplier], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({
      id: this.lastID,
      message: 'Inventory item added successfully'
    });
  });
});

// Update inventory item
router.put('/:id', (req, res) => {
  const { item_name, category, quantity, unit, min_quantity, cost_per_unit, supplier } = req.body;
  
  const query = `UPDATE inventory 
                 SET item_name = ?, category = ?, quantity = ?, unit = ?, min_quantity = ?, cost_per_unit = ?, supplier = ?
                 WHERE id = ?`;
  
  db.run(query, [item_name, category, quantity, unit, min_quantity, cost_per_unit, supplier, req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json({ message: 'Inventory item updated successfully' });
  });
});

// Restock item
router.patch('/:id/restock', (req, res) => {
  const { quantity } = req.body;
  
  db.run('UPDATE inventory SET quantity = quantity + ?, last_restocked = CURRENT_TIMESTAMP WHERE id = ?', 
    [quantity, req.params.id], 
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Item not found' });
      }
      res.json({ message: 'Item restocked successfully' });
    }
  );
});

// Delete inventory item
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM inventory WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json({ message: 'Inventory item deleted successfully' });
  });
});

// Get inventory categories
router.get('/meta/categories', (req, res) => {
  db.all('SELECT DISTINCT category FROM inventory ORDER BY category', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows.map(row => row.category));
  });
});

module.exports = router;
