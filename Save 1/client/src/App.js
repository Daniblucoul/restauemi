import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Dashboard from './components/Dashboard';
import Orders from './components/Orders';
import Inventory from './components/Inventory';
import Reservations from './components/Reservations';
import Staff from './components/Staff';
import HACCP from './components/HACCP';
import POS from './components/POS';
import CurrencySelector from './components/CurrencySelector';
import { FaHome, FaShoppingCart, FaBoxes, FaCalendarAlt, FaUsers, FaClipboardCheck, FaCashRegister } from 'react-icons/fa';

function App() {
  const [activeMenu, setActiveMenu] = useState('dashboard');

  return (
    <Router>
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
            <li className={activeMenu === 'haccp' ? 'active' : ''}>
              <Link to="/haccp" onClick={() => setActiveMenu('haccp')}>
                <FaClipboardCheck /> HACCP
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
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/reservations" element={<Reservations />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/haccp" element={<HACCP />} />
            <Route path="/pos" element={<POS />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
