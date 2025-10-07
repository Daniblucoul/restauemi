import React, { useState, useEffect, useRef } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/currencyFormatter';
import axios from '../utils/axiosConfig';
import LoadingSpinner from './LoadingSpinner';
import { FaMoneyBillAlt, FaCreditCard, FaCheckCircle, FaPlusCircle, FaTrash, FaPlus, FaMinus, FaPrint, FaCashRegister } from 'react-icons/fa';
import ReactToPrint from 'react-to-print';
import { Receipt } from './Receipt';

function POS() {
  const { currency } = useCurrency();
  const toast = useToast();
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Data states
  const [pendingOrders, setPendingOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // New order states
  const [viewMode, setViewMode] = useState('pending');
  const [menuItems, setMenuItems] = useState([]);
  const [newOrderItems, setNewOrderItems] = useState([]);
  const [showNewOrderPaymentModal, setShowNewOrderPaymentModal] = useState(false);

  // Receipt
  const [lastPaidOrder, setLastPaidOrder] = useState(null);
  const [lastPaymentMethod, setLastPaymentMethod] = useState(null);
  const receiptRef = useRef();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPendingOrders(),
        fetchMenuItems()
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

  const fetchMenuItems = async () => {
    try {
      const response = await axios.get('/api/menu');
      setMenuItems(response.data);
    } catch (error) {
      console.error('Error fetching menu items:', error);
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
      setShowPaymentModal(false);
      
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

  const handleNewOrderPayment = async (paymentMethod) => {
    if (newOrderItems.length === 0) {
      toast.warning('Veuillez ajouter au moins un article');
      return;
    }

    setProcessing(true);
    
    try {
      const total = calculateNewOrderTotal();
      const orderData = {
        table_id: null,
        items: newOrderItems,
        total_amount: total,
        status: 'completed',
        order_type: 'takeaway',
        payment_method: paymentMethod
      };

      const response = await axios.post('/api/orders', orderData);
      
      toast.success(`Commande payée (${paymentMethod === 'cash' ? 'espèces' : 'carte'}) ! 🎉`);
      
      setLastPaidOrder({ ...orderData, id: response.data.id || response.data.data?.id });
      setLastPaymentMethod(paymentMethod);
      setPaymentSuccess(true);
      setShowNewOrderPaymentModal(false);
      setNewOrderItems([]);
      
      fetchPendingOrders();
    } catch (error) {
      console.error('Error creating order:', error);
      const errorMessage = error.userMessage || 'Erreur lors de la création de la commande';
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
    toast.success(`${item.name} ajouté ! ➕`);
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

  if (loading) {
    return <LoadingSpinner fullscreen message="Chargement de la caisse..." />;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Point de Vente (Caisse)</h1>
        <p>Gérez les paiements et transactions</p>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button 
          className={`btn ${viewMode === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setViewMode('pending')}
        >
          <FaCashRegister /> Commandes en attente ({pendingOrders.length})
        </button>
        <button 
          className={`btn ${viewMode === 'new' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setViewMode('new')}
        >
          <FaPlus /> Nouvelle vente directe
        </button>
      </div>

      {viewMode === 'pending' ? (
        <div className="pos-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Liste des commandes */}
          <div className="card">
            <h2>Commandes en attente de paiement</h2>
            {pendingOrders.length === 0 ? (
              <div className="empty-state">
                <FaCashRegister size={48} color="#d1d5db" />
                <p>Aucune commande en attente</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {pendingOrders.map(order => (
                  <div 
                    key={order.id}
                    onClick={() => selectOrder(order)}
                    style={{
                      padding: '16px',
                      border: selectedOrder?.id === order.id ? '2px solid #667eea' : '1px solid #e2e8f0',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: selectedOrder?.id === order.id ? '#f0f4ff' : 'white',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>Commande #{order.id}</strong>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>
                          {order.table_name || 'À emporter'}
                        </div>
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#667eea' }}>
                        {formatCurrency(order.total_amount, currency)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Détails et paiement */}
          <div className="card">
            {selectedOrder && orderDetails ? (
              <>
                <h2>Commande #{selectedOrder.id}</h2>
                <div style={{ marginTop: '20px' }}>
                  {orderDetails.items?.map((item, index) => (
                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                      <span>{item.quantity}x {item.name}</span>
                      <span className="font-bold">{formatCurrency(item.price * item.quantity, currency)}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: '16px', padding: '16px', background: '#f9fafb', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                    <strong>Total :</strong>
                    <strong style={{ fontSize: '24px', color: '#667eea' }}>
                      {formatCurrency(selectedOrder.total_amount, currency)}
                    </strong>
                  </div>
                </div>

                <div style={{ marginTop: '24px', display: 'flex', gap: '10px' }}>
                  <button 
                    className="btn btn-success"
                    onClick={() => handlePayment('cash')}
                    disabled={processing}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <FaMoneyBillAlt /> {processing ? 'Traitement...' : 'Espèces'}
                  </button>
                  <button 
                    className="btn btn-primary"
                    onClick={() => handlePayment('card')}
                    disabled={processing}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <FaCreditCard /> {processing ? 'Traitement...' : 'Carte'}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
                <FaCashRegister size={64} color="#d1d5db" />
                <p style={{ marginTop: '16px' }}>Sélectionnez une commande pour encaisser</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Nouvelle vente directe */
        <div className="pos-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
          <div className="card">
            <h2>Menu</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px', marginTop: '16px' }}>
              {menuItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => addItemToNewOrder(item)}
                  style={{
                    padding: '16px',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center',
                    border: '2px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#667eea';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f9fafb';
                    e.currentTarget.style.color = 'inherit';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <div style={{ fontWeight: '600', marginBottom: '8px' }}>{item.name}</div>
                  <div style={{ fontSize: '14px' }}>{formatCurrency(item.price, currency)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2>Panier</h2>
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

                <div style={{ marginTop: '16px', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <strong>Total :</strong>
                    <strong style={{ fontSize: '24px', color: '#667eea' }}>
                      {formatCurrency(calculateNewOrderTotal(), currency)}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      className="btn btn-success"
                      onClick={() => handleNewOrderPayment('cash')}
                      disabled={processing}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <FaMoneyBillAlt /> {processing ? 'Traitement...' : 'Espèces'}
                    </button>
                    <button 
                      className="btn btn-primary"
                      onClick={() => handleNewOrderPayment('card')}
                      disabled={processing}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <FaCreditCard /> {processing ? 'Traitement...' : 'Carte'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
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
                <Receipt ref={receiptRef} order={lastPaidOrder} paymentMethod={lastPaymentMethod} />
              </div>
              <ReactToPrint
                trigger={() => (
                  <button className="btn btn-primary" style={{ marginTop: '16px' }}>
                    <FaPrint /> Imprimer le reçu
                  </button>
                )}
                content={() => receiptRef.current}
              />
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
