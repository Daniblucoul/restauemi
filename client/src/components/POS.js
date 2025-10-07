import React, { useState, useEffect, useRef } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/currencyFormatter';
import axios from '../utils/axiosConfig';
import LoadingSpinner from './LoadingSpinner';
import { FaMoneyBillAlt, FaCreditCard, FaCheckCircle, FaPlusCircle, FaPlus, FaMinus, FaPrint, FaCashRegister, FaImage, FaUtensils } from 'react-icons/fa';
import { useReactToPrint } from 'react-to-print';
import { Receipt } from './Receipt';

function POS() {
  const { currency } = useCurrency();
  const toast = useToast();
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Data states
  const [pendingOrders, setPendingOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  // New order states
  const [viewMode, setViewMode] = useState('new');
  const [menuItems, setMenuItems] = useState([]);
  const [newOrderItems, setNewOrderItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [newOrderTable, setNewOrderTable] = useState('');
  const [orderType, setOrderType] = useState('dine-in'); // 'dine-in' ou 'takeaway'
  const [customerName, setCustomerName] = useState('');

  // Receipt
  const [lastPaidOrder, setLastPaidOrder] = useState(null);
  const [lastPaymentMethod, setLastPaymentMethod] = useState(null);
  const receiptRef = useRef();
  
  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPendingOrders(),
        fetchAllOrders(),
        fetchMenuItems(),
        fetchTables()
      ]);
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingOrders = async () => {
    try {
      const response = await axios.get('/api/pos/pending');
      setPendingOrders(response.data);
    } catch (error) {
      console.error('Error fetching pending orders:', error);
      throw error;
    }
  };

  const fetchAllOrders = async () => {
    try {
      const response = await axios.get('/api/orders');
      setAllOrders(response.data);
    } catch (error) {
      console.error('Error fetching all orders:', error);
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

  const fetchTables = async () => {
    try {
      const response = await axios.get('/api/tables');
      setTables(response.data.filter(table => table.status === 'available'));
    } catch (error) {
      console.error('Error fetching tables:', error);
      throw error;
    }
  };

  const handlePayment = async (paymentMethod) => {
    if (!selectedOrder) return;

    setProcessing(true);
    
    try {
      await axios.post(`/api/pos/pay/${selectedOrder.id}`, { 
        payment_method: paymentMethod 
      });
      
      toast.success(`Paiement ${paymentMethod === 'cash' ? 'espèces' : 'carte'} validé ! 💰`);
      
      setLastPaidOrder(orderDetails);
      setLastPaymentMethod(paymentMethod);
      setPaymentSuccess(true);
      
      fetchPendingOrders();
      setSelectedOrder(null);
      setOrderDetails(null);
    } catch (error) {
      console.error('Error processing payment:', error);
      const errorMessage = error.userMessage || 'Erreur lors du paiement';
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const selectOrder = async (order) => {
    setSelectedOrder(order);
    try {
      const response = await axios.get(`/api/orders/${order.id}`);
      setOrderDetails(response.data);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Erreur lors du chargement des détails');
    }
  };

  const addItemToNewOrder = (item) => {
    const existingItem = newOrderItems.find(i => i.id === item.id);
    if (existingItem) {
      setNewOrderItems(prev => 
        prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      );
    } else {
      setNewOrderItems(prev => [...prev, { ...item, quantity: 1 }]);
    }
  };

  const removeItemFromNewOrder = (itemId) => {
    setNewOrderItems(prev => {
      const item = prev.find(i => i.id === itemId);
      if (item.quantity > 1) {
        return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
      } else {
        return prev.filter(i => i.id !== itemId);
      }
    });
  };

  const calculateNewOrderTotal = () => {
    return newOrderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const createOrder = async () => {
    if (newOrderItems.length === 0) {
      toast.warning('Veuillez ajouter au moins un article');
      return;
    }

    if (orderType === 'dine-in' && !newOrderTable) {
      toast.warning('Veuillez sélectionner une table');
      return;
    }

    if (orderType === 'takeaway' && !customerName.trim()) {
      toast.warning('Veuillez entrer le nom du client');
      return;
    }

    setProcessing(true);
    
    try {
      const total = calculateNewOrderTotal();
      const orderData = {
        table_id: orderType === 'dine-in' ? newOrderTable : null,
        customer_name: orderType === 'takeaway' ? customerName : null,
        items: newOrderItems,
        total_amount: total,
        status: 'pending',
        order_type: orderType
      };

      await axios.post('/api/orders', orderData);
      
      if (orderType === 'takeaway') {
        toast.success(`Commande à emporter créée pour ${customerName}! 📦`);
      } else {
        toast.success('Commande créée avec succès! 🎉');
      }
      
      setNewOrderItems([]);
      setNewOrderTable('');
      setCustomerName('');
      setOrderType('dine-in');
      fetchPendingOrders();
      fetchAllOrders();
      fetchTables();
    } catch (error) {
      console.error('Error creating order:', error);
      const errorMessage = error.userMessage || 'Erreur lors de la création de la commande';
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.patch(`/api/orders/${orderId}/status`, { status: newStatus });
      toast.success(`Statut mis à jour: ${getStatusLabel(newStatus)}`);
      fetchAllOrders();
      fetchPendingOrders();
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
    return <LoadingSpinner fullscreen message="Chargement de la caisse..." />;
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>🏪 Point de Vente (Caisse)</h1>
          <p>Centre de gestion : Commandes • Suivi • Encaissement</p>
        </div>
      </div>

      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        color: 'white',
        padding: '16px 24px',
        borderRadius: '12px',
        marginBottom: '20px',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
      }}>
        <strong style={{ fontSize: '16px' }}>💡 3 Modes disponibles :</strong>
        <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
          1️⃣ <strong>Nouvelle Commande</strong> : Créer une commande client → 2️⃣ <strong>Suivi & Statuts</strong> : Gérer l'avancement (pending → preparing → ready → served) → 3️⃣ <strong>Encaisser</strong> : Valider le paiement (espèces/carte)
        </p>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', background: 'white', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <button 
          className={`btn ${viewMode === 'new' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setViewMode('new')}
          style={{ flex: 1 }}
        >
          <FaPlus /> Nouvelle Commande
        </button>
        <button 
          className={`btn ${viewMode === 'status' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setViewMode('status')}
          style={{ flex: 1 }}
        >
          <FaUtensils /> Suivi & Statuts ({allOrders.length})
        </button>
        <button 
          className={`btn ${viewMode === 'payment' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setViewMode('payment')}
          style={{ flex: 1 }}
        >
          <FaCashRegister /> Encaisser ({pendingOrders.length})
        </button>
      </div>

      {viewMode === 'new' ? (
        /* Mode: Nouvelle Commande */
        <div>
          {/* Choix du type de commande */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <h2>🎯 Type de commande</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
              <div
                onClick={() => {
                  setOrderType('dine-in');
                  setCustomerName('');
                }}
                style={{
                  padding: '24px',
                  border: orderType === 'dine-in' ? '3px solid #667eea' : '2px solid #e2e8f0',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  background: orderType === 'dine-in' ? '#f0f4ff' : 'white',
                  transition: 'all 0.2s',
                  boxShadow: orderType === 'dine-in' ? '0 4px 12px rgba(102, 126, 234, 0.3)' : '0 2px 4px rgba(0,0,0,0.05)'
                }}
                onMouseEnter={(e) => {
                  if (orderType !== 'dine-in') {
                    e.currentTarget.style.borderColor = '#667eea';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (orderType !== 'dine-in') {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🍽️</div>
                <div style={{ fontWeight: 'bold', fontSize: '20px', marginBottom: '4px' }}>Sur place</div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>Le client mange au restaurant</div>
              </div>

              <div
                onClick={() => {
                  setOrderType('takeaway');
                  setNewOrderTable('');
                }}
                style={{
                  padding: '24px',
                  border: orderType === 'takeaway' ? '3px solid #10b981' : '2px solid #e2e8f0',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  background: orderType === 'takeaway' ? '#f0fdf4' : 'white',
                  transition: 'all 0.2s',
                  boxShadow: orderType === 'takeaway' ? '0 4px 12px rgba(16, 185, 129, 0.3)' : '0 2px 4px rgba(0,0,0,0.05)'
                }}
                onMouseEnter={(e) => {
                  if (orderType !== 'takeaway') {
                    e.currentTarget.style.borderColor = '#10b981';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (orderType !== 'takeaway') {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📦</div>
                <div style={{ fontWeight: 'bold', fontSize: '20px', marginBottom: '4px' }}>À emporter</div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>Le client emporte sa commande</div>
              </div>
            </div>
          </div>

          {/* Sélection de table (seulement si sur place) */}
          {orderType === 'dine-in' && (
            <div className="card" style={{ marginBottom: '20px' }}>
              <h2>🪑 Sélectionnez une table</h2>
              {tables.length === 0 ? (
                <p style={{ color: '#6b7280', marginTop: '12px' }}>Aucune table disponible</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px', marginTop: '16px' }}>
                  {tables.map(table => (
                    <div
                      key={table.id}
                      onClick={() => setNewOrderTable(table.id)}
                      style={{
                        padding: '20px',
                        border: newOrderTable === table.id ? '3px solid #667eea' : '2px solid #e2e8f0',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        background: newOrderTable === table.id ? '#f0f4ff' : 'white',
                        transition: 'all 0.2s',
                        boxShadow: newOrderTable === table.id ? '0 4px 12px rgba(102, 126, 234, 0.3)' : '0 2px 4px rgba(0,0,0,0.05)'
                      }}
                      onMouseEnter={(e) => {
                        if (newOrderTable !== table.id) {
                          e.currentTarget.style.borderColor = '#667eea';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (newOrderTable !== table.id) {
                          e.currentTarget.style.borderColor = '#e2e8f0';
                          e.currentTarget.style.transform = 'scale(1)';
                        }
                      }}
                    >
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>🍽️</div>
                      <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '4px' }}>Table {table.table_number}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{table.capacity} places</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Nom du client (seulement si à emporter) */}
          {orderType === 'takeaway' && (
            <div className="card" style={{ marginBottom: '20px' }}>
              <h2>👤 Nom du client</h2>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Entrez le nom du client..."
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: '16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  marginTop: '12px',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#10b981'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>
          )}

          <div className="pos-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '20px' }}>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2>📋 Menu</h2>
                {orderType === 'dine-in' && newOrderTable ? (
                  <div style={{ fontSize: '14px', color: '#667eea', fontWeight: '600' }}>
                    🍽️ Table {tables.find(t => t.id === newOrderTable)?.table_number}
                  </div>
                ) : orderType === 'takeaway' && customerName ? (
                  <div style={{ fontSize: '14px', color: '#10b981', fontWeight: '600' }}>
                    📦 {customerName}
                  </div>
                ) : null}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
              {menuItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => addItemToNewOrder(item)}
                  style={{
                    padding: '0',
                    background: 'white',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: '2px solid #e2e8f0',
                    overflow: 'hidden',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(102, 126, 234, 0.3)';
                    e.currentTarget.style.borderColor = '#667eea';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                >
                  <div style={{ 
                    height: '120px', 
                    backgroundColor: '#f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}>
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.name}
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '100%',
                          width: 'auto',
                          height: 'auto',
                          objectFit: 'contain',
                          display: 'block'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <FaImage size={32} color="#9ca3af" />
                    )}
                  </div>
                  <div style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontWeight: '600', marginBottom: '6px', fontSize: '14px' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#667eea' }}>
                      {formatCurrency(item.price, currency)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ position: 'sticky', top: '20px', maxHeight: 'calc(100vh - 40px)', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2>🛒 Panier</h2>
              {newOrderItems.length > 0 && (
                <button
                  onClick={() => setNewOrderItems([])}
                  className="btn btn-secondary"
                  style={{ fontSize: '12px', padding: '4px 12px' }}
                >
                  Vider
                </button>
              )}
            </div>

            {((orderType === 'dine-in' && !newOrderTable) || (orderType === 'takeaway' && !customerName.trim())) && (
              <div style={{ 
                background: '#fef3c7', 
                color: '#92400e', 
                padding: '12px', 
                borderRadius: '8px', 
                marginBottom: '16px',
                fontSize: '14px',
                textAlign: 'center'
              }}>
                ⚠️ {orderType === 'dine-in' ? 'Sélectionnez d\'abord une table' : 'Entrez le nom du client'}
              </div>
            )}

            {newOrderItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
                <FaPlusCircle size={48} color="#d1d5db" />
                <p style={{ marginTop: '16px' }}>Aucun article</p>
              </div>
            ) : (
              <>
                <div style={{ marginTop: '16px' }}>
                  {newOrderItems.map((item) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid #e2e8f0' }}>
                      <div>
                        <div style={{ fontWeight: '600' }}>{item.name}</div>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>
                          {formatCurrency(item.price, currency)} x {item.quantity}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button 
                          onClick={() => removeItemFromNewOrder(item.id)}
                          style={{ width: '32px', height: '32px', border: 'none', background: '#ef4444', color: 'white', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          <FaMinus />
                        </button>
                        <span style={{ fontWeight: 'bold', minWidth: '24px', textAlign: 'center' }}>{item.quantity}</span>
                        <button 
                          onClick={() => addItemToNewOrder(item)}
                          style={{ width: '32px', height: '32px', border: 'none', background: '#10b981', color: 'white', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          <FaPlus />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '16px' }}>
                  {/* Total avec design amélioré */}
                  <div style={{ 
                    padding: '20px', 
                    background: orderType === 'takeaway' 
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '12px',
                    marginBottom: '16px',
                    color: 'white'
                  }}>
                    <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '4px' }}>
                      {orderType === 'takeaway' ? '📦 À emporter' : '🍽️ Sur place'} - Total
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                      {formatCurrency(calculateNewOrderTotal(), currency)}
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                      {newOrderItems.reduce((sum, item) => sum + item.quantity, 0)} article(s)
                      {orderType === 'takeaway' && customerName && ` • ${customerName}`}
                      {orderType === 'dine-in' && newOrderTable && ` • Table ${tables.find(t => t.id === newOrderTable)?.table_number}`}
                    </div>
                  </div>

                  <button 
                    className={`btn ${orderType === 'takeaway' ? 'btn-success' : 'btn-primary'}`}
                    onClick={createOrder}
                    disabled={
                      processing || 
                      newOrderItems.length === 0 || 
                      (orderType === 'dine-in' && !newOrderTable) ||
                      (orderType === 'takeaway' && !customerName.trim())
                    }
                    style={{ 
                      width: '100%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '8px',
                      padding: '16px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      background: orderType === 'takeaway' 
                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    }}
                  >
                    {processing ? '⏳ Création...' : orderType === 'takeaway' ? '📦 Créer À Emporter' : '✅ Créer la Commande'}
                  </button>
                </div>
              </>
            )}
          </div>
          </div>
        </div>
      ) : viewMode === 'status' ? (
        /* Mode: Suivi & Statuts */
        <div>
          <div className="card" style={{ marginBottom: '20px' }}>
            <h2>📋 Suivi Rapide</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginTop: '16px' }}>
              {['pending', 'preparing', 'ready', 'served'].map(status => {
                const count = allOrders.filter(o => o.status === status).length;
                return (
                  <div
                    key={status}
                    style={{
                      padding: '16px',
                      background: getStatusColor(status),
                      color: 'white',
                      borderRadius: '12px',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{count}</div>
                    <div style={{ fontSize: '13px', opacity: 0.9 }}>{getStatusLabel(status)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <h2>📋 Toutes les Commandes</h2>
            {allOrders.length === 0 ? (
              <div className="empty-state">
                <FaUtensils size={48} color="#d1d5db" />
                <h3>Aucune commande</h3>
                <p>Les commandes créées apparaîtront ici</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
                {allOrders.map(order => (
                  <div 
                    key={order.id}
                    style={{
                      padding: '16px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '12px',
                      background: 'white',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <strong style={{ fontSize: '18px' }}>#{order.id}</strong>
                          <span style={{ fontSize: '16px' }}>
                            {order.table_number ? `🍽️ Table ${order.table_number}` : '📦 ' + (order.customer_name || 'À emporter')}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                          {new Date(order.order_time || order.created_at).toLocaleString('fr-FR', { 
                            day: '2-digit', 
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#667eea' }}>
                          {formatCurrency(order.total_amount, currency)}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {['pending', 'preparing', 'ready', 'served'].map(status => (
                        <button
                          key={status}
                          onClick={() => updateOrderStatus(order.id, status)}
                          style={{
                            flex: 1,
                            minWidth: '100px',
                            padding: '10px',
                            border: order.status === status ? '2px solid ' + getStatusColor(status) : '1px solid #e2e8f0',
                            background: order.status === status ? getStatusColor(status) : 'white',
                            color: order.status === status ? 'white' : '#374151',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: order.status === status ? 'bold' : 'normal',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            if (order.status !== status) {
                              e.currentTarget.style.borderColor = getStatusColor(status);
                              e.currentTarget.style.background = getStatusColor(status) + '20';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (order.status !== status) {
                              e.currentTarget.style.borderColor = '#e2e8f0';
                              e.currentTarget.style.background = 'white';
                            }
                          }}
                        >
                          {getStatusLabel(status)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Mode: Encaissement */
        <div>
          {pendingOrders.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <FaCashRegister size={64} color="#d1d5db" />
                <h3>Aucune commande à encaisser</h3>
                <p style={{ color: '#6b7280' }}>
                  Les commandes marquées "Servi" apparaîtront ici pour encaissement
                </p>
              </div>
            </div>
          ) : !selectedOrder ? (
            <div className="card">
              <h2>💰 Sélectionnez une commande à encaisser</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginTop: '16px' }}>
                {pendingOrders.map(order => (
                  <div 
                    key={order.id}
                    onClick={() => selectOrder(order)}
                    style={{
                      padding: '20px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      background: 'white',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#667eea';
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                    }}
                  >
                    <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                      Commande #{order.id}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>
                      {order.table_name || '📦 À emporter'}
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#667eea', textAlign: 'center' }}>
                      {formatCurrency(order.total_amount, currency)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>💳 Encaissement - Commande #{selectedOrder.id}</h2>
                <button
                  onClick={() => {
                    setSelectedOrder(null);
                    setOrderDetails(null);
                  }}
                  className="btn btn-secondary"
                  style={{ fontSize: '13px', padding: '8px 16px' }}
                >
                  ← Retour
                </button>
              </div>

              {orderDetails && (
                <>
                  <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                      {orderDetails.table_number ? `🍽️ Table ${orderDetails.table_number}` : '📦 À emporter'}
                    </div>
                    <div style={{ fontSize: '13px', color: '#9ca3af' }}>
                      {new Date(selectedOrder.order_time || selectedOrder.created_at).toLocaleString('fr-FR')}
                    </div>
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ marginBottom: '12px', fontSize: '16px' }}>Détails de la commande</h3>
                    {orderDetails.items?.map((item, index) => (
                      <div key={index} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        padding: '12px 0', 
                        borderBottom: index < orderDetails.items.length - 1 ? '1px solid #e2e8f0' : 'none' 
                      }}>
                        <span style={{ fontSize: '15px' }}>
                          <strong>{item.quantity}x</strong> {item.name}
                        </span>
                        <span style={{ fontSize: '15px', fontWeight: '600' }}>
                          {formatCurrency(item.price * item.quantity, currency)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Total avec design amélioré */}
                  <div style={{ 
                    padding: '24px', 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '12px',
                    marginBottom: '24px',
                    color: 'white'
                  }}>
                    <div style={{ fontSize: '16px', opacity: 0.9, marginBottom: '4px' }}>Total à payer</div>
                    <div style={{ fontSize: '40px', fontWeight: 'bold' }}>
                      {formatCurrency(selectedOrder.total_amount, currency)}
                    </div>
                  </div>

                  <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Mode de paiement</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <button 
                      className="btn btn-success"
                      onClick={() => handlePayment('cash')}
                      disabled={processing}
                      style={{ 
                        padding: '24px',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                    >
                      <FaMoneyBillAlt size={32} />
                      {processing ? '⏳ Traitement...' : '💵 Espèces'}
                    </button>
                    <button 
                      className="btn btn-primary"
                      onClick={() => handlePayment('card')}
                      disabled={processing}
                      style={{ 
                        padding: '24px',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                    >
                      <FaCreditCard size={32} />
                      {processing ? '⏳ Traitement...' : '💳 Carte'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Success Modal */}
      {paymentSuccess && lastPaidOrder && (
        <div className="modal-overlay" onClick={() => setPaymentSuccess(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaCheckCircle /> Paiement Réussi !
              </h2>
              <button className="modal-close" onClick={() => setPaymentSuccess(false)}>×</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '18px', marginBottom: '16px' }}>
                Le paiement a été enregistré avec succès
              </p>
              <div style={{ display: 'none' }}>
                <Receipt ref={receiptRef} order={lastPaidOrder} currency={currency} paymentMethod={lastPaymentMethod} />
              </div>
              <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={handlePrint}>
                <FaPrint /> Imprimer le reçu
              </button>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setPaymentSuccess(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default POS;
