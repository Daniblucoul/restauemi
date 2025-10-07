const express = require('express');
const router = express.Router();
const { db } = require('../database/db');

// Get all menu items
router.get('/', (req, res) => {
  db.all('SELECT * FROM menu_items ORDER BY category, name', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get a specific menu item
router.get('/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM menu_items WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    res.json(row);
  });
});

// Create a new menu item
router.post('/', (req, res) => {
  const { name, description, price, category, available, image_url } = req.body;

  if (!name || !price || !category) {
    return res.status(400).json({ error: 'Name, price, and category are required' });
  }

  const query = 'INSERT INTO menu_items (name, description, price, category, available, image_url) VALUES (?, ?, ?, ?, ?, ?)';
  db.run(query, [name, description, price, category, available !== undefined ? available : 1, image_url || null], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID, message: 'Menu item created successfully' });
  });
});

// Update a menu item
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, price, category, available, image_url } = req.body;

  if (!name || !price || !category) {
    return res.status(400).json({ error: 'Name, price, and category are required' });
  }

  const query = 'UPDATE menu_items SET name = ?, description = ?, price = ?, category = ?, available = ?, image_url = ? WHERE id = ?';
  db.run(query, [name, description, price, category, available, image_url || null, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    res.json({ message: 'Menu item updated successfully' });
  });
});

// Delete a menu item
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM menu_items WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    res.json({ message: 'Menu item deleted successfully' });
  });
});

module.exports = router;
