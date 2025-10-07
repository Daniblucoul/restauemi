import React, { useState, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { formatCurrency } from '../utils/currencyFormatter';
import axios from 'axios';
import { FaMoneyBillWave, FaCreditCard, FaCheckCircle } from 'react-icons/fa';

function POS() {
  const [pendingOrders, setPendingOrders] = useState([]);
  const { currency } = useCurrency();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  const fetchPendingOrders = async () => {
    try {
      const response = await axios.get('/api/pos/pending');
      setPendingOrders(response.data);
    } catch (error) {
      console.error('Error fetching pending orders:', error);
    }
  };

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    setShowPaymentModal(true);
    setPaymentSuccess(false);
  };

  const processPayment = async (paymentMethod) => {
    if (!selectedOrder) return;

    try {
      await axios.post('/api/pos/pay', {
        order_id: selectedOrder.id,
        payment_method: paymentMethod,
        amount: selectedOrder.total_amount
      });
      setPaymentSuccess(true);
      setTimeout(() => {
        setShowPaymentModal(false);
        setSelectedOrder(null);
        fetchPendingOrders(); // Refresh the list
      }, 2000);
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Erreur lors du paiement. Veuillez réessayer.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Caisse Enregistreuse</h1>
        <p>Gérez les paiements des commandes servies.</p>
      </div>

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

      {showPaymentModal && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '400px' }}>
            {!paymentSuccess ? (
              <>
                <h2>Paiement pour la Commande #{selectedOrder.order_number}</h2>
                <div style={{ textAlign: 'center', margin: '30px 0' }}>
                  <p style={{ fontSize: '18px', color: '#4a5568' }}>Total: {formatCurrency(selectedOrder.total_amount, currency)}</p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                  <button className="btn btn-success" style={{ width: '150px', height: '80px', flexDirection: 'column' }} onClick={() => processPayment('Espèces')}>
                    <FaMoneyBillWave size={24} />
                    <span>Espèces</span>
                  </button>
                  <button className="btn btn-primary" style={{ width: '150px', height: '80px', flexDirection: 'column' }} onClick={() => processPayment('Carte')}>
                    <FaCreditCard size={24} />
                    <span>Carte</span>
                  </button>
                </div>
                <div className="modal-actions" style={{ marginTop: '30px' }}>
                  <button type="button" className="btn" onClick={() => setShowPaymentModal(false)}>Annuler</button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <FaCheckCircle size={60} color="#48bb78" />
                <h2 style={{ marginTop: '20px', color: '#48bb78' }}>Paiement Réussi !</h2>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default POS;
