import React, { useState, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/currencyFormatter';
import axios from '../utils/axiosConfig';
import LoadingSpinner from './LoadingSpinner';
import { 
  FaHome, FaShoppingCart, FaTable, FaUsers, FaCog, FaSignOutAlt, FaSearch,
  FaBell, FaUser, FaPlus, FaMinus, FaMoneyBillAlt, FaCreditCard, FaQrcode,
  FaPrint, FaUtensils, FaBirthdayCake, FaDrumstickBite, FaConciergeBell, FaCoffee
} from 'react-icons/fa';
import './POSModern.css';

function POSModern() {
  const { currency } = useCurrency();
  const toast = useToast();
  
  // States
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedOrderType, setSelectedOrderType] = useState('all');
  const [cartItems, setCartItems] = useState([]);
  const [currentTable, setCurrentTable] = useState({ number: '#04', capacity: 2 });
  const [currentOrder, setCurrentOrder] = useState({ id: 'FO030', items: 5 });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState([]);

  const categories = [
    { id: 'all', name: 'All Menu', icon: <FaUtensils />, count: 0 },
    { id: 'Plats', name: 'Plats', icon: <FaDrumstickBite />, count: 0 },
    { id: 'Entrées', name: 'Entrées', icon: <FaConciergeBell />, count: 0 },
    { id: 'Desserts', name: 'Desserts', icon: <FaBirthdayCake />, count: 0 },
    { id: 'Boissons', name: 'Boissons', icon: <FaCoffee />, count: 0 }
  ];

  const orderTypes = [
    { id: 'all', label: 'All', count: 0, color: '#14B8A6' },
    { id: 'dine-in', label: 'Dine In', count: 0, color: '#14B8A6' },
    { id: 'wait-list', label: 'Wait List', count: 0, color: '#F59E0B' },
    { id: 'takeaway', label: 'Take Away', count: 0, color: '#8B5CF6' },
    { id: 'served', label: 'Served', count: 0, color: '#10B981' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [menuResponse, ordersResponse] = await Promise.all([
        axios.get('/api/menu'),
        axios.get('/api/orders')
      ]);
      setMenuItems(menuResponse.data);
      setOrders(ordersResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const filteredMenuItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (item) => {
    const existingItem = cartItems.find(i => i.id === item.id);
    if (existingItem) {
      setCartItems(prev =>
        prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      );
    } else {
      setCartItems(prev => [...prev, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId) => {
    setCartItems(prev => {
      const item = prev.find(i => i.id === itemId);
      if (item.quantity > 1) {
        return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
      } else {
        return prev.filter(i => i.id !== itemId);
      }
    });
  };

  const increaseQuantity = (itemId) => {
    setCartItems(prev =>
      prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity + 1 } : i)
    );
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.055; // 5.5% tax
  };

  const calculateDonation = () => {
    return 1000; // 1000 FCFA donation
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() + calculateDonation();
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      toast.warning('Veuillez ajouter des articles');
      return;
    }

    setProcessing(true);
    try {
      const orderData = {
        table_id: 1,
        items: cartItems,
        total_amount: calculateTotal(),
        status: 'pending',
        order_type: 'dine-in',
        payment_method: paymentMethod
      };

      await axios.post('/api/orders', orderData);
      toast.success('Commande créée avec succès! 🎉');
      setCartItems([]);
      fetchData();
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Erreur lors de la création de la commande');
    } finally {
      setProcessing(false);
    }
  };

  const handlePrint = () => {
    toast.info('Fonction d\'impression à venir');
  };

  if (loading) {
    return <LoadingSpinner fullscreen message="Chargement du POS..." />;
  }

  return (
    <div className="pos-modern-container">
      {/* Sidebar */}
      <div className="pos-sidebar">
        <div className="pos-logo">
          <div className="logo-icon">🍽️</div>
          <div className="logo-text">
            <div className="logo-title">Tasty</div>
            <div className="logo-subtitle">Station</div>
          </div>
        </div>

        <nav className="pos-nav">
          <a href="/dashboard" className="nav-item">
            <FaHome /> <span>Dashboard</span>
          </a>
          <a href="/pos" className="nav-item active">
            <FaShoppingCart /> <span>Order Line</span>
          </a>
          <a href="/tables" className="nav-item">
            <FaTable /> <span>Manage Table</span>
          </a>
          <a href="/menu" className="nav-item">
            <FaUtensils /> <span>Manage Dishes</span>
          </a>
          <a href="/staff" className="nav-item">
            <FaUsers /> <span>Customers</span>
          </a>
        </nav>

        <div className="pos-nav-bottom">
          <a href="/settings" className="nav-item">
            <FaCog /> <span>Settings</span>
          </a>
          <a href="#" className="nav-item">
            <FaSignOutAlt /> <span>Help Center</span>
          </a>
          <a href="/" className="nav-item">
            <FaSignOutAlt /> <span>Logout</span>
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="pos-main">
        <div className="pos-header">
          <div className="header-left">
            <h1 className="page-title">Order Line</h1>
          </div>
          <div className="header-right">
            <div className="search-box">
              <FaSearch />
              <input
                type="text"
                placeholder="Search menu, orders and more"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="icon-btn">
              <FaBell />
            </button>
            <div className="user-profile">
              <img src="/api/placeholder/40/40" alt="User" />
              <div className="user-info">
                <div className="user-name">Ibrahim Kadri</div>
                <div className="user-role">Admin</div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Type Filters */}
        <div className="order-filters">
          {orderTypes.map(type => (
            <button
              key={type.id}
              className={`filter-btn ${selectedOrderType === type.id ? 'active' : ''}`}
              onClick={() => setSelectedOrderType(type.id)}
              style={{ 
                borderColor: selectedOrderType === type.id ? type.color : '#E5E7EB',
                backgroundColor: selectedOrderType === type.id ? type.color : 'white',
                color: selectedOrderType === type.id ? 'white' : '#374151'
              }}
            >
              {type.label}
              {type.count > 0 && <span className="filter-badge">{type.count}</span>}
            </button>
          ))}
        </div>

        {/* Order Cards */}
        <div className="order-cards">
          <div className="order-card">
            <div className="order-card-header">
              <div>
                <div className="order-number">Order #FO027</div>
                <div className="order-items">Items: 8X</div>
              </div>
              <div className="order-table">Table 03</div>
            </div>
            <div className="order-time">2 mins ago</div>
            <div className="order-status in-kitchen">In Kitchen</div>
          </div>

          <div className="order-card">
            <div className="order-card-header">
              <div>
                <div className="order-number">Order #FO028</div>
                <div className="order-items">Items: 3X</div>
              </div>
              <div className="order-table">Table 07</div>
            </div>
            <div className="order-time">Just Now</div>
            <div className="order-status wait-list">Wait List</div>
          </div>

          <div className="order-card">
            <div className="order-card-header">
              <div>
                <div className="order-number">Order #FO019</div>
                <div className="order-items">Items: 2X</div>
              </div>
              <div className="order-table">Table 09</div>
            </div>
            <div className="order-time">25 mins ago</div>
            <div className="order-status ready">Ready</div>
          </div>
        </div>

        {/* Menu Section */}
        <div className="menu-section">
          <h2 className="section-title">Foodies Menu</h2>
          
          {/* Category Tabs */}
          <div className="category-tabs">
            {categories.map(cat => {
              const count = cat.id === 'all' ? menuItems.length : menuItems.filter(item => item.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  className={`category-tab ${selectedCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <span className="category-icon">{cat.icon}</span>
                  <div>
                    <div className="category-name">{cat.name}</div>
                    <div className="category-count">{count} Items</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Menu Grid */}
          <div className="menu-grid">
            {filteredMenuItems.map(item => {
              const cartItem = cartItems.find(i => i.id === item.id);
              const quantity = cartItem ? cartItem.quantity : 0;
              
              return (
                <div key={item.id} className="menu-item-card">
                  <div className="menu-item-image">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} />
                    ) : (
                      <div className="menu-item-placeholder">
                        <FaUtensils size={32} color="#9CA3AF" />
                      </div>
                    )}
                  </div>
                  <div className="menu-item-info">
                    <div className="menu-item-category">{item.category}</div>
                    <div className="menu-item-name">{item.name}</div>
                    <div className="menu-item-footer">
                      <div className="menu-item-price">{formatCurrency(item.price, currency)}</div>
                      <div className="menu-item-controls">
                        <button 
                          className="control-btn minus"
                          onClick={() => removeFromCart(item.id)}
                          disabled={quantity === 0}
                        >
                          <FaMinus />
                        </button>
                        <span className="quantity">{quantity}</span>
                        <button 
                          className="control-btn plus"
                          onClick={() => addToCart(item)}
                        >
                          <FaPlus />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Panel - Order Summary */}
      <div className="pos-right-panel">
        <div className="order-summary-header">
          <div className="table-info">
            <div className="table-number">Table No {currentTable.number}</div>
            <div className="order-id">Order #{currentOrder.id}</div>
          </div>
          <div className="table-capacity">{currentTable.capacity} People</div>
        </div>

        <div className="ordered-items">
          <div className="section-header">
            <h3>Ordered Items</h3>
            <span className="items-count">{cartItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
          </div>

          {cartItems.length === 0 ? (
            <div className="empty-cart">
              <FaShoppingCart size={48} color="#D1D5DB" />
              <p>Aucun article sélectionné</p>
            </div>
          ) : (
            <div className="cart-items-list">
              {cartItems.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-quantity">{item.quantity}x</div>
                  <div className="cart-item-details">
                    <div className="cart-item-name">{item.name}</div>
                  </div>
                  <div className="cart-item-price">{formatCurrency(item.price * item.quantity, currency)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="payment-summary">
          <h3 className="summary-title">Payment Summery</h3>
          
          <div className="summary-row">
            <span>Subtotal</span>
            <span className="amount">{formatCurrency(calculateSubtotal(), currency)}</span>
          </div>
          
          <div className="summary-row">
            <span>Tax</span>
            <span className="amount">{formatCurrency(calculateTax(), currency)}</span>
          </div>
          
          <div className="summary-row">
            <span>Donation for Palestine</span>
            <span className="amount">{formatCurrency(calculateDonation(), currency)}</span>
          </div>

          <div className="summary-total">
            <span>Total Payable</span>
            <span className="total-amount">{formatCurrency(calculateTotal(), currency)}</span>
          </div>
        </div>

        <div className="payment-methods">
          <h3 className="method-title">Payment Method</h3>
          <div className="method-buttons">
            <button 
              className={`method-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('cash')}
            >
              <FaMoneyBillAlt /> Cash
            </button>
            <button 
              className={`method-btn ${paymentMethod === 'card' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('card')}
            >
              <FaCreditCard /> Card
            </button>
            <button 
              className={`method-btn ${paymentMethod === 'scan' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('scan')}
            >
              <FaQrcode /> Scan
            </button>
          </div>
        </div>

        <div className="action-buttons">
          <button className="print-btn" onClick={handlePrint} disabled={cartItems.length === 0}>
            <FaPrint /> Print
          </button>
          <button 
            className="place-order-btn" 
            onClick={handlePlaceOrder}
            disabled={cartItems.length === 0 || processing}
          >
            {processing ? 'En cours...' : 'Place Order'}
          </button>
        </div>

      </div>
    </div>
  );
}

export default POSModern;
