import React, { useState, useEffect } from 'react';
import axios from 'axios';


function Dashboard() {
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
    try {
      const response = await axios.get('/api/reports/dashboard');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Tableau de bord</h1>
        <p>Vue d'ensemble de votre restaurant</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Chiffre d'affaires aujourd'hui</h3>
          <div className="value">{stats.today_revenue?.toFixed(2) || '0.00'} €</div>
          <div className="trend">↗ Performance du jour</div>
        </div>

        <div className="stat-card">
          <h3>Commandes aujourd'hui</h3>
          <div className="value">{stats.today_orders || 0}</div>
          <div className="trend">Commandes traitées</div>
        </div>

        <div className="stat-card">
          <h3>Réservations aujourd'hui</h3>
          <div className="value">{stats.today_reservations || 0}</div>
          <div className="trend">Tables réservées</div>
        </div>

        <div className="stat-card">
          <h3>Personnel actif</h3>
          <div className="value">{stats.active_staff || 0}</div>
          <div className="trend">Employés en service</div>
        </div>
      </div>

      {stats.low_stock_items > 0 && (
        <div className="alert alert-warning">
          ⚠️ Attention : {stats.low_stock_items} article(s) en stock faible nécessitent un réapprovisionnement
        </div>
      )}

      <div className="card">
        <h2>Bienvenue sur Restaurant Emi</h2>
        <p>Gérez efficacement votre restaurant avec notre plateforme complète :</p>
        <ul style={{ marginTop: '16px', lineHeight: '1.8' }}>
          <li>📋 <strong>Commandes</strong> - Gérez les commandes et les tables en temps réel</li>
          <li>📦 <strong>Inventaire</strong> - Suivez vos stocks et optimisez vos approvisionnements</li>
          <li>📅 <strong>Réservations</strong> - Centralisez et automatisez vos réservations</li>
          <li>👥 <strong>Personnel</strong> - Planifiez les horaires et gérez les congés</li>
          <li>✅ <strong>HACCP</strong> - Assurez la conformité aux normes d'hygiène</li>
        </ul>
      </div>
    </div>
  );
}

export default Dashboard;
