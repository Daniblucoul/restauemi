import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import axios from '../utils/axiosConfig';
import LoadingSpinner from './LoadingSpinner';
import { FaChartLine, FaShoppingCart, FaCalendarAlt, FaUsers, FaExclamationTriangle } from 'react-icons/fa';

function Dashboard() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    today_revenue: 0,
    today_orders: 0,
    low_stock_items: 0,
    today_reservations: 0,
    active_staff: 0
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/reports/dashboard');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Erreur lors du chargement du tableau de bord');
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
        <h1>Tableau de bord</h1>
        <p>Vue d'ensemble de votre restaurant</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-card-primary">
          <div className="stat-icon">
            <FaChartLine size={32} />
          </div>
          <div className="stat-content">
            <h3>Chiffre d'affaires aujourd'hui</h3>
            <div className="value">{stats.today_revenue?.toFixed(2) || '0.00'} €</div>
            <div className="trend">↗ Performance du jour</div>
          </div>
        </div>

        <div className="stat-card stat-card-success">
          <div className="stat-icon">
            <FaShoppingCart size={32} />
          </div>
          <div className="stat-content">
            <h3>Commandes aujourd'hui</h3>
            <div className="value">{stats.today_orders || 0}</div>
            <div className="trend">Commandes traitées</div>
          </div>
        </div>

        <div className="stat-card stat-card-info">
          <div className="stat-icon">
            <FaCalendarAlt size={32} />
          </div>
          <div className="stat-content">
            <h3>Réservations aujourd'hui</h3>
            <div className="value">{stats.today_reservations || 0}</div>
            <div className="trend">Tables réservées</div>
          </div>
        </div>

        <div className="stat-card stat-card-secondary">
          <div className="stat-icon">
            <FaUsers size={32} />
          </div>
          <div className="stat-content">
            <h3>Personnel actif</h3>
            <div className="value">{stats.active_staff || 0}</div>
            <div className="trend">Employés en service</div>
          </div>
        </div>
      </div>

      {stats.low_stock_items > 0 && (
        <div className="alert alert-warning">
          <FaExclamationTriangle /> 
          <strong>Alerte Stock !</strong> {stats.low_stock_items} article(s) nécessitent un réapprovisionnement
        </div>
      )}

      <div className="dashboard-grid">
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

        <div className="card">
          <h2>📊 Activité Récente</h2>
          <div style={{ marginTop: '16px' }}>
            <div className="activity-item">
              <div className="activity-icon activity-icon-success">✓</div>
              <div className="activity-content">
                <div className="activity-title">Commandes du jour</div>
                <div className="activity-desc">{stats.today_orders} commande(s) traitée(s)</div>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon activity-icon-primary">€</div>
              <div className="activity-content">
                <div className="activity-title">Revenus du jour</div>
                <div className="activity-desc">{stats.today_revenue?.toFixed(2) || '0.00'} € générés</div>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon activity-icon-info">📅</div>
              <div className="activity-content">
                <div className="activity-title">Réservations</div>
                <div className="activity-desc">{stats.today_reservations} table(s) réservée(s)</div>
              </div>
            </div>
            {stats.low_stock_items > 0 && (
              <div className="activity-item">
                <div className="activity-icon activity-icon-warning">⚠</div>
                <div className="activity-content">
                  <div className="activity-title">Alerte Stock</div>
                  <div className="activity-desc">{stats.low_stock_items} article(s) en stock faible</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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
    </div>
  );
}

export default Dashboard;
