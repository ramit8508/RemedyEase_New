import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../Css_for_all/MedicalStoreCheckout.css';

const MedicalStoreCheckout = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    paymentMethod: 'cod'
  });

  useEffect(() => {
    loadCartFromStorage();
    loadUserData();
  }, []);

  const loadCartFromStorage = () => {
    try {
      const savedCart = localStorage.getItem('medicalStoreCart');
      console.log('Loading cart in checkout:', savedCart);
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        if (Array.isArray(parsedCart) && parsedCart.length > 0) {
          setCart(parsedCart);
        } else {
          navigate('/user/dashboard/medical-store/cart');
        }
      } else {
        navigate('/user/dashboard/medical-store/cart');
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      navigate('/user/dashboard/medical-store/cart');
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.fullname || '',
        email: user.email || ''
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const deliveryFee = 40;
  const total = calculateSubtotal() + deliveryFee;

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.fullName || !formData.phone || !formData.address || !formData.city || !formData.state || !formData.pincode) {
      alert('Please fill all required fields!');
      return;
    }

    // Simulate order placement
    setOrderPlaced(true);
    
    // Clear cart after 3 seconds and redirect
    setTimeout(() => {
      localStorage.removeItem('medicalStoreCart');
      navigate('/user/dashboard/medical-store');
    }, 5000);
  };

  if (orderPlaced) {
    return (
      <div className="order-success-page">
        <div className="success-animation">
          <div className="success-checkmark">✓</div>
        </div>
        <h1>Order Placed Successfully! 🎉</h1>
        <p className="success-message">Thank you for your order!</p>
        <div className="order-details-box">
          <h3>Order Details</h3>
          <p><strong>Total Amount:</strong> ₹{total}</p>
          <p><strong>Payment Method:</strong> {formData.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</p>
          <p><strong>Delivery Address:</strong> {formData.address}, {formData.city}, {formData.state} - {formData.pincode}</p>
        </div>
        <div className="delivery-info-success">
          <h2>📦 Your order will be delivered in 24-48 hours</h2>
          <p>We'll send you updates on your registered email and phone number</p>
        </div>
        <button className="back-to-store-btn" onClick={() => navigate('/user/dashboard/medical-store')}>
          Back to Store
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="medical-store-loading">
        <div className="spinner"></div>
        <p>Loading checkout...</p>
      </div>
    );
  }

  return (
    <div className="medical-store-checkout">
      {/* Header */}
      <div className="checkout-header">
        <button className="back-btn" onClick={() => navigate('/user/dashboard/medical-store/cart')}>
          ← Back to Cart
        </button>
        <h1>📋 Checkout</h1>
        <div></div>
      </div>

      <div className="checkout-content">
        {/* Checkout Form */}
        <div className="checkout-form-section">
          <form onSubmit={handlePlaceOrder}>
            {/* Delivery Information */}
            <div className="form-section">
              <h2>📍 Delivery Information</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                    required
                  />
                </div>
                <div className="form-group full-width">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                  />
                </div>
                <div className="form-group full-width">
                  <label>Delivery Address *</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="House No., Street, Area"
                    rows="3"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Enter city"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>State *</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="Enter state"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>PIN Code *</label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    placeholder="Enter PIN code"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="form-section">
              <h2>💳 Payment Method</h2>
              <div className="payment-methods">
                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={formData.paymentMethod === 'cod'}
                    onChange={handleInputChange}
                  />
                  <div className="payment-info">
                    <strong>Cash on Delivery</strong>
                    <p>Pay when you receive your order</p>
                  </div>
                </label>
                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="online"
                    checked={formData.paymentMethod === 'online'}
                    onChange={handleInputChange}
                  />
                  <div className="payment-info">
                    <strong>Online Payment</strong>
                    <p>Pay using UPI, Card, or Net Banking</p>
                  </div>
                </label>
              </div>
            </div>

            <button type="submit" className="place-order-btn">
              Place Order - ₹{total}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="checkout-summary-section">
          <div className="summary-card">
            <h2>Order Summary</h2>
            
            {/* Cart Items Preview */}
            <div className="summary-items">
              {cart.map((item, index) => (
                <div key={`${item.name}-${item.company}-${index}`} className="summary-item">
                  <div className="summary-item-info">
                    <p className="summary-item-name">{item.name}</p>
                    <p className="summary-item-company">{item.company}</p>
                    <p className="summary-item-details">
                      {item.quantity} x ₹{item.price} • {item.daysSupply} days
                    </p>
                  </div>
                  <div className="summary-item-price">
                    ₹{item.price * item.quantity}
                  </div>
                </div>
              ))}
            </div>

            <div className="summary-divider"></div>

            {/* Price Breakdown */}
            <div className="summary-details">
              <div className="summary-row">
                <span>Subtotal:</span>
                <span>₹{calculateSubtotal()}</span>
              </div>
              <div className="summary-row">
                <span>Delivery Charges:</span>
                <span>₹{deliveryFee}</span>
              </div>
              <div className="summary-divider"></div>
              <div className="summary-row total-row">
                <span>Total Amount:</span>
                <span>₹{total}</span>
              </div>
            </div>

            <div className="delivery-info">
              <p>📦 Delivery in 24-48 hours</p>
              <p>✅ 100% Genuine Products</p>
              <p>🔄 Easy Returns & Refunds</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalStoreCheckout;
