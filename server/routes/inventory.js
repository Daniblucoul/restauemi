const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { validateInventoryItem, validateIdParam } = require('../middleware/validation');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

// Get all inventory items
router.get('/', asyncHandler(async (req, res) => {
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
      throw new AppError('Failed to fetch inventory items', 500, err.message);
    }
    res.json({ status: 'success', data: rows, count: rows.length });
  });
}));

// Get single inventory item
router.get('/:id', validateIdParam, asyncHandler(async (req, res) => {
  db.get('SELECT * FROM inventory WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      throw new AppError('Failed to fetch inventory item', 500, err.message);
    }
    if (!row) {
      throw new AppError('Inventory item not found', 404);
    }
    res.json({ status: 'success', data: row });
  });
}));

// Add new inventory item
router.post('/', validateInventoryItem, asyncHandler(async (req, res) => {
  const { item_name, category, quantity, unit, min_quantity, cost_per_unit, supplier } = req.body;
  
  const query = `INSERT INTO inventory (item_name, category, quantity, unit, min_quantity, cost_per_unit, supplier)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(query, [item_name, category, quantity || 0, unit, min_quantity || 0, cost_per_unit || 0, supplier], function(err) {
    if (err) {
      throw new AppError('Failed to add inventory item', 500, err.message);
    }
    res.status(201).json({
      status: 'success',
      data: {
        id: this.lastID,
        message: 'Inventory item added successfully'
      }
    });
  });
}));

// Update inventory item
router.put('/:id', validateIdParam, validateInventoryItem, asyncHandler(async (req, res) => {
  const { item_name, category, quantity, unit, min_quantity, cost_per_unit, supplier } = req.body;
  
  const query = `UPDATE inventory 
                 SET item_name = ?, category = ?, quantity = ?, unit = ?, min_quantity = ?, cost_per_unit = ?, supplier = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`;
  
  db.run(query, [item_name, category, quantity, unit, min_quantity, cost_per_unit, supplier, req.params.id], function(err) {
    if (err) {
      throw new AppError('Failed to update inventory item', 500, err.message);
    }
    if (this.changes === 0) {
      throw new AppError('Inventory item not found', 404);
    }
    res.json({ status: 'success', message: 'Inventory item updated successfully' });
  });
}));

// Restock item
router.patch('/:id/restock', validateIdParam, asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  
  // Validate quantity
  if (!quantity || typeof quantity !== 'number' || quantity <= 0) {
    throw new AppError('Quantity must be a positive number', 400);
  }
  
  db.run('UPDATE inventory SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
    [quantity, req.params.id], 
    function(err) {
      if (err) {
        throw new AppError('Failed to restock item', 500, err.message);
      }
      if (this.changes === 0) {
        throw new AppError('Inventory item not found', 404);
      }
      res.json({ status: 'success', message: 'Item restocked successfully', quantity_added: quantity });
    }
  );
}));

// Delete inventory item
router.delete('/:id', validateIdParam, asyncHandler(async (req, res) => {
  // Check if item is used in any recipes
  db.get('SELECT COUNT(*) as count FROM recipes WHERE inventory_item_id = ?', [req.params.id], (err, result) => {
    if (err) {
      throw new AppError('Failed to check item dependencies', 500, err.message);
    }
    
    if (result.count > 0) {
      throw new AppError(`Cannot delete item. It is used in ${result.count} recipe(s)`, 409);
    }
    
    db.run('DELETE FROM inventory WHERE id = ?', [req.params.id], function(err) {
      if (err) {
        throw new AppError('Failed to delete inventory item', 500, err.message);
      }
      if (this.changes === 0) {
        throw new AppError('Inventory item not found', 404);
      }
      res.json({ status: 'success', message: 'Inventory item deleted successfully' });
    });
  });
}));

// Get inventory categories
router.get('/meta/categories', asyncHandler(async (req, res) => {
  db.all('SELECT DISTINCT category FROM inventory WHERE category IS NOT NULL ORDER BY category', [], (err, rows) => {
    if (err) {
      throw new AppError('Failed to fetch categories', 500, err.message);
    }
    res.json({ status: 'success', data: rows.map(row => row.category) });
  });
}));

module.exports = router;
