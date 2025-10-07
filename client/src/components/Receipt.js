import React from 'react';
import { formatCurrency } from '../utils/currencyFormatter';

// Using a class component is recommended by react-to-print for refs
export class Receipt extends React.PureComponent {
  render() {
    const { order, currency, paymentMethod } = this.props;

    if (!order) {
      return null;
    }

    const orderDate = new Date().toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <div style={{ width: '300px', padding: '20px', fontFamily: 'monospace', color: '#000' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: '0' }}>Restaurant Emi</h2>
          <p style={{ margin: '0' }}>Merci pour votre visite !</p>
        </div>
        <div style={{ borderBottom: '1px dashed #000', paddingBottom: '10px', marginBottom: '10px' }}>
          <p>Commande: #{order.order_number || order.id}</p>
          <p>Date: {orderDate}</p>
          <p>Type: {order.order_type === 'take-away' ? 'À emporter' : `Table ${order.table_number}`}</p>
        </div>
        <div>
          {order.items.map((item, index) => (
            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
              <span>{item.quantity}x {item.name}</span>
              <span>{formatCurrency(item.price * item.quantity, currency)}</span>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px dashed #000', paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
            <span>Total</span>
            <span>{formatCurrency(order.total_amount, currency)}</span>
          </div>
        </div>
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <p>Payé par: {paymentMethod}</p>
          <p style={{ marginTop: '20px' }}>***</p>
        </div>
      </div>
    );
  }
}
