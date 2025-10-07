import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './components/Login';
import Profile from './components/Profile';
import Dashboard from './components/Dashboard';
import Orders from './components/Orders';
import Inventory from './components/Inventory';
import Reservations from './components/Reservations';
import Staff from './components/Staff';
import HACCP from './components/HACCP';
import POS from './components/POS';
import MenuManagement from './components/MenuManagement';
import Sales from './components/Sales';
import Suppliers from './components/Suppliers';
import CurrencySelector from './components/CurrencySelector';
import UserProfile from './components/UserProfile';
import { FaHome, FaShoppingCart, FaBoxes, FaCalendarAlt, FaUsers, FaClipboardCheck, FaCashRegister, FaUtensils, FaChartLine, FaTruck } from 'react-icons/fa';
import { useAuth } from './context/AuthContext';

function AppContent() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="App">
      <nav className="sidebar">
        <div className="logo">
          <h2>🍽️ Restaurant Emi</h2>
        </div>
        <ul className="menu">
            <li className={activeMenu === 'dashboard' ? 'active' : ''}>
              <Link to="/" onClick={() => setActiveMenu('dashboard')}>
                <FaHome /> Dashboard
              </Link>
            </li>
            <li className={activeMenu === 'orders' ? 'active' : ''}>
              <Link to="/orders" onClick={() => setActiveMenu('orders')}>
                <FaShoppingCart /> Commandes
              </Link>
            </li>
            <li className={activeMenu === 'inventory' ? 'active' : ''}>
              <Link to="/inventory" onClick={() => setActiveMenu('inventory')}>
                <FaBoxes /> Inventaire
              </Link>
            </li>
            <li className={activeMenu === 'menu' ? 'active' : ''}>
              <Link to="/menu" onClick={() => setActiveMenu('menu')}>
                <FaUtensils /> Menu
              </Link>
            </li>
            <li className={activeMenu === 'reservations' ? 'active' : ''}>
              <Link to="/reservations" onClick={() => setActiveMenu('reservations')}>
                <FaCalendarAlt /> Réservations
              </Link>
            </li>
            <li className={activeMenu === 'staff' ? 'active' : ''}>
              <Link to="/staff" onClick={() => setActiveMenu('staff')}>
                <FaUsers /> Personnel
              </Link>
            </li>
            <li className={activeMenu === 'suppliers' ? 'active' : ''}>
              <Link to="/suppliers" onClick={() => setActiveMenu('suppliers')}>
                <FaTruck /> Fournisseurs
              </Link>
            </li>
            <li className={activeMenu === 'haccp' ? 'active' : ''}>
              <Link to="/haccp" onClick={() => setActiveMenu('haccp')}>
                <FaClipboardCheck /> HACCP
              </Link>
            </li>
            <li className={activeMenu === 'sales' ? 'active' : ''}>
              <Link to="/sales" onClick={() => setActiveMenu('sales')}>
                <FaChartLine /> Point de Vente
              </Link>
            </li>
            <li className={activeMenu === 'pos' ? 'active' : ''} style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '10px' }}>
              <Link to="/pos" onClick={() => setActiveMenu('pos')}>
                <FaCashRegister /> Caisse
              </Link>
            </li>
          </ul>
          <CurrencySelector />
      </nav>
      
      <main className="main-content">
        <div className="main-header">
          <div className="main-header-right">
            <UserProfile />
          </div>
        </div>
        <div className="content-wrapper">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/menu" element={<MenuManagement />} />
            <Route path="/reservations" element={<Reservations />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/haccp" element={<HACCP />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <AppContent />
              </PrivateRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
