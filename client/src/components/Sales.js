import React, { useState, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/currencyFormatter';
import axios from '../utils/axiosConfig';
import LoadingSpinner from './LoadingSpinner';
import { 
  FaChartLine, 
  FaShoppingCart, 
  FaDollarSign, 
  FaTrophy, 
  FaCalendarAlt,
  FaMoneyBillWave,
  FaCreditCard,
  FaMotorcycle,
  FaUtensils
} from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

function Sales() {
  const { currency } = useCurrency();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [salesByDate, setSalesByDate] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  
  // Initialiser avec la date du jour
  const today = new Date().toISOString().split('T')[0];
  const [dateRange, setDateRange] = useState({
    startDate: today,
    endDate: today
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchSalesByDate(),
        fetchTopItems(),
        fetchRecentSales()
      ]);
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      
      const response = await axios.get(`/api/sales/stats?${params.toString()}`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  };

  const fetchSalesByDate = async () => {
    try {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      
      const response = await axios.get(`/api/sales/by-date?${params.toString()}`);
      setSalesByDate(response.data);
    } catch (error) {
      console.error('Error fetching sales by date:', error);
      throw error;
    }
  };

  const fetchTopItems = async () => {
    try {
      const response = await axios.get('/api/sales/top-items?limit=10');
      setTopItems(response.data);
    } catch (error) {
      console.error('Error fetching top items:', error);
      throw error;
    }
  };

  const fetchRecentSales = async () => {
    try {
      const response = await axios.get('/api/sales/recent?limit=15');
      setRecentSales(response.data);
    } catch (error) {
      console.error('Error fetching recent sales:', error);
      throw error;
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };

  const applyFilter = () => {
    fetchAllData();
  };

  const clearFilter = () => {
    const today = new Date().toISOString().split('T')[0];
    setDateRange({ startDate: today, endDate: today });
    setTimeout(() => fetchAllData(), 100);
  };

  const setToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setDateRange({ startDate: today, endDate: today });
    setTimeout(() => fetchAllData(), 100);
  };

  const setThisWeek = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const firstDay = new Date(today);
    firstDay.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); // Lundi
    const lastDay = new Date(firstDay);
    lastDay.setDate(firstDay.getDate() + 6); // Dimanche
    const newRange = { 
      startDate: firstDay.toISOString().split('T')[0], 
      endDate: lastDay.toISOString().split('T')[0] 
    };
    setDateRange(newRange);
    setTimeout(() => fetchAllData(), 100);
  };

  const setThisMonth = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const newRange = { 
      startDate: firstDay.toISOString().split('T')[0], 
      endDate: lastDay.toISOString().split('T')[0] 
    };
    setDateRange(newRange);
    setTimeout(() => fetchAllData(), 100);
  };

  if (loading) {
    return <LoadingSpinner fullscreen message="Chargement des statistiques de vente..." />;
  }

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b', '#fa709a', '#fee140'];

  const orderTypeData = [
    { name: 'Sur place', value: stats?.dine_in_count || 0 },
    { name: 'À emporter', value: stats?.takeaway_count || 0 },
    { name: 'Livraison', value: stats?.delivery_count || 0 }
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Point de Vente - Statistiques</h1>
        <p>
          Analyse détaillée de vos ventes et performances
          {dateRange.startDate && dateRange.endDate && (
            <span style={{ 
              marginLeft: '16px', 
              padding: '4px 12px', 
              background: '#667eea', 
              color: 'white', 
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              {dateRange.startDate === dateRange.endDate 
                ? `📅 ${new Date(dateRange.startDate).toLocaleDateString('fr-FR')}` 
                : `📅 ${new Date(dateRange.startDate).toLocaleDateString('fr-FR')} - ${new Date(dateRange.endDate).toLocaleDateString('fr-FR')}`
              }
            </span>
          )}
        </p>
      </div>

      {/* Filtres de date */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2>Filtres de période</h2>
        
        {/* Boutons rapides */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', marginBottom: '16px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={setToday}
            style={{ fontSize: '14px', padding: '8px 16px' }}
          >
            📅 Aujourd'hui
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={setThisWeek}
            style={{ fontSize: '14px', padding: '8px 16px' }}
          >
            📆 Cette semaine
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={setThisMonth}
            style={{ fontSize: '14px', padding: '8px 16px' }}
          >
            📊 Ce mois
          </button>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'end' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Date de début</label>
            <input
              type="date"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleFilterChange}
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Date de fin</label>
            <input
              type="date"
              name="endDate"
              value={dateRange.endDate}
              onChange={handleFilterChange}
            />
          </div>
          <button className="btn btn-primary" onClick={applyFilter}>
            Appliquer
          </button>
          <button className="btn btn-secondary" onClick={clearFilter}>
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card stat-card-primary">
          <div className="stat-icon">
            <FaDollarSign size={32} />
          </div>
          <div className="stat-content">
            <h3>Chiffre d'affaires</h3>
            <div className="value">{formatCurrency(stats?.total_revenue || 0, currency)}</div>
            <div className="trend">{stats?.total_orders || 0} commandes</div>
          </div>
        </div>

        <div className="stat-card stat-card-success">
          <div className="stat-icon">
            <FaShoppingCart size={32} />
          </div>
          <div className="stat-content">
            <h3>Commandes totales</h3>
            <div className="value">{stats?.total_orders || 0}</div>
            <div className="trend">
              {stats?.completed_orders || 0} complétées
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-info">
          <div className="stat-icon">
            <FaChartLine size={32} />
          </div>
          <div className="stat-content">
            <h3>Panier moyen</h3>
            <div className="value">{formatCurrency(stats?.average_order || 0, currency)}</div>
            <div className="trend">Par commande</div>
          </div>
        </div>

        <div className="stat-card stat-card-secondary">
          <div className="stat-icon">
            <FaTrophy size={32} />
          </div>
          <div className="stat-content">
            <h3>Plus haute vente</h3>
            <div className="value">{formatCurrency(stats?.max_order || 0, currency)}</div>
            <div className="trend">Min: {formatCurrency(stats?.min_order || 0, currency)}</div>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="dashboard-grid" style={{ marginBottom: '24px' }}>
        <div className="card">
          <h2>Ventes par jour (30 derniers jours)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesByDate.slice(0, 30).reverse()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
              />
              <YAxis />
              <Tooltip 
                formatter={(value) => formatCurrency(value, currency)}
                labelFormatter={(date) => new Date(date).toLocaleDateString('fr-FR')}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#667eea" name="Chiffre d'affaires" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2>Répartition par type de commande</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={orderTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {orderTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top 10 des articles les plus vendus */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2>Top 10 des articles les plus vendus</h2>
        <div className="table-container" style={{ marginTop: '16px' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Position</th>
                <th>Article</th>
                <th>Catégorie</th>
                <th>Quantité vendue</th>
                <th>Chiffre d'affaires</th>
                <th>Prix unitaire</th>
              </tr>
            </thead>
            <tbody>
              {topItems.map((item, index) => (
                <tr key={item.menu_item_id}>
                  <td>
                    <span style={{ 
                      fontWeight: '700', 
                      fontSize: '18px',
                      color: index < 3 ? '#f59e0b' : '#6b7280'
                    }}>
                      #{index + 1}
                    </span>
                  </td>
                  <td><strong>{item.item_name}</strong></td>
                  <td>
                    <span className="badge">{item.category}</span>
                  </td>
                  <td>{item.total_quantity} unités</td>
                  <td className="font-bold">
                    {formatCurrency(item.total_revenue, currency)}
                  </td>
                  <td>{formatCurrency(item.price, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ventes récentes */}
      <div className="card">
        <h2>Ventes récentes</h2>
        <div className="table-container" style={{ marginTop: '16px' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>N° Commande</th>
                <th>Date & Heure</th>
                <th>Type</th>
                <th>Table/Client</th>
                <th>Articles</th>
                <th>Montant</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.map(sale => (
                <tr key={sale.id}>
                  <td>#{sale.id}</td>
                  <td>{new Date(sale.order_time || sale.created_at).toLocaleString('fr-FR')}</td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {sale.order_type === 'dine-in' && <FaUtensils />}
                      {sale.order_type === 'takeaway' && <FaShoppingCart />}
                      {sale.order_type === 'delivery' && <FaMotorcycle />}
                      {sale.order_type || 'dine-in'}
                    </span>
                  </td>
                  <td>{sale.table_number || sale.customer_name || 'N/A'}</td>
                  <td>{sale.items?.length || 0} article(s)</td>
                  <td className="font-bold">
                    {formatCurrency(sale.total_amount, currency)}
                  </td>
                  <td>
                    <span className={`badge ${
                      sale.status === 'completed' ? 'badge-success' : 
                      sale.status === 'cancelled' ? 'badge-danger' : 
                      'badge-warning'
                    }`}>
                      {sale.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Sales;
