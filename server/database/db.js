const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'restaurant.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    return console.error('Could not connect to database', err.message);
  }
  console.log('Connected to the SQLite database.');
  // Enable WAL mode for better concurrency
  db.run('PRAGMA journal_mode = WAL;');
});

const initDatabase = () => {
  db.serialize(() => {
    console.log('Initializing database...');

    // Enable foreign keys support
    db.run('PRAGMA foreign_keys = ON;');

    // Create tables with proper constraints
    
    // Settings table
    db.run(`CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Tables table
    db.run(`CREATE TABLE IF NOT EXISTS tables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_number TEXT NOT NULL UNIQUE,
      capacity INTEGER NOT NULL CHECK(capacity > 0),
      status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'occupied', 'reserved', 'maintenance')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Staff table
    db.run(`CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      role TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'on_leave')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Users table for authentication
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'manager', 'staff', 'user')),
      avatar_url TEXT,
      is_active BOOLEAN DEFAULT 1,
      last_login DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Inventory table
    db.run(`CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_name TEXT NOT NULL,
      category TEXT,
      quantity REAL NOT NULL DEFAULT 0 CHECK(quantity >= 0),
      unit TEXT NOT NULL,
      min_quantity REAL NOT NULL DEFAULT 0 CHECK(min_quantity >= 0),
      cost_per_unit REAL DEFAULT 0 CHECK(cost_per_unit >= 0),
      supplier TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Menu items table
    db.run(`CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL CHECK(price >= 0),
      category TEXT NOT NULL,
      available INTEGER NOT NULL DEFAULT 1 CHECK(available IN (0, 1)),
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Reservations table
    db.run(`CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      table_id INTEGER,
      reservation_time DATETIME NOT NULL,
      party_size INTEGER NOT NULL CHECK(party_size > 0),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE SET NULL
    )`);

    // Orders table
    db.run(`CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_id INTEGER,
      customer_name TEXT,
      order_type TEXT NOT NULL DEFAULT 'dine-in' CHECK(order_type IN ('dine-in', 'takeaway', 'delivery')),
      total_amount REAL NOT NULL DEFAULT 0 CHECK(total_amount >= 0),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'preparing', 'ready', 'served', 'completed', 'cancelled')),
      items TEXT,
      notes TEXT,
      order_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE SET NULL
    )`);

    // Order items table
    db.run(`CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      menu_item_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL CHECK(quantity > 0),
      price REAL NOT NULL CHECK(price >= 0),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE RESTRICT
    )`);

    // Recipes table (linking menu items to inventory)
    db.run(`CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      menu_item_id INTEGER NOT NULL,
      inventory_item_id INTEGER NOT NULL,
      quantity_required REAL NOT NULL CHECK(quantity_required > 0),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
      FOREIGN KEY (inventory_item_id) REFERENCES inventory(id) ON DELETE CASCADE,
      UNIQUE(menu_item_id, inventory_item_id)
    )`);

    // HACCP logs table
    db.run(`CREATE TABLE IF NOT EXISTS haccp_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      log_type TEXT NOT NULL CHECK(log_type IN ('temperature', 'cleaning', 'receiving', 'storage', 'other')),
      description TEXT NOT NULL,
      temperature REAL,
      staff_id INTEGER,
      status TEXT DEFAULT 'ok' CHECK(status IN ('ok', 'warning', 'critical')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL
    )`);

    // Suppliers table
    db.run(`CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact_person TEXT,
      email TEXT,
      phone TEXT NOT NULL,
      address TEXT,
      category TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      payment_terms TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Create indexes for better performance
    db.run('CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)');
    db.run('CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders(table_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at)');
    db.run('CREATE INDEX IF NOT EXISTS idx_reservations_time ON reservations(reservation_time)');
    db.run('CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status)');
    db.run('CREATE INDEX IF NOT EXISTS idx_inventory_quantity ON inventory(quantity)');
    db.run('CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_haccp_created_at ON haccp_logs(created_at)');
    db.run('CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status)');
    db.run('CREATE INDEX IF NOT EXISTS idx_suppliers_category ON suppliers(category)');

    // Migration: Add image_url column to menu_items if it doesn't exist
    db.all("PRAGMA table_info(menu_items)", (err, columns) => {
      if (!err && columns) {
        const hasImageUrl = columns.some(col => col.name === 'image_url');
        if (!hasImageUrl) {
          db.run('ALTER TABLE menu_items ADD COLUMN image_url TEXT', (err) => {
            if (err) {
              console.log('Column image_url might already exist or error:', err.message);
            } else {
              console.log('Added image_url column to menu_items table');
            }
          });
        }
      }
    });

    // Seed data
    db.get('SELECT COUNT(*) as count FROM settings', (err, row) => {
      if (!err && row && row.count === 0) {
        db.run(`INSERT INTO settings (key, value) VALUES ('currency', 'FCFA')`);
        console.log('Seeded settings.');
      }
    });

    db.get('SELECT COUNT(*) as count FROM staff', (err, row) => {
      if (!err && row && row.count === 0) {
        const stmt = db.prepare('INSERT INTO staff (first_name, last_name, role, status) VALUES (?, ?, ?, ?)');
        stmt.run('Jean', 'Dupont', 'Chef', 'active');
        stmt.run('Alice', 'Martin', 'Serveuse', 'active');
        stmt.run('Marc', 'Lefebvre', 'Sous-chef', 'active');
        stmt.finalize();
        console.log('Seeded staff.');
      }
    });

    db.get('SELECT COUNT(*) as count FROM tables', (err, row) => {
      if (!err && row && row.count === 0) {
        const stmt = db.prepare('INSERT INTO tables (table_number, capacity, status) VALUES (?, ?, ?)');
        stmt.run('T1', 2, 'available');
        stmt.run('T2', 4, 'available');
        stmt.run('T3', 4, 'available');
        stmt.run('T4', 6, 'available');
        stmt.run('T5', 8, 'available');
        stmt.finalize();
        console.log('Seeded tables.');
      }
    });

    db.get('SELECT COUNT(*) as count FROM menu_items', (err, row) => {
      if (!err && row && row.count === 0) {
        const stmt = db.prepare('INSERT INTO menu_items (name, description, price, category, available) VALUES (?, ?, ?, ?, ?)');
        // Entrées
        stmt.run('Salade César', 'Salade romaine, poulet grillé, parmesan, croûtons', 3500, 'Entrées', 1);
        stmt.run('Soupe du jour', 'Soupe maison préparée avec des légumes frais', 2000, 'Entrées', 1);
        stmt.run('Bruschetta', 'Pain grillé, tomates fraîches, basilic, huile d\'olive', 2500, 'Entrées', 1);
        
        // Plats principaux
        stmt.run('Poulet rôti', 'Poulet rôti accompagné de frites et légumes', 6000, 'Plats', 1);
        stmt.run('Poisson grillé', 'Poisson du jour grillé avec riz et légumes', 7500, 'Plats', 1);
        stmt.run('Steak frites', 'Steak de bœuf avec frites maison', 8000, 'Plats', 1);
        stmt.run('Pasta Carbonara', 'Pâtes fraîches, bacon, œuf, parmesan', 5500, 'Plats', 1);
        stmt.run('Pizza Margherita', 'Tomate, mozzarella, basilic', 5000, 'Plats', 1);
        stmt.run('Burger maison', 'Pain brioche, bœuf, cheddar, salade, tomate', 6500, 'Plats', 1);
        
        // Desserts
        stmt.run('Tiramisu', 'Dessert italien traditionnel', 3000, 'Desserts', 1);
        stmt.run('Tarte citron', 'Tarte au citron meringuée', 2500, 'Desserts', 1);
        stmt.run('Mousse chocolat', 'Mousse au chocolat noir', 2500, 'Desserts', 1);
        
        // Boissons
        stmt.run('Coca-Cola', 'Boisson gazeuse 33cl', 1000, 'Boissons', 1);
        stmt.run('Eau minérale', 'Eau plate ou gazeuse 50cl', 500, 'Boissons', 1);
        stmt.run('Jus d\'orange', 'Jus d\'orange frais pressé', 1500, 'Boissons', 1);
        stmt.run('Café', 'Café expresso', 800, 'Boissons', 1);
        
        stmt.finalize();
        console.log('Seeded menu items.');
      }
    });

    db.get('SELECT COUNT(*) as count FROM suppliers', (err, row) => {
      if (!err && row && row.count === 0) {
        const stmt = db.prepare(`INSERT INTO suppliers (name, contact_person, email, phone, address, category, status, payment_terms) 
                                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
        stmt.run('Marché Central', 'Ali Hassan', 'ali@marchecentral.cm', '+237 690 123 456', 'Avenue des Cocotiers, Douala', 'Fruits et Légumes', 'active', 'Net 30');
        stmt.run('Boucherie du Quartier', 'Jean-Paul Nkono', 'jp@boucherie.cm', '+237 691 234 567', 'Rue du Commerce, Yaoundé', 'Viandes', 'active', 'Paiement comptant');
        stmt.run('Poissonnerie Atlantique', 'Marie Douala', 'contact@atlantique.cm', '+237 692 345 678', 'Port de Douala', 'Poissons et Fruits de mer', 'active', 'Net 15');
        stmt.run('Épicerie Fine Import', 'François Biya', 'info@epiceriefine.cm', '+237 693 456 789', 'Quartier Bonanjo, Douala', 'Épicerie sèche', 'active', 'Net 30');
        stmt.run('Laiterie Moderne', 'Amadou Sow', 'contact@laiteriemoderne.cm', '+237 694 567 890', 'Zone Industrielle, Douala', 'Produits laitiers', 'active', 'Net 7');
        stmt.finalize();
        console.log('Seeded suppliers.');
      }
    });

    db.get('SELECT COUNT(*) as count FROM inventory', (err, row) => {
      if (!err && row && row.count === 0) {
        const stmt = db.prepare(`INSERT INTO inventory (item_name, category, quantity, unit, min_quantity, cost_per_unit, supplier) 
                                   VALUES (?, ?, ?, ?, ?, ?, ?)`);
        // Ingrédients avec stocks normaux
        stmt.run('Tomates', 'Fruits et Légumes', 50, 'kg', 10, 500, 'Marché Central');
        stmt.run('Oignons', 'Fruits et Légumes', 30, 'kg', 8, 300, 'Marché Central');
        stmt.run('Huile d\'olive', 'Épicerie', 20, 'litres', 5, 2500, 'Épicerie Fine Import');
        stmt.run('Farine', 'Épicerie', 100, 'kg', 15, 400, 'Épicerie Fine Import');
        stmt.run('Fromage parmesan', 'Produits laitiers', 15, 'kg', 3, 8000, 'Laiterie Moderne');
        
        // Articles avec stock faible (pour déclencher les alertes)
        stmt.run('Poulet', 'Viandes', 2, 'kg', 5, 3000, 'Boucherie du Quartier');
        stmt.run('Saumon frais', 'Poissons', 1, 'kg', 3, 12000, 'Poissonnerie Atlantique');
        stmt.run('Crème fraîche', 'Produits laitiers', 0.5, 'litres', 2, 1500, 'Laiterie Moderne');
        stmt.run('Basilic frais', 'Fruits et Légumes', 0.2, 'kg', 1, 2000, 'Marché Central');
        
        stmt.finalize();
        console.log('Seeded inventory with low stock items.');
      }
    });
    
    console.log('Database initialization finished.');
  });
};

module.exports = { db, initDatabase };
