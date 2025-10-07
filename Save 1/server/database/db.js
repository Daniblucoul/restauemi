const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'restaurant.db');
const db = new sqlite3.Database(dbPath);

const initDatabase = () => {
  db.serialize(() => {
    // Tables de restaurant
    db.run(`CREATE TABLE IF NOT EXISTS tables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_number INTEGER UNIQUE NOT NULL,
      capacity INTEGER NOT NULL,
      status TEXT DEFAULT 'available',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Commandes
    db.run(`CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_id INTEGER,
      order_number TEXT UNIQUE NOT NULL,
      customer_name TEXT,
      items TEXT NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      order_type TEXT DEFAULT 'dine-in',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (table_id) REFERENCES tables(id)
    )`);

    // Inventaire
    db.run(`CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_name TEXT NOT NULL,
      category TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      min_quantity REAL DEFAULT 0,
      cost_per_unit REAL DEFAULT 0,
      supplier TEXT,
      last_restocked DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Réservations
    db.run(`CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_email TEXT,
      party_size INTEGER NOT NULL,
      reservation_date DATE NOT NULL,
      reservation_time TIME NOT NULL,
      table_id INTEGER,
      status TEXT DEFAULT 'confirmed',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (table_id) REFERENCES tables(id)
    )`);

    // Personnel
    db.run(`CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      role TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      hire_date DATE,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Planning du personnel
    db.run(`CREATE TABLE IF NOT EXISTS staff_schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL,
      shift_date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      status TEXT DEFAULT 'scheduled',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (staff_id) REFERENCES staff(id)
    )`);

    // Congés et absences
    db.run(`CREATE TABLE IF NOT EXISTS staff_leaves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL,
      leave_type TEXT NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      status TEXT DEFAULT 'pending',
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (staff_id) REFERENCES staff(id)
    )`);

    // HACCP - Contrôles de température
    db.run(`CREATE TABLE IF NOT EXISTS haccp_temperature_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      equipment_name TEXT NOT NULL,
      temperature REAL NOT NULL,
      unit TEXT DEFAULT 'celsius',
      min_temp REAL,
      max_temp REAL,
      status TEXT DEFAULT 'normal',
      recorded_by TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // HACCP - Contrôles d'hygiène
    db.run(`CREATE TABLE IF NOT EXISTS haccp_hygiene_checks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      check_type TEXT NOT NULL,
      area TEXT NOT NULL,
      status TEXT NOT NULL,
      corrective_action TEXT,
      checked_by TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Menu items
    db.run(`CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      cost REAL DEFAULT 0,
      available BOOLEAN DEFAULT 1,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Table des paiements
    db.run(`CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      payment_method TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'completed',
      transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    )`);

    // Données de démonstration
    insertSampleData();
  });

  console.log('✅ Database initialized');
};

const insertSampleData = () => {
  // Tables
  const tables = [
    [1, 2], [2, 4], [3, 4], [4, 6], [5, 8], [6, 2], [7, 4], [8, 6]
  ];
  
  const insertTable = db.prepare('INSERT OR IGNORE INTO tables (table_number, capacity) VALUES (?, ?)');
  tables.forEach(table => insertTable.run(table));
  insertTable.finalize();

  // Menu items
  const menuItems = [
    ['Salade César', 'Entrées', 'Salade romaine, poulet grillé, parmesan, croûtons', 12.50, 4.50],
    ['Soupe à l\'oignon', 'Entrées', 'Soupe traditionnelle gratinée', 8.50, 2.50],
    ['Steak Frites', 'Plats', 'Entrecôte 300g, frites maison, sauce au choix', 24.90, 10.00],
    ['Saumon Grillé', 'Plats', 'Pavé de saumon, légumes de saison, riz', 22.50, 9.50],
    ['Pizza Margherita', 'Plats', 'Tomate, mozzarella, basilic', 14.90, 4.00],
    ['Tiramisu', 'Desserts', 'Dessert italien traditionnel', 7.50, 2.00],
    ['Crème Brûlée', 'Desserts', 'Crème vanille caramélisée', 7.90, 2.50],
    ['Coca-Cola', 'Boissons', '33cl', 3.50, 0.80],
    ['Vin Rouge', 'Boissons', 'Verre de vin rouge', 6.50, 2.00]
  ];

  const insertMenuItem = db.prepare('INSERT OR IGNORE INTO menu_items (name, category, description, price, cost) VALUES (?, ?, ?, ?, ?)');
  menuItems.forEach(item => insertMenuItem.run(item));
  insertMenuItem.finalize();

  // Inventory
  const inventoryItems = [
    ['Farine', 'Épicerie', 50, 'kg', 10, 1.20],
    ['Tomates', 'Légumes', 25, 'kg', 5, 2.50],
    ['Poulet', 'Viandes', 30, 'kg', 8, 8.50],
    ['Saumon', 'Poissons', 15, 'kg', 3, 18.00],
    ['Fromage', 'Produits laitiers', 20, 'kg', 5, 12.00],
    ['Huile d\'olive', 'Épicerie', 10, 'L', 2, 8.50]
  ];

  const insertInventory = db.prepare('INSERT OR IGNORE INTO inventory (item_name, category, quantity, unit, min_quantity, cost_per_unit) VALUES (?, ?, ?, ?, ?, ?)');
  inventoryItems.forEach(item => insertInventory.run(item));
  insertInventory.finalize();

  // Staff
  const staffMembers = [
    ['Jean', 'Dupont', 'Chef', '0612345678', 'jean.dupont@email.com', '2023-01-15'],
    ['Marie', 'Martin', 'Serveur', '0623456789', 'marie.martin@email.com', '2023-03-20'],
    ['Pierre', 'Bernard', 'Serveur', '0634567890', 'pierre.bernard@email.com', '2023-02-10'],
    ['Sophie', 'Dubois', 'Manager', '0645678901', 'sophie.dubois@email.com', '2022-11-01']
  ];

  const insertStaff = db.prepare('INSERT OR IGNORE INTO staff (first_name, last_name, role, phone, email, hire_date) VALUES (?, ?, ?, ?, ?, ?)');
  staffMembers.forEach(staff => insertStaff.run(staff));
  insertStaff.finalize();
};

module.exports = {
  db,
  initDatabase
};
