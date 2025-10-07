import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '../context/CurrencyContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/currencyFormatter';
import axios from '../utils/axiosConfig';
import LoadingSpinner from './LoadingSpinner';
import { FaTrash, FaShoppingCart, FaCashRegister, FaInfoCircle } from 'react-icons/fa';

function Orders() {
  const navigate = useNavigate();
  const { currency } = useCurrency();
  const toast = useToast();
  
  // Loading states
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await fetchOrders();
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  };

  const deleteOrder = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) {
      return;
    }

    try {
      await axios.delete(`/api/orders/${id}`);
      toast.success('Commande supprimée avec succès');
      fetchOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      const errorMessage = error.userMessage || 'Erreur lors de la suppression';
      toast.error(errorMessage);
    }
  };

  const updateOrderStatus = async (id, status) => {
    try {
      await axios.patch(`/api/orders/${id}/status`, { status });
      toast.success(`Statut mis à jour: ${getStatusLabel(status)}`);
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };


  const getStatusLabel = (status) => {
    const labels = {
      'pending': 'En attente',
      'preparing': 'En préparation',
      'ready': 'Prêt',
      'served': 'Servi',
      'completed': 'Terminé',
      'cancelled': 'Annulé'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#f59e0b',
      'preparing': '#3b82f6',
      'ready': '#10b981',
      'served': '#8b5cf6',
      'completed': '#6b7280',
      'cancelled': '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  if (loading) {
    return <LoadingSpinner fullscreen message="Chargement des commandes..." />;
  }

  return (
    <div>
      <div className="page-header">
        <h1>📋 Consultation des Commandes</h1>
        <p>Vue en lecture seule (La gestion se fait à la Caisse)</p>
      </div>

      {/* Info: La Caisse gère tout */}
      <div className="alert" style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        color: 'white',
        borderLeft: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <FaInfoCircle size={24} />
        <div>
          <strong>💡 La Caisse gère TOUT !</strong>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>
            ✨ Nouvelle commande • 📋 Suivi des statuts • 💰 Encaissement → Tout se passe à la Caisse
          </p>
        </div>
        <button 
          className="btn" 
          onClick={() => navigate('/pos')}
          style={{ 
            marginLeft: 'auto',
            background: 'white',
            color: '#667eea',
            padding: '8px 16px'
          }}
        >
          <FaCashRegister /> Aller à la Caisse
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <FaShoppingCart size={64} color="#d1d5db" />
          <h3>Aucune commande</h3>
          <p>Les commandes créées à la Caisse apparaîtront ici</p>
          <button className="btn btn-primary" onClick={() => navigate('/pos')}>
            <FaCashRegister /> Aller à la Caisse
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>N° Commande</th>
                <th>Table/Client</th>
                <th>Type</th>
                <th>Articles</th>
                <th>Total</th>
                <th>Statut</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{order.table_name || order.customer_name || 'N/A'}</td>
                  <td>
                    <span className="badge">{order.order_type || 'dine-in'}</span>
                  </td>
                  <td>{order.items?.length || 0} article(s)</td>
                  <td className="font-bold">
                    {formatCurrency(order.total_amount || 0, currency)}
                  </td>
                  <td>
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      style={{ 
                        backgroundColor: getStatusColor(order.status),
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="pending">En attente</option>
                      <option value="preparing">En préparation</option>
                      <option value="ready">Prêt</option>
                      <option value="served">Servi</option>
                      <option value="completed">Terminé</option>
                      <option value="cancelled">Annulé</option>
                    </select>
                  </td>
                  <td>{new Date(order.order_time || order.created_at).toLocaleString('fr-FR')}</td>
                  <td>
                    <button 
                      className="btn-icon btn-danger"
                      onClick={() => deleteOrder(order.id)}
                      title="Supprimer"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Orders;
