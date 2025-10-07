import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import axios from '../utils/axiosConfig';
import LoadingSpinner from './LoadingSpinner';
import './DashboardStyles.css';
import { FaShoppingCart, FaCalendarAlt, FaUsers, FaExclamationTriangle, FaUtensils } from 'react-icons/fa';

function Dashboard() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [lowStockItems, setLowStockItems] = useState([]);

  useEffect(() => {
    fetchLowStockItems();
  }, []);

  const fetchLowStockItems = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/inventory');
      // Filtrer les articles avec stock faible (quantity <= min_quantity)
      const lowStock = response.data.filter(item => item.quantity <= item.min_quantity);
      setLowStockItems(lowStock);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Erreur lors du chargement des stocks');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullscreen message="Chargement du tableau de bord..." />;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Tableau de bord</h1>
          <p>Vue d'ensemble de votre restaurant</p>
        </div>
      </div>

      {lowStockItems.length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: '20px' }}>
          <FaExclamationTriangle style={{ marginRight: '10px' }} />
          <div>
            <strong>⚠️ Alerte Stock !</strong> {lowStockItems.length} article(s) nécessitent un réapprovisionnement
            <div style={{ marginTop: '10px' }}>
              {lowStockItems.map((item, index) => (
                <div key={item.id} style={{ 
                  padding: '8px 0', 
                  borderTop: index === 0 ? 'none' : '1px solid rgba(0,0,0,0.1)' 
                }}>
                  <strong>{item.item_name}</strong> - Stock actuel: {item.quantity} {item.unit} 
                  (Seuil: {item.min_quantity} {item.unit})
                </div>
              ))}
            </div>
            <a href="/inventory" style={{ 
              display: 'inline-block', 
              marginTop: '10px', 
              color: '#856404',
              textDecoration: 'underline',
              fontWeight: 'bold'
            }}>
              → Gérer l'inventaire
            </a>
          </div>
        </div>
      )}

      <div className="card">
        <h2>🎯 Actions Rapides</h2>
        <div className="quick-actions">
          <a href="/orders" className="quick-action-btn">
            <FaShoppingCart size={24} />
            <span>Nouvelle Commande</span>
          </a>
          <a href="/reservations" className="quick-action-btn">
            <FaCalendarAlt size={24} />
            <span>Nouvelle Réservation</span>
          </a>
          <a href="/menu" className="quick-action-btn">
            <FaUtensils size={24} />
            <span>Gérer Menu</span>
          </a>
          <a href="/inventory" className="quick-action-btn">
            <FaExclamationTriangle size={24} />
            <span>Vérifier Stocks</span>
          </a>
          <a href="/staff" className="quick-action-btn">
            <FaUsers size={24} />
            <span>Gérer Personnel</span>
          </a>
        </div>
      </div>

      <div className="card">
        <h2>🍽️ Bienvenue sur Restaurant Emi</h2>
        <p style={{ marginTop: '16px', lineHeight: '1.6' }}>
          Gérez efficacement votre restaurant avec notre plateforme complète et intuitive.
        </p>
        <ul style={{ marginTop: '16px', lineHeight: '1.8' }}>
          <li><strong>📋 Commandes</strong> - Gérez les commandes et les tables en temps réel</li>
          <li><strong>📦 Inventaire</strong> - Suivez vos stocks et optimisez vos approvisionnements</li>
          <li><strong>📅 Réservations</strong> - Centralisez et automatisez vos réservations</li>
          <li><strong>👥 Personnel</strong> - Planifiez les horaires et gérez les congés</li>
          <li><strong>✅ HACCP</strong> - Assurez la conformité aux normes d'hygiène</li>
        </ul>
      </div>
    </div>
  );
}

export default Dashboard;
