const express = require('express');
const router = express.Router();
const { db } = require('../database/db');

// Note: The recipes table is created in db.js with proper foreign keys

// @route   POST /api/recipes
// @desc    Create or update a recipe for a menu item
router.post('/', async (req, res) => {
  const { menu_item_id, ingredients } = req.body;

  console.log('Received recipe request:', { menu_item_id, ingredients });

  if (!menu_item_id || !ingredients || !Array.isArray(ingredients)) {
    return res.status(400).json({ error: 'Menu item ID and ingredients array are required.' });
  }

  // If ingredients array is empty, just delete existing recipes
  if (ingredients.length === 0) {
    db.run('DELETE FROM recipes WHERE menu_item_id = ?', [menu_item_id], (err) => {
      if (err) {
        console.error('Delete empty recipe error:', err);
        return res.status(500).json({ error: `Failed to clear recipe: ${err.message}` });
      }
      return res.status(200).json({ message: 'Recipe cleared successfully' });
    });
    return;
  }

  // Use explicit transaction
  db.run('BEGIN TRANSACTION', (beginErr) => {
    if (beginErr) {
      console.error('BEGIN TRANSACTION error:', beginErr);
      return res.status(500).json({ error: 'Failed to start transaction' });
    }

    // Delete existing recipes
    db.run('DELETE FROM recipes WHERE menu_item_id = ?', [menu_item_id], (deleteErr) => {
      if (deleteErr) {
        console.error('DELETE error:', deleteErr);
        return db.run('ROLLBACK', () => {
          res.status(500).json({ error: `Delete failed: ${deleteErr.message}` });
        });
      }

      // Insert all ingredients
      const insertPromises = [];
      
      for (let i = 0; i < ingredients.length; i++) {
        const ing = ingredients[i];
        insertPromises.push(new Promise((resolve, reject) => {
          db.run(
            'INSERT INTO recipes (menu_item_id, inventory_item_id, quantity_required) VALUES (?, ?, ?)',
            [menu_item_id, ing.inventory_item_id, ing.quantity_required],
            function(insertErr) {
              if (insertErr) {
                console.error(`INSERT error for ingredient ${i}:`, insertErr);
                reject(insertErr);
              } else {
                console.log(`Inserted ingredient ${i}: ${this.lastID}`);
                resolve(this.lastID);
              }
            }
          );
        }));
      }

      // Wait for all inserts
      Promise.all(insertPromises)
        .then(() => {
          // Commit transaction
          db.run('COMMIT', (commitErr) => {
            if (commitErr) {
              console.error('COMMIT error:', commitErr);
              return db.run('ROLLBACK', () => {
                res.status(500).json({ error: 'Failed to commit transaction' });
              });
            }
            console.log('Recipe saved successfully');
            res.status(201).json({ message: 'Recipe saved successfully' });
          });
        })
        .catch((insertErr) => {
          console.error('Insert promise error:', insertErr);
          db.run('ROLLBACK', () => {
            res.status(500).json({ error: `Insert failed: ${insertErr.message}` });
          });
        });
    });
  });
});

// @route   GET /api/recipes/:menu_item_id
// @desc    Get the recipe for a menu item
router.get('/:menu_item_id', (req, res) => {
  const { menu_item_id } = req.params;
  db.all(`
    SELECT r.inventory_item_id, i.item_name, r.quantity_required, i.unit
    FROM recipes r
    JOIN inventory i ON r.inventory_item_id = i.id
    WHERE r.menu_item_id = ?
  `, [menu_item_id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

module.exports = router;
