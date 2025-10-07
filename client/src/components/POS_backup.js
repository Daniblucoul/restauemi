import React, { useState, useEffect, useRef } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { formatCurrency } from '../utils/currencyFormatter';
import axios from '../utils/axiosConfig';
import { FaMoneyBillAlt, FaCreditCard, FaCheckCircle, FaPlusCircle, FaTrash, FaPlus, FaMinus, FaPrint } from 'react-icons/fa';
import ReactToPrint from 'react-to-print';
import { Receipt } from './Receipt';

function POS() {
  const [pendingOrders, setPendingOrders] = useState([]);
  const { currency } = useCurrency();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // New state for POS order creation
  const [viewMode, setViewMode] = useState('pending'); // 'pending' or 'new'
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newOrderItems, setNewOrderItems] = useState([]);
  const [showNewOrderPaymentModal, setShowNewOrderPaymentModal] = useState(false);

  // State for receipt printing
  const [lastPaidOrder, setLastPaidOrder] = useState(null);
  const [lastPaymentMethod, setLastPaymentMethod] = useState(null);
  const receiptRef = useRef();

  useEffect(() => {
    fetchPendingOrders();
    fetchMenuItems();
  }, []);

  const fetchPendingOrders = async () => {
    try {
      const response = await axios.get('/api/pos/pending');
      setPendingOrders(response.data);
    } catch (error) {
      console.error('Error fetching pending orders:', error);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const response = await axios.get('/api/menu');
      setMenuItems(response.data);
      const uniqueCategories = [...new Set(response.data.map(item => item.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    }
  };

  const handleSelectOrder = async (order) => {
    setSelectedOrder(order);
    setPaymentSuccess(false);
    setShowPaymentModal(true);
    setIsLoadingDetails(true);
    try {
      const response = await axios.get(`/api/orders/${order.id}`);
      setOrderDetails(response.data);
    } catch (error) {
      console.error('Error fetching order details:', error);
      alert("Erreur lors de la récupération des détails de la commande.");
      setShowPaymentModal(false); // Close modal on error
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Functions for new order creation
  const handleAddItemToOrder = (item) => {
    setNewOrderItems(prevItems => {
      const existingItem = prevItems.find(i => i.id === item.id);
      if (existingItem) {
        return prevItems.map(i => 
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        return [...prevItems, { ...item, quantity: 1 }];
      }
    });
  };

  const handleUpdateQuantity = (itemId, delta) => {
    setNewOrderItems(prevItems => {
      return prevItems.map(item => 
        item.id === itemId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
      ).filter(item => item.quantity > 0); // Remove if quantity is 0
    });
  };

  const handleClearNewOrder = () => {
    setNewOrderItems([]);
  };

  const newOrderTotal = newOrderItems.reduce((total, item) => total + item.price * item.quantity, 0);

  const processPayment = async (paymentMethod) => {
    if (!selectedOrder || !orderDetails) return;

    try {
      await axios.post('/api/pos/pay', {
        order_id: selectedOrder.id,
        payment_method: paymentMethod,
        amount: selectedOrder.total_amount
      });
      setLastPaidOrder(orderDetails);
      setLastPaymentMethod(paymentMethod);
      setPaymentSuccess(true);
      // Keep modal open to allow printing
      fetchPendingOrders();
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Erreur lors du paiement. Veuillez réessayer.');
    }
  };

  const processNewOrderPayment = async (paymentMethod) => {
    if (newOrderItems.length === 0) return;

    const orderData = {
      customer_name: 'Vente au comptoir',
      order_type: 'take-away',
      items: newOrderItems.map(i => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price })),
      total_amount: newOrderTotal,
      notes: 'Payé immédiatement'
    };

    try {
      // 1. Create the order
      const orderResponse = await axios.post('/api/orders', orderData);
      const newOrderId = orderResponse.data.id;

      // 2. Process the payment for the new order
      await axios.post('/api/pos/pay', {
        order_id: newOrderId,
        payment_method: paymentMethod,
        amount: newOrderTotal
      });

      setLastPaidOrder({ ...orderData, id: newOrderId, items: newOrderItems });
      setLastPaymentMethod(paymentMethod);
      setPaymentSuccess(true);
      // Keep modal open to allow printing
      fetchPendingOrders();

    } catch (error) {
      console.error('Error processing new order payment:', error);
      alert('Erreur lors de la création ou du paiement de la commande.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Caisse Enregistreuse (POS)</h1>
        <div className="view-toggle" style={{ marginTop: '20px', marginBottom: '20px' }}>
          <button className={`btn ${viewMode === 'pending' ? 'btn-primary' : ''}`} onClick={() => setViewMode('pending')}>
            Paiements en attente
          </button>
          <button className={`btn ${viewMode === 'new' ? 'btn-primary' : ''}`} style={{ marginLeft: '10px' }} onClick={() => setViewMode('new')}>
            Nouvelle Commande
          </button>
        </div>
      </div>

      {viewMode === 'pending' && (
        <div className="card">
          <h2>Commandes à encaisser</h2>
          <div className="stats-grid" style={{ marginTop: '20px' }}>
            {pendingOrders.length > 0 ? (
              pendingOrders.map(order => (
                <div key={order.id} className="stat-card" style={{ cursor: 'pointer' }} onClick={() => handleSelectOrder(order)}>
                  <h3>Commande #{order.order_number}</h3>
                  <div className="value">{formatCurrency(order.total_amount, currency)}</div>
                  <div className="trend">Table {order.table_number || 'N/A'}</div>
                </div>
              ))
            ) : (
              <p style={{ color: '#718096' }}>Aucune commande en attente de paiement.</p>
            )}
          </div>
        </div>
      )}

      {viewMode === 'new' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
          <div className="card">
            <h2>Menu</h2>
            {categories.map(category => (
              <div key={category} style={{ marginBottom: '20px' }}>
                <h3 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>{category}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px', marginTop: '10px' }}>
                  {menuItems.filter(item => item.category === category).map(item => {
                    const isInCart = newOrderItems.some(cartItem => cartItem.id === item.id);
                    const itemStyle = {
                      cursor: 'pointer',
                      border: isInCart ? '2px solid #48bb78' : '1px solid #e2e8f0',
                      opacity: isInCart ? 0.6 : 1,
                      position: 'relative',
                      transition: 'all 0.2s ease-in-out'
                    };

                    return (
                      <div key={item.id} className="stat-card" style={itemStyle} onClick={() => handleAddItemToOrder(item)}>
                        <h4 style={{ fontSize: '1rem', marginBottom: '5px' }}>{item.name}</h4>
                        <div className="value" style={{ fontSize: '1rem' }}>{formatCurrency(item.price, currency)}</div>
                        {isInCart ? (
                          <FaCheckCircle style={{ position: 'absolute', top: '10px', right: '10px', color: '#48bb78' }}/>
                        ) : (
                          <FaPlusCircle style={{ position: 'absolute', top: '10px', right: '10px', color: '#38a169' }}/>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="card">
            <h2>Commande Actuelle</h2>
            {newOrderItems.length === 0 ? (
              <p style={{ color: '#718096' }}>Ajoutez des articles depuis le menu.</p>
            ) : (
              <>
                <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '20px' }}>
                  {newOrderItems.map(item => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #edf2f7' }}>
                      <div>
                        <p style={{ fontWeight: 'bold' }}>{item.name}</p>
                        <p style={{ color: '#718096' }}>{formatCurrency(item.price, currency)}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button className="btn-icon" onClick={() => handleUpdateQuantity(item.id, -1)}><FaMinus size={12}/></button>
                        <span style={{ minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                        <button className="btn-icon" onClick={() => handleUpdateQuantity(item.id, 1)}><FaPlus size={12}/></button>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem' }}>
                    <span>Total</span>
                    <span>{formatCurrency(newOrderTotal, currency)}</span>
                  </div>
                  <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
                    <button className="btn btn-danger" onClick={handleClearNewOrder}><FaTrash /> Vider</button>
                    <button className="btn btn-success" onClick={() => setShowNewOrderPaymentModal(true)}>Payer</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal for Pending Order Payment */}
      {showPaymentModal && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '500px' }}>
            {!paymentSuccess ? (
              <>
                <h2>Commande #{selectedOrder.order_number}</h2>
                {isLoadingDetails ? (
                  <p>Chargement des détails...</p>
                ) : orderDetails ? (
                  <>
                    <div className="order-details-summary" style={{ margin: '20px 0', maxHeight: '250px', overflowY: 'auto', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', paddingTop: '10px' }}>
                      {orderDetails.items.map((item, index) => (
                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                          <span>{item.quantity} x {item.name}</span>
                          <span>{formatCurrency(item.price * item.quantity, currency)}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ textAlign: 'right', margin: '20px 0', fontSize: '1.2rem', fontWeight: 'bold' }}>
                      <p>Total: {formatCurrency(orderDetails.total_amount, currency)}</p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                      <button className="btn btn-success" style={{ width: '150px', height: '80px', flexDirection: 'column' }} onClick={() => processPayment('Espèces')}>
                        <FaMoneyBillAlt size={24} />
                        <span>Espèces</span>
                      </button>
                      <button className="btn btn-primary" style={{ width: '150px', height: '80px', flexDirection: 'column' }} onClick={() => processPayment('Carte')}>
                        <FaCreditCard size={24} />
                        <span>Carte</span>
                      </button>
                    </div>
                  </>
                ) : null}
                <div className="modal-actions" style={{ marginTop: '30px' }}>
                  <button type="button" className="btn" onClick={() => { setShowPaymentModal(false); setOrderDetails(null); }}>Annuler</button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px' }}>
                <FaCheckCircle size={60} color="#48bb78" />
                <h2 style={{ marginTop: '20px', color: '#48bb78' }}>Paiement Réussi !</h2>
                
                <ReactToPrint
                  trigger={() => (
                    <button className="btn btn-primary" style={{ marginTop: '20px' }}>
                      <FaPrint style={{ marginRight: '8px' }} /> Imprimer le reçu
                    </button>
                  )}
                  content={() => receiptRef.current}
                />

                <button className="btn" style={{ marginTop: '10px' }} onClick={() => {
                  setPaymentSuccess(false);
                  setShowPaymentModal(false);
                  setSelectedOrder(null);
                  setOrderDetails(null);
                  setLastPaidOrder(null);
                }}>
                  Fermer
                </button>

                <div style={{ display: 'none' }}>
                  <Receipt ref={receiptRef} order={lastPaidOrder} currency={currency} paymentMethod={lastPaymentMethod} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal for New Order Payment */}
      {showNewOrderPaymentModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '400px' }}>
            {!paymentSuccess ? (
              <>
                <h2>Paiement Nouvelle Commande</h2>
                <div style={{ textAlign: 'center', margin: '30px 0' }}>
                  <p style={{ fontSize: '18px', color: '#4a5568' }}>Total: {formatCurrency(newOrderTotal, currency)}</p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                  <button className="btn btn-success" style={{ width: '150px', height: '80px', flexDirection: 'column' }} onClick={() => processNewOrderPayment('Espèces')}>
                    <FaMoneyBillAlt size={24} />
                    <span>Espèces</span>
                  </button>
                  <button className="btn btn-primary" style={{ width: '150px', height: '80px', flexDirection: 'column' }} onClick={() => processNewOrderPayment('Carte')}>
                    <FaCreditCard size={24} />
                    <span>Carte</span>
                  </button>
                </div>
                <div className="modal-actions" style={{ marginTop: '30px' }}>
                  <button type="button" className="btn" onClick={() => setShowNewOrderPaymentModal(false)}>Annuler</button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px' }}>
                <FaCheckCircle size={60} color="#48bb78" />
                <h2 style={{ marginTop: '20px', color: '#48bb78' }}>Paiement Réussi !</h2>
                
                <ReactToPrint
                  trigger={() => (
                    <button className="btn btn-primary" style={{ marginTop: '20px' }}>
                      <FaPrint style={{ marginRight: '8px' }} /> Imprimer le reçu
                    </button>
                  )}
                  content={() => receiptRef.current}
                />

                <button className="btn" style={{ marginTop: '10px' }} onClick={() => {
                  setPaymentSuccess(false);
                  setShowNewOrderPaymentModal(false);
                  setNewOrderItems([]);
                  setLastPaidOrder(null);
                  setViewMode('pending');
                }}>
                  Nouvelle Vente
                </button>

                <div style={{ display: 'none' }}>
                  <Receipt ref={receiptRef} order={lastPaidOrder} currency={currency} paymentMethod={lastPaymentMethod} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default POS;
