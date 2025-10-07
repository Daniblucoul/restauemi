const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const db = require('./database/db');
const authRouter = require('./routes/auth');
const ordersRouter = require('./routes/orders_v2');
const inventoryRouter = require('./routes/inventory');
const reservationsRouter = require('./routes/reservations');
const staffRouter = require('./routes/staff');
const reportsRouter = require('./routes/reports');
const haccpRouter = require('./routes/haccp');
const tablesRouter = require('./routes/tables');
const posRoutes = require('./routes/pos');
const settingsRoutes = require('./routes/settings');
const recipesRoutes = require('./routes/recipes');
const menuRouter = require('./routes/menu');
const uploadRouter = require('./routes/upload');
const salesRouter = require('./routes/sales');
const suppliersRouter = require('./routes/suppliers');

// Import error handling middleware
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir les fichiers uploadés statiquement
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Routes
app.use('/api/auth', authRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/reservations', reservationsRouter);
app.use('/api/staff', staffRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/haccp', haccpRouter);
app.use('/api/tables', tablesRouter);
app.use('/api/pos', posRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/recipes', recipesRoutes);
app.use('/api/menu', menuRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/sales', salesRouter);
app.use('/api/suppliers', suppliersRouter);

// Serve static files from React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Restaurant Emi API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler for undefined routes (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Initialize database
db.initDatabase();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

const server = app.listen(PORT, () => {
  console.log(`🍽️  Restaurant Emi server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});
