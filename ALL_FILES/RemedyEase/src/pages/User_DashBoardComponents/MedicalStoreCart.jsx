import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../Css_for_all/MedicalStoreCart.css';

const MedicalStoreCart = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCartFromStorage();
  }, []);

  useEffect(() => {
    if (!loading) {
      saveCartToStorage();
    }
  }, [cart, loading]);

  const loadCartFromStorage = () => {
    try {
      const savedCart = localStorage.getItem('medicalStoreCart');
      console.log('Loading cart from storage:', savedCart);
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        setCart(Array.isArray(parsedCart) ? parsedCart : []);
      } else {
        setCart([]);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      setCart([]);
    } finally {
      setLoading(false);
    }
  };

  const saveCartToStorage = () => {
    try {
      localStorage.setItem('medicalStoreCart', JSON.stringify(cart));
      console.log('Cart saved to storage:', cart);
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  };

  const removeFromCart = (medicineName, company, daysSupply) => {
    setCart(cart.filter(item => 
      !(item.name === medicineName && item.company === company && item.daysSupply === daysSupply)
    ));
  };

  const updateQuantity = (medicineName, company, daysSupply, newQuantity) => {
    if (newQuantity === 0) {
      removeFromCart(medicineName, company, daysSupply);
    } else {
      setCart(cart.map(item =>
        item.name === medicineName && item.company === company && item.daysSupply === daysSupply
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const deliveryFee = 40;
  const total = calculateSubtotal() + deliveryFee;

  const handleProceedToCheckout = () => {
    if (cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }
    // Save cart before navigation
    localStorage.setItem('medicalStoreCart', JSON.stringify(cart));
    navigate('/user/dashboard/medical-store/checkout');
  };

  if (loading) {
    return (
      <div className="medical-store-loading">
        <div className="spinner"></div>
        <p>Loading cart...</p>
      </div>
    );
  }

  return (
    <div className="medical-store-cart">
      {/* Header */}
      <div className="cart-header">
        <button className="back-btn" onClick={() => navigate('/user/dashboard/medical-store')}>
          ← Back to Store
        </button>
        <h1>🛒 Shopping Cart</h1>
        <div></div>
      </div>

      {cart.length === 0 ? (
        <div className="empty-cart-page">
          <div className="empty-cart-icon">🛒</div>
          <h2>Your cart is empty</h2>
          <p>Add medicines to your cart to continue shopping</p>
          <button className="continue-shopping-btn" onClick={() => navigate('/user/dashboard/medical-store')}>
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="cart-content">
          {/* Cart Items */}
          <div className="cart-items-section">
            <h2>Items in Cart ({cart.length})</h2>
            <div className="cart-items-list">
              {cart.map((item, index) => (
                <div key={`${item.name}-${item.company}-${item.daysSupply}-${index}`} className="cart-item-card">
                  <div className="item-icon">💊</div>
                  <div className="item-details">
                    <h3>{item.name}</h3>
                    <p className="item-company">Brand: {item.company}</p>
                    <p className="item-category">{item.category}</p>
                    <p className="item-days">Supply: {item.daysSupply} days</p>
                    <p className="item-price-each">₹{item.price} per unit</p>
                  </div>
                  <div className="item-actions">
                    <div className="quantity-controls">
                      <button 
                        className="qty-btn"
                        onClick={() => updateQuantity(item.name, item.company, item.daysSupply, item.quantity - 1)}
                      >
                        −
                      </button>
                      <span className="qty-display">{item.quantity}</span>
                      <button 
                        className="qty-btn"
                        onClick={() => updateQuantity(item.name, item.company, item.daysSupply, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <div className="item-total-price">
                      ₹{item.price * item.quantity}
                    </div>
                    <button
                      className="remove-item-btn"
                      onClick={() => removeFromCart(item.name, item.company, item.daysSupply)}
                    >
                      🗑️ Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart Summary */}
          <div className="cart-summary-section">
            <div className="summary-card">
              <h2>Order Summary</h2>
              
              <div className="summary-details">
                <div className="summary-row">
                  <span>Subtotal ({cart.reduce((sum, item) => sum + item.quantity, 0)} items):</span>
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

              <button className="checkout-btn" onClick={handleProceedToCheckout}>
                Proceed to Checkout
              </button>

              <div className="delivery-info">
                <p>📦 Estimated Delivery: 24-48 hours</p>
                <p>✅ Free returns within 7 days</p>
              </div>
            </div>

            <button className="continue-shopping-link" onClick={() => navigate('/user/dashboard/medical-store')}>
              ← Continue Shopping
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalStoreCart;
