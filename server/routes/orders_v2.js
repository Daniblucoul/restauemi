const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { validateOrder, validateIdParam } = require('../middleware/validation');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

// Get all orders
router.get('/', asyncHandler(async (req, res) => {
  const query = `
    SELECT o.*, t.table_number as table_name
    FROM orders o 
    LEFT JOIN tables t ON o.table_id = t.id
    ORDER BY o.created_at DESC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      throw new AppError('Failed to fetch orders', 500, err.message);
    }
    
    const orders = rows.map(order => {
      try {
        return {
          ...order,
          items: order.items ? JSON.parse(order.items) : []
        };
      } catch (e) {
        console.error(`Error parsing items for order ${order.id}:`, e);
        return {
          ...order,
          items: []
        };
      }
    });
    
    res.json({ status: 'success', data: orders });
  });
}));

// Get single order by ID
router.get('/:id', validateIdParam, asyncHandler(async (req, res) => {
  const query = `
    SELECT o.*, t.table_number as table_name
    FROM orders o 
    LEFT JOIN tables t ON o.table_id = t.id
    WHERE o.id = ?
  `;
  
  db.get(query, [req.params.id], (err, order) => {
    if (err) {
      throw new AppError('Failed to fetch order', 500, err.message);
    }
    if (!order) {
      throw new AppError('Order not found', 404);
    }
    
    try {
      order.items = order.items ? JSON.parse(order.items) : [];
    } catch (e) {
      console.error('Error parsing order items:', e);
      order.items = [];
    }
    
    res.json({ status: 'success', data: order });
  });
}));

// Create new order with improved transaction handling
router.post('/', validateOrder, asyncHandler(async (req, res) => {
  const { table_id, customer_name, items, total_amount, status, order_type, notes } = req.body;

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN IMMEDIATE TRANSACTION', (err) => {
        if (err) return reject(new AppError('Failed to start transaction', 500, err.message));

        // Step 1: Check inventory availability for all items
        let stockCheckError = null;
        let itemsProcessed = 0;
        const stockChecks = [];

        items.forEach(item => {
          const getRecipe = `SELECT ir.inventory_item_id, ir.quantity_required, i.quantity, i.item_name
                             FROM recipes ir
                             JOIN inventory i ON ir.inventory_item_id = i.id
                             WHERE ir.menu_item_id = ?`;
          
          db.all(getRecipe, [item.id], (err, ingredients) => {
            itemsProcessed++;
            
            if (err) {
              stockCheckError = new AppError('Failed to check inventory', 500, err.message);
            } else if (ingredients && ingredients.length > 0) {
              ingredients.forEach(ingredient => {
                const requiredAmount = ingredient.quantity_required * item.quantity;
                if (ingredient.quantity < requiredAmount) {
                  stockCheckError = new AppError(
                    `Insufficient stock for ${ingredient.item_name}. Required: ${requiredAmount}, Available: ${ingredient.quantity}`,
                    400
                  );
                }
                stockChecks.push({ ...ingredient, requiredAmount });
              });
            }

            // When all items are checked
            if (itemsProcessed === items.length) {
              if (stockCheckError) {
                db.run('ROLLBACK');
                return reject(stockCheckError);
              }
              proceedWithOrder();
            }
          });
        });

        // If no items have recipes, proceed immediately
        if (items.length === 0) {
          return reject(new AppError('Order must contain at least one item', 400));
        }

        const proceedWithOrder = () => {
          // Step 2: Create the order
          const itemsJson = JSON.stringify(items);
          const orderQuery = `INSERT INTO orders (table_id, customer_name, total_amount, status, order_type, items, notes, order_time) 
                              VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`;
          
          db.run(orderQuery, [table_id, customer_name, total_amount, status || 'pending', order_type || 'dine-in', itemsJson, notes], function(err) {
            if (err) {
              db.run('ROLLBACK');
              return reject(new AppError('Failed to create order', 500, err.message));
            }
            
            const orderId = this.lastID;

            // Step 3: Insert order items
            const itemStmt = db.prepare('INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES (?, ?, ?, ?)');
            let itemInsertError = null;

            items.forEach(item => {
              itemStmt.run(orderId, item.id, item.quantity, item.price, (err) => {
                if (err && !itemInsertError) {
                  itemInsertError = err;
                }
              });
            });

            itemStmt.finalize((err) => {
              if (err || itemInsertError) {
                db.run('ROLLBACK');
                return reject(new AppError('Failed to insert order items', 500, (err || itemInsertError).message));
              }

              // Step 4: Update inventory
              let inventoryUpdateError = null;
              let updatesCompleted = 0;
              const totalUpdates = stockChecks.length;

              if (totalUpdates === 0) {
                // No inventory to update, commit transaction
                db.run('COMMIT', (err) => {
                  if (err) {
                    db.run('ROLLBACK');
                    return reject(new AppError('Failed to commit transaction', 500, err.message));
                  }
                  resolve(res.status(201).json({ 
                    status: 'success', 
                    data: { id: orderId, message: 'Order created successfully' }
                  }));
                });
                return;
              }

              stockChecks.forEach(check => {
                const updateStock = `UPDATE inventory SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP 
                                     WHERE id = ? AND quantity >= ?`;
                
                db.run(updateStock, [check.requiredAmount, check.inventory_item_id, check.requiredAmount], function(err) {
                  updatesCompleted++;
                  
                  if (err) {
                    inventoryUpdateError = err;
                  } else if (this.changes === 0) {
                    inventoryUpdateError = new Error(`Failed to update inventory for ${check.item_name} - concurrent modification detected`);
                  }

                  // When all updates are done
                  if (updatesCompleted === totalUpdates) {
                    if (inventoryUpdateError) {
                      db.run('ROLLBACK');
                      return reject(new AppError('Failed to update inventory', 500, inventoryUpdateError.message));
                    }

                    // Step 5: Update table status if applicable
                    if (table_id && order_type === 'dine-in') {
                      db.run('UPDATE tables SET status = ? WHERE id = ?', ['occupied', table_id], (err) => {
                        // Non-critical error, just log it
                        if (err) console.error('Failed to update table status:', err);
                        
                        commitTransaction();
                      });
                    } else {
                      commitTransaction();
                    }
                  }
                });
              });

              const commitTransaction = () => {
                db.run('COMMIT', (err) => {
                  if (err) {
                    db.run('ROLLBACK');
                    return reject(new AppError('Failed to commit transaction', 500, err.message));
                  }
                  resolve(res.status(201).json({ 
                    status: 'success', 
                    data: { 
                      id: orderId, 
                      message: 'Order created successfully and inventory updated' 
                    }
                  }));
                });
              };
            });
          });
        };
      });
    });
  });
}));

// Update order status
router.patch('/:id/status', validateIdParam, asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'preparing', 'ready', 'served', 'completed', 'cancelled'];
  
  if (!status || !validStatuses.includes(status)) {
    throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
  }

  db.run('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
    [status, req.params.id], 
    function(err) {
      if (err) {
        throw new AppError('Failed to update order status', 500, err.message);
      }
      if (this.changes === 0) {
        throw new AppError('Order not found', 404);
      }
      res.json({ status: 'success', message: 'Order status updated successfully' });
    }
  );
}));

// Delete order
router.delete('/:id', validateIdParam, asyncHandler(async (req, res) => {
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // First check if order exists
    db.get('SELECT id, status FROM orders WHERE id = ?', [req.params.id], (err, order) => {
      if (err) {
        db.run('ROLLBACK');
        throw new AppError('Failed to check order', 500, err.message);
      }
      if (!order) {
        db.run('ROLLBACK');
        throw new AppError('Order not found', 404);
      }
      
      // Prevent deletion of completed orders (optional business rule)
      if (order.status === 'completed') {
        db.run('ROLLBACK');
        throw new AppError('Cannot delete completed orders', 400);
      }

      // Delete order (order_items will be deleted automatically via CASCADE)
      db.run('DELETE FROM orders WHERE id = ?', [req.params.id], function(err) {
        if (err) {
          db.run('ROLLBACK');
          throw new AppError('Failed to delete order', 500, err.message);
        }
        
        db.run('COMMIT', (err) => {
          if (err) {
            db.run('ROLLBACK');
            throw new AppError('Failed to commit deletion', 500, err.message);
          }
          res.json({ status: 'success', message: 'Order deleted successfully' });
        });
      });
    });
  });
}));

module.exports = router;
