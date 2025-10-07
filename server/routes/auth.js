const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { generateToken, authenticateToken } = require('../middleware/auth');
const { validateLogin, validateRegister } = require('../middleware/validation');
const { db } = require('../database/db');

// Register a new user
router.post('/register', validateRegister, async (req, res, next) => {
  try {
    const { username, email, password, first_name, last_name, role = 'user' } = req.body;

    // Check if user already exists
    db.get(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email],
      async (err, existingUser) => {
        if (err) {
          return next(err);
        }
        
        if (existingUser) {
          return res.status(400).json({ error: 'Nom d\'utilisateur ou email déjà utilisé' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user with default avatar
        const defaultAvatar = `https://ui-avatars.com/api/?name=${first_name}+${last_name}&background=14B8A6&color=fff`;
        
        db.run(
          `INSERT INTO users (username, email, password, first_name, last_name, role, avatar_url) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [username, email, hashedPassword, first_name, last_name, role, defaultAvatar],
          function(err) {
            if (err) {
              return next(err);
            }

            // Get the created user
            db.get(
              'SELECT id, username, email, first_name, last_name, role, avatar_url FROM users WHERE id = ?',
              [this.lastID],
              (err, newUser) => {
                if (err) {
                  return next(err);
                }

                // Generate token
                const token = generateToken(newUser);

                res.status(201).json({
                  message: 'Utilisateur créé avec succès',
                  token,
                  user: newUser
                });
              }
            );
          }
        );
      }
    );
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', validateLogin, async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Find user by username or email
    db.get(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, username],
      async (err, user) => {
        if (err) {
          return next(err);
        }

        if (!user) {
          return res.status(401).json({ error: 'Identifiants invalides' });
        }

        // Check if user is active
        if (!user.is_active) {
          return res.status(403).json({ error: 'Compte désactivé' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return res.status(401).json({ error: 'Identifiants invalides' });
        }

        // Update last login
        db.run(
          'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
          [user.id]
        );

        // Generate token
        const token = generateToken(user);

        // Remove password from response
        delete user.password;

        res.json({
          message: 'Connexion réussie',
          token,
          user
        });
      }
    );
  } catch (error) {
    next(error);
  }
});

// Get current user profile
router.get('/me', authenticateToken, (req, res, next) => {
  db.get(
    'SELECT id, username, email, first_name, last_name, role, avatar_url, last_login, created_at FROM users WHERE id = ?',
    [req.user.id],
    (err, user) => {
      if (err) {
        return next(err);
      }
      
      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      res.json(user);
    }
  );
});

// Update user profile
router.put('/profile', authenticateToken, (req, res, next) => {
  const { first_name, last_name, email, avatar_url } = req.body;
  const userId = req.user.id;

  const updates = [];
  const values = [];

  if (first_name) {
    updates.push('first_name = ?');
    values.push(first_name);
  }
  if (last_name) {
    updates.push('last_name = ?');
    values.push(last_name);
  }
  if (email) {
    updates.push('email = ?');
    values.push(email);
  }
  if (avatar_url !== undefined) {
    updates.push('avatar_url = ?');
    values.push(avatar_url);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'Aucune donnée à mettre à jour' });
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(userId);

  db.run(
    `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
    values,
    function(err) {
      if (err) {
        return next(err);
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      // Get updated user
      db.get(
        'SELECT id, username, email, first_name, last_name, role, avatar_url FROM users WHERE id = ?',
        [userId],
        (err, user) => {
          if (err) {
            return next(err);
          }
          res.json({ message: 'Profil mis à jour avec succès', user });
        }
      );
    }
  );
});

// Change password
router.put('/change-password', authenticateToken, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Mots de passe requis' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
    }

    // Get current user password
    db.get(
      'SELECT password FROM users WHERE id = ?',
      [userId],
      async (err, user) => {
        if (err) {
          return next(err);
        }

        if (!user) {
          return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
          return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        db.run(
          'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [hashedPassword, userId],
          function(err) {
            if (err) {
              return next(err);
            }
            res.json({ message: 'Mot de passe modifié avec succès' });
          }
        );
      }
    );
  } catch (error) {
    next(error);
  }
});

// Create default admin user if no users exist
const createDefaultAdmin = () => {
  db.get('SELECT COUNT(*) as count FROM users', (err, result) => {
    if (err) {
      console.error('Error checking users:', err);
      return;
    }

    if (result.count === 0) {
      bcrypt.hash('admin123', 10).then(hashedPassword => {
        const defaultAvatar = 'https://ui-avatars.com/api/?name=Admin+Restaurant&background=14B8A6&color=fff';
        
        db.run(
          `INSERT INTO users (username, email, password, first_name, last_name, role, avatar_url) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          ['admin', 'admin@restaurant-emi.com', hashedPassword, 'Admin', 'Restaurant', 'admin', defaultAvatar],
          (err) => {
            if (err) {
              console.error('Error creating default admin:', err);
            } else {
              console.log('Default admin user created (username: admin, password: admin123)');
            }
          }
        );
      }).catch(err => {
        console.error('Error hashing password:', err);
      });
    }
  });
};

// Call this when the module is loaded
setTimeout(createDefaultAdmin, 1000);

module.exports = router;
