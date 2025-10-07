import React, { useState, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { formatCurrency } from '../utils/currencyFormatter';
import axios from 'axios';
import { FaPlus, FaTrash } from 'react-icons/fa';

function Orders() {
  const { currency } = useCurrency();
  const [orders, setOrders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [newOrder, setNewOrder] = useState({
    table_id: '',
    customer_name: '',
    items: [],
    order_type: 'dine-in',
    notes: ''
  });

  useEffect(() => {
    fetchOrders();
    fetchTables();
    fetchMenuItems();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchTables = async () => {
    try {
      const response = await axios.get('/api/tables');
      setTables(response.data.filter(table => table.status === 'available'));
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const response = await axios.get('/api/menu');
      setMenuItems(response.data);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    }
  };

  const handleNewOrderChange = (e) => {
    const { name, value } = e.target;
    setNewOrder(prev => ({ ...prev, [name]: value }));
  };

  const addItemToOrder = (item) => {
    setNewOrder(prev => {
      const existingItem = prev.items.find(i => i.id === item.id);
      let newItems;
      if (existingItem) {
        newItems = prev.items.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      } else {
        newItems = [...prev.items, { ...item, quantity: 1 }];
      }
      return { ...prev, items: newItems };
    });
  };

  const removeItemFromOrder = (itemId) => {
    setNewOrder(prev => {
      const updatedItems = prev.items.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i).filter(i => i.quantity > 0);
      return { ...prev, items: updatedItems };
    });
  };

  const calculateTotal = () => {
    return newOrder.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const resetNewOrder = () => {
    setNewOrder({
      table_id: '',
      customer_name: '',
      items: [],
      order_type: 'dine-in',
      notes: ''
    });
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (newOrder.items.length === 0) {
      alert('Veuillez ajouter au moins un article à la commande.');
      return;
    }
    try {
      const orderToSubmit = { ...newOrder, total_amount: calculateTotal() };
      await axios.post('/api/orders', orderToSubmit);
      setShowModal(false);
      resetNewOrder();
      fetchOrders();
      fetchTables(); // Refresh tables to update status
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.patch(`/api/orders/${orderId}/status`, { status });
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const deleteOrder = async (orderId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) {
      try {
        await axios.delete(`/api/orders/${orderId}`);
        fetchOrders();
      } catch (error) {
        console.error('Error deleting order:', error);
      }
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending': 'badge-warning',
      'preparing': 'badge-info',
      'ready': 'badge-success',
      'served': 'badge-success',
      'paid': 'badge-success',
      'cancelled': 'badge-danger'
    };
    return badges[status] || 'badge-info';
  };

  const getStatusText = (status) => {
    const texts = {
      'pending': 'En attente',
      'preparing': 'En préparation',
      'ready': 'Prêt',
      'served': 'Servi',
      'paid': 'Payé',
      'cancelled': 'Annulé'
    };
    return texts[status] || status;
  };

  return (
    <div>
      <div className="page-header">
        <h1>Gestion des commandes</h1>
        <p>Suivez et gérez toutes vos commandes</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Liste des commandes</h2>
          <button className="btn btn-primary" onClick={() => { resetNewOrder(); setShowModal(true); }}>
            <FaPlus /> Nouvelle commande
          </button>
        </div>

        <table>
          <thead>
            <tr>
              <th>N° Commande</th>
              <th>Client</th>
              <th>Table</th>
              <th>Type</th>
              <th>Montant</th>
              <th>Statut</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td><strong>{order.order_number}</strong></td>
                <td>{order.customer_name || '-'}</td>
                <td>Table {order.table_id || '-'}</td>
                <td>{order.order_type === 'dine-in' ? 'Sur place' : order.order_type === 'takeaway' ? 'À emporter' : 'Livraison'}</td>
                <td><strong>{formatCurrency(order.total_amount, currency)}</strong></td>
                <td>
                  <span className={`badge ${getStatusBadge(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </td>
                <td>{new Date(order.created_at).toLocaleString('fr-FR')}</td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {order.status === 'pending' && <button className="btn btn-success" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => updateOrderStatus(order.id, 'preparing')}>Préparer</button>}
                    {order.status === 'preparing' && <button className="btn btn-success" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => updateOrderStatus(order.id, 'ready')}>Prêt</button>}
                    {order.status === 'ready' && <button className="btn btn-success" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => updateOrderStatus(order.id, 'served')}>Servi</button>}
                    <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => deleteOrder(order.id)}><FaTrash /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {orders.length === 0 && <p style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>Aucune commande pour le moment</p>}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '800px' }}>
            <h2>Nouvelle Commande</h2>
            <form onSubmit={handleSubmitOrder}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label>Type de commande</label>
                  <select name="order_type" value={newOrder.order_type} onChange={handleNewOrderChange}>
                    <option value="dine-in">Sur place</option>
                    <option value="takeaway">À emporter</option>
                    <option value="delivery">Livraison</option>
                  </select>
                </div>
                {newOrder.order_type === 'dine-in' && (
                  <div className="form-group">
                    <label>Table</label>
                    <select name="table_id" value={newOrder.table_id} onChange={handleNewOrderChange} required>
                      <option value="">Sélectionner une table</option>
                      {tables.map(table => <option key={table.id} value={table.id}>Table {table.table_number} ({table.capacity} places)</option>)}
                    </select>
                  </div>
                )}
                <div className="form-group">
                  <label>Nom du client</label>
                  <input type="text" name="customer_name" value={newOrder.customer_name} onChange={handleNewOrderChange} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                <div>
                  <h4>Menu</h4>
                  <div style={{ height: '300px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px' }}>
                    {menuItems.map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #f7fafc' }}>
                        <div>
                          <strong>{item.name}</strong><br />
                          <small>{item.price.toFixed(2)} €</small>
                        </div>
                        <button type="button" className="btn btn-primary" style={{ padding: '5px 10px' }} onClick={() => addItemToOrder(item)}><FaPlus /></button>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4>Commande en cours</h4>
                  <div style={{ height: '300px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px' }}>
                    {newOrder.items.length > 0 ? newOrder.items.map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #f7fafc' }}>
                        <div>
                          <strong>{item.name}</strong><br />
                          <small>{item.name} - {formatCurrency(item.price, currency)}</small>
                        </div>
                        <button type="button" className="btn btn-danger" style={{ padding: '5px 10px' }} onClick={() => removeItemFromOrder(item.id)}><FaTrash /></button>
                      </div>
                    )) : <p style={{ color: '#a0aec0', textAlign: 'center', paddingTop: '20px' }}>Ajoutez des articles du menu.</p>}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '20px', textAlign: 'right', fontSize: '24px', fontWeight: 'bold' }}>
                <h4>Total : {formatCurrency(calculateTotal(), currency)}</h4>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Créer la commande</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;
