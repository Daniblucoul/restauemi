const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const db = require('./database/db');
const ordersRouter = require('./routes/orders');
const inventoryRouter = require('./routes/inventory');
const reservationsRouter = require('./routes/reservations');
const staffRouter = require('./routes/staff');
const reportsRouter = require('./routes/reports');
const haccpRouter = require('./routes/haccp');
const tablesRouter = require('./routes/tables');
const posRoutes = require('./routes/pos');
const settingsRoutes = require('./routes/settings');
const menuRouter = require('./routes/menu');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/orders', ordersRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/reservations', reservationsRouter);
app.use('/api/staff', staffRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/haccp', haccpRouter);
app.use('/api/tables', tablesRouter);
app.use('/api/pos', posRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/menu', menuRouter);

// Serve static files from React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Restaurant Emi API is running' });
});

// Initialize database
db.initDatabase();

app.listen(PORT, () => {
  console.log(`🍽️  Restaurant Emi server running on port ${PORT}`);
});
