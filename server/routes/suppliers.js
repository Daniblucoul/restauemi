const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { validateSupplier, validateIdParam } = require('../middleware/validation');

// Get all suppliers
router.get('/', (req, res) => {
  const { status, category } = req.query;
  let query = 'SELECT * FROM suppliers';
  const params = [];
  const conditions = [];

  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }

  if (category) {
    conditions.push('category = ?');
    params.push(category);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY name';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get single supplier
router.get('/:id', validateIdParam, (req, res) => {
  db.get('SELECT * FROM suppliers WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    res.json(row);
  });
});

// Add new supplier
router.post('/', validateSupplier, (req, res) => {
  const { name, contact_person, email, phone, address, category, status, payment_terms, notes } = req.body;
  
  const query = `INSERT INTO suppliers (name, contact_person, email, phone, address, category, status, payment_terms, notes) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(query, [
    name, 
    contact_person || null, 
    email || null, 
    phone, 
    address || null, 
    category, 
    status || 'active', 
    payment_terms || null, 
    notes || null
  ], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({
      id: this.lastID,
      message: 'Supplier added successfully'
    });
  });
});

// Update supplier
router.put('/:id', validateIdParam, validateSupplier, (req, res) => {
  const { name, contact_person, email, phone, address, category, status, payment_terms, notes } = req.body;
  
  const query = `UPDATE suppliers 
                 SET name = ?, contact_person = ?, email = ?, phone = ?, address = ?, 
                     category = ?, status = ?, payment_terms = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`;
  
  db.run(query, [
    name, 
    contact_person || null, 
    email || null, 
    phone, 
    address || null, 
    category, 
    status, 
    payment_terms || null, 
    notes || null, 
    req.params.id
  ], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    res.json({ message: 'Supplier updated successfully' });
  });
});

// Update supplier status
router.patch('/:id/status', validateIdParam, (req, res) => {
  const { status } = req.body;
  
  const validStatuses = ['active', 'inactive'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ 
      error: 'Invalid status', 
      details: [`Status must be one of: ${validStatuses.join(', ')}`] 
    });
  }

  db.run('UPDATE suppliers SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
    [status, req.params.id], 
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Supplier not found' });
      }
      res.json({ message: 'Supplier status updated successfully' });
    }
  );
});

// Delete supplier
router.delete('/:id', validateIdParam, (req, res) => {
  // First check if supplier is referenced in inventory
  db.get('SELECT COUNT(*) as count FROM inventory WHERE supplier = (SELECT name FROM suppliers WHERE id = ?)', 
    [req.params.id], 
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (row && row.count > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete supplier', 
          details: [`This supplier is referenced by ${row.count} inventory item(s)`] 
        });
      }

      // If no references, proceed with deletion
      db.run('DELETE FROM suppliers WHERE id = ?', [req.params.id], function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Supplier not found' });
        }
        res.json({ message: 'Supplier deleted successfully' });
      });
    }
  );
});

// Get supplier statistics
router.get('/:id/stats', validateIdParam, (req, res) => {
  const supplierId = req.params.id;
  
  db.get('SELECT name FROM suppliers WHERE id = ?', [supplierId], (err, supplier) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // Get inventory items from this supplier
    db.all(`SELECT * FROM inventory WHERE supplier = ? ORDER BY item_name`, 
      [supplier.name], 
      (err, items) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        const stats = {
          supplier_name: supplier.name,
          total_items: items.length,
          total_stock_value: items.reduce((sum, item) => sum + (item.quantity * item.cost_per_unit), 0),
          low_stock_items: items.filter(item => item.quantity <= item.min_quantity).length,
          items: items
        };

        res.json(stats);
      }
    );
  });
});

module.exports = router;
