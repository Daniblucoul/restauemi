import React, { useState, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/currencyFormatter';
import axios from '../utils/axiosConfig';
import LoadingSpinner from './LoadingSpinner';
import { FaPlus, FaTrash, FaShoppingCart, FaEdit } from 'react-icons/fa';

function Orders() {
  const { currency } = useCurrency();
  const toast = useToast();
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Data states
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [selectedMenuItemForRecipe, setSelectedMenuItemForRecipe] = useState(null);
  const [recipeIngredients, setRecipeIngredients] = useState([]);
  const [availableIngredients, setAvailableIngredients] = useState([]);
  
  const [newOrder, setNewOrder] = useState({
    table_id: '',
    customer_name: '',
    items: [],
    order_type: 'dine-in',
    notes: ''
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchOrders(),
        fetchTables(),
        fetchMenuItems()
      ]);
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

  const fetchTables = async () => {
    try {
      const response = await axios.get('/api/tables');
      setTables(response.data.filter(table => table.status === 'available'));
    } catch (error) {
      console.error('Error fetching tables:', error);
      throw error;
    }
  };

  const fetchMenuItems = async () => {
    try {
      const response = await axios.get('/api/menu');
      setMenuItems(response.data);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (newOrder.items.length === 0) {
      toast.warning('Veuillez ajouter au moins un article à la commande');
      return;
    }

    if (newOrder.order_type === 'dine-in' && !newOrder.table_id) {
      toast.warning('Veuillez sélectionner une table');
      return;
    }

    setSubmitting(true);
    
    try {
      const total = calculateTotal();
      const orderData = {
        ...newOrder,
        total_amount: total,
        status: 'pending'
      };

      await axios.post('/api/orders', orderData);
      
      toast.success('Commande créée avec succès! 🎉');
      setShowModal(false);
      resetForm();
      fetchOrders();
      fetchTables();
    } catch (error) {
      console.error('Error creating order:', error);
      const errorMessage = error.userMessage || error.response?.data?.message || 'Erreur lors de la création de la commande';
      const errorDetails = error.errorDetails || error.response?.data?.details || [];
      
      if (errorDetails.length > 0) {
        toast.error(`${errorMessage}: ${errorDetails.join(', ')}`, 6000);
      } else {
        toast.error(errorMessage, 5000);
      }
    } finally {
      setSubmitting(false);
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

  const addItemToOrder = (item) => {
    setNewOrder(prev => {
      const existingItem = prev.items.find(i => i.id === item.id);
      let newItems;
      if (existingItem) {
        newItems = prev.items.map(i => 
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        newItems = [...prev.items, { ...item, quantity: 1 }];
      }
      return { ...prev, items: newItems };
    });
  };

  const removeItemFromOrder = (itemId) => {
    setNewOrder(prev => {
      const updatedItems = prev.items
        .map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i)
        .filter(i => i.quantity > 0);
      return { ...prev, items: updatedItems };
    });
  };

  const calculateTotal = () => {
    return newOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const resetForm = () => {
    setNewOrder({
      table_id: '',
      customer_name: '',
      items: [],
      order_type: 'dine-in',
      notes: ''
    });
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
        <h1>Gestion des Commandes</h1>
        <p>Créez et gérez les commandes de votre restaurant</p>
      </div>

      <div className="actions-bar">
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FaPlus /> Nouvelle Commande
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <FaShoppingCart size={64} color="#d1d5db" />
          <h3>Aucune commande</h3>
          <p>Créez votre première commande pour commencer</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <FaPlus /> Nouvelle Commande
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

      {/* Modal Nouvelle Commande */}
      {showModal && (
        <div className="modal-overlay" onClick={() => !submitting && setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nouvelle Commande</h2>
              <button 
                className="modal-close" 
                onClick={() => setShowModal(false)}
                disabled={submitting}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Type de commande</label>
                  <select 
                    name="order_type" 
                    value={newOrder.order_type} 
                    onChange={(e) => setNewOrder(prev => ({ ...prev, order_type: e.target.value }))}
                    disabled={submitting}
                  >
                    <option value="dine-in">Sur place</option>
                    <option value="takeaway">À emporter</option>
                    <option value="delivery">Livraison</option>
                  </select>
                </div>

                {newOrder.order_type === 'dine-in' && (
                  <div className="form-group">
                    <label>Table *</label>
                    <select 
                      name="table_id" 
                      value={newOrder.table_id} 
                      onChange={(e) => setNewOrder(prev => ({ ...prev, table_id: e.target.value }))}
                      required
                      disabled={submitting}
                    >
                      <option value="">Sélectionnez une table</option>
                      {tables.map(table => (
                        <option key={table.id} value={table.id}>
                          {table.table_number} (Capacité: {table.capacity})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {newOrder.order_type !== 'dine-in' && (
                  <div className="form-group">
                    <label>Nom du client</label>
                    <input
                      type="text"
                      name="customer_name"
                      value={newOrder.customer_name}
                      onChange={(e) => setNewOrder(prev => ({ ...prev, customer_name: e.target.value }))}
                      placeholder="Nom du client"
                      disabled={submitting}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>Articles disponibles</label>
                  <div className="menu-items-grid">
                    {menuItems.map(item => (
                      <div 
                        key={item.id} 
                        className="menu-item-card"
                        onClick={() => !submitting && addItemToOrder(item)}
                      >
                        <div className="menu-item-name">{item.name}</div>
                        <div className="menu-item-price">
                          {formatCurrency(item.price, currency)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {newOrder.items.length > 0 && (
                  <div className="form-group">
                    <label>Articles sélectionnés</label>
                    <div className="selected-items">
                      {newOrder.items.map(item => (
                        <div key={item.id} className="selected-item">
                          <span>{item.name}</span>
                          <div className="item-controls">
                            <button 
                              type="button" 
                              onClick={() => removeItemFromOrder(item.id)}
                              disabled={submitting}
                            >
                              -
                            </button>
                            <span>{item.quantity}</span>
                            <button 
                              type="button" 
                              onClick={() => addItemToOrder(item)}
                              disabled={submitting}
                            >
                              +
                            </button>
                            <span className="item-total">
                              {formatCurrency(item.price * item.quantity, currency)}
                            </span>
                          </div>
                        </div>
                      ))}
                      <div className="order-total">
                        <strong>Total:</strong>
                        <strong>{formatCurrency(calculateTotal(), currency)}</strong>
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>Notes (optionnel)</label>
                  <textarea
                    name="notes"
                    value={newOrder.notes}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Notes sur la commande..."
                    rows="3"
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className={`btn btn-primary ${submitting ? 'btn-loading' : ''}`}
                  disabled={submitting}
                >
                  {submitting ? 'Création...' : 'Créer la commande'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;
