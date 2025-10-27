import React, { useState, useEffect } from 'react';
import '../../Css_for_all/MedicalStore.css';

const MedicalStore = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [daysSupply, setDaysSupply] = useState(30); // Default 30 days
  const [prescribedMedicines, setPrescribedMedicines] = useState([]);

  useEffect(() => {
    fetchUserPrescriptions();
  }, []);

  const fetchUserPrescriptions = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.email) {
        console.error('User not logged in');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/users/prescriptions?email=${user.email}`);

      const data = await response.json();
      if (response.ok) {
        setPrescriptions(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (medicine, days = null) => {
    const supplyDays = days || daysSupply;
    const existingItem = cart.find(item => item.name === medicine.name && item.company === medicine.company);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.name === medicine.name && item.company === medicine.company
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...medicine, quantity: 1, daysSupply: supplyDays }]);
    }
  };

  const removeFromCart = (medicineName, company) => {
    setCart(cart.filter(item => !(item.name === medicineName && item.company === company)));
  };

  const updateQuantity = (medicineName, company, newQuantity) => {
    if (newQuantity === 0) {
      removeFromCart(medicineName, company);
    } else {
      setCart(cart.map(item =>
        item.name === medicineName && item.company === company
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handlePlaceOrder = () => {
    // Simulate order placement
    setOrderSuccess(true);
    setTimeout(() => {
      setCart([]);
      setOrderSuccess(false);
    }, 3000);
  };

  // Medicines database with different company alternatives
  const medicinesDatabase = {
    'Paracetamol 500mg': [
      { name: 'Paracetamol 500mg', company: 'Crocin', price: 25, category: 'Pain Relief', inStock: true },
      { name: 'Paracetamol 500mg', company: 'Dolo 650', price: 30, category: 'Pain Relief', inStock: true },
      { name: 'Paracetamol 500mg', company: 'Calpol', price: 28, category: 'Pain Relief', inStock: true },
      { name: 'Paracetamol 500mg', company: 'Pacimol', price: 22, category: 'Pain Relief', inStock: true },
    ],
    'Amoxicillin 250mg': [
      { name: 'Amoxicillin 250mg', company: 'Novamox', price: 120, category: 'Antibiotic', inStock: true },
      { name: 'Amoxicillin 250mg', company: 'Mox', price: 115, category: 'Antibiotic', inStock: true },
      { name: 'Amoxicillin 250mg', company: 'Amoxil', price: 125, category: 'Antibiotic', inStock: true },
      { name: 'Amoxicillin 250mg', company: 'Biomox', price: 110, category: 'Antibiotic', inStock: true },
    ],
    'Cetirizine 10mg': [
      { name: 'Cetirizine 10mg', company: 'Zyrtec', price: 45, category: 'Allergy', inStock: true },
      { name: 'Cetirizine 10mg', company: 'Alerid', price: 40, category: 'Allergy', inStock: true },
      { name: 'Cetirizine 10mg', company: 'Cetrizet', price: 42, category: 'Allergy', inStock: true },
      { name: 'Cetirizine 10mg', company: 'Okacet', price: 38, category: 'Allergy', inStock: true },
    ],
    'Vitamin D3': [
      { name: 'Vitamin D3', company: 'Uprise-D3', price: 280, category: 'Supplement', inStock: true },
      { name: 'Vitamin D3', company: 'Shelcal', price: 300, category: 'Supplement', inStock: true },
      { name: 'Vitamin D3', company: 'Calcirol', price: 260, category: 'Supplement', inStock: true },
      { name: 'Vitamin D3', company: 'D-Rise', price: 275, category: 'Supplement', inStock: true },
    ],
    'Omeprazole 20mg': [
      { name: 'Omeprazole 20mg', company: 'Omez', price: 65, category: 'Digestive', inStock: true },
      { name: 'Omeprazole 20mg', company: 'Prilosec', price: 70, category: 'Digestive', inStock: true },
      { name: 'Omeprazole 20mg', company: 'Ocid', price: 60, category: 'Digestive', inStock: true },
      { name: 'Omeprazole 20mg', company: 'Omepraz', price: 58, category: 'Digestive', inStock: true },
    ],
    'Aspirin 75mg': [
      { name: 'Aspirin 75mg', company: 'Ecosprin', price: 30, category: 'Heart Health', inStock: true },
      { name: 'Aspirin 75mg', company: 'Disprin', price: 28, category: 'Heart Health', inStock: true },
      { name: 'Aspirin 75mg', company: 'Aspent', price: 32, category: 'Heart Health', inStock: true },
      { name: 'Aspirin 75mg', company: 'Loprin', price: 26, category: 'Heart Health', inStock: true },
    ],
  };

  // Extract prescribed medicines from prescriptions
  useEffect(() => {
    if (prescriptions.length > 0) {
      // In real app, parse prescription text/PDF to extract medicine names
      // For now, we'll show all available medicines
      const allPrescribedMedicines = Object.keys(medicinesDatabase);
      setPrescribedMedicines(allPrescribedMedicines);
    }
  }, [prescriptions]);

  if (loading) {
    return (
      <div className="medical-store-loading">
        <div className="spinner"></div>
        <p>Loading medical store...</p>
      </div>
    );
  }

  return (
    <div className="medical-store-container">
      <div className="store-header">
        <h1>🏥 Medical Store</h1>
        <p>Order medicines from your prescriptions</p>
      </div>

      {orderSuccess && (
        <div className="order-success-banner">
          ✅ Order placed successfully! Your medicines will be delivered soon.
        </div>
      )}

      <div className="store-content">
        {/* Left Side - Prescriptions & Medicines */}
        <div className="medicines-section">
          {/* Days Supply Selector */}
          <div className="days-selector">
            <h3>📅 Select Supply Duration</h3>
            <div className="days-buttons">
              {[15, 30, 45, 60].map(days => (
                <button
                  key={days}
                  className={`day-btn ${daysSupply === days ? 'active' : ''}`}
                  onClick={() => setDaysSupply(days)}
                >
                  {days} Days
                </button>
              ))}
            </div>
            <p className="days-info">Medicines will be calculated for {daysSupply} days supply</p>
          </div>

          {/* User Prescriptions */}
          {prescriptions.length > 0 && (
            <div className="prescriptions-list">
              <h2>📋 Your Prescriptions</h2>
              <div className="prescription-cards">
                {prescriptions.map((prescription, index) => (
                  <div key={prescription.appointmentId || index} className="prescription-card">
                    <div className="prescription-info">
                      <p><strong>Doctor:</strong> {prescription.doctorName || 'N/A'}</p>
                      <p><strong>Date:</strong> {prescription.date ? new Date(prescription.date).toLocaleDateString() : new Date(prescription.uploadedAt).toLocaleDateString()}</p>
                      {prescription.treatment && (
                        <p><strong>Treatment:</strong> {prescription.treatment}</p>
                      )}
                    </div>
                    <button
                      className="view-prescription-btn"
                      onClick={() => window.open(prescription.prescriptionFile, '_blank')}
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prescribed Medicines with Alternatives */}
          {prescribedMedicines.length > 0 && (
            <div className="prescribed-medicines-section">
              <h2>💊 Prescribed Medicines (Choose from alternatives)</h2>
              {prescribedMedicines.map((medicineName) => (
                <div key={medicineName} className="medicine-group">
                  <h3 className="medicine-group-title">{medicineName}</h3>
                  <div className="medicines-grid">
                    {medicinesDatabase[medicineName]?.map((medicine, index) => (
                      <div key={`${medicine.company}-${index}`} className="medicine-card">
                        <div className="medicine-icon">💊</div>
                        <h4>{medicine.company}</h4>
                        <p className="medicine-name">{medicine.name}</p>
                        <p className="medicine-category">{medicine.category}</p>
                        <div className="medicine-footer">
                          <span className="medicine-price">₹{medicine.price}</span>
                          <button
                            className="add-to-cart-btn"
                            onClick={() => addToCart(medicine)}
                            disabled={!medicine.inStock}
                          >
                            {medicine.inStock ? '+ Add' : 'Out of Stock'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Available Medicines (if no prescriptions) */}
          {prescribedMedicines.length === 0 && (
            <div className="medicines-list">
              <h2>💊 Available Medicines</h2>
              {Object.entries(medicinesDatabase).map(([medicineName, alternatives]) => (
                <div key={medicineName} className="medicine-group">
                  <h3 className="medicine-group-title">{medicineName}</h3>
                  <div className="medicines-grid">
                    {alternatives.map((medicine, index) => (
                      <div key={`${medicine.company}-${index}`} className="medicine-card">
                        <div className="medicine-icon">💊</div>
                        <h4>{medicine.company}</h4>
                        <p className="medicine-name">{medicine.name}</p>
                        <p className="medicine-category">{medicine.category}</p>
                        <div className="medicine-footer">
                          <span className="medicine-price">₹{medicine.price}</span>
                          <button
                            className="add-to-cart-btn"
                            onClick={() => addToCart(medicine)}
                            disabled={!medicine.inStock}
                          >
                            {medicine.inStock ? '+ Add' : 'Out of Stock'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side - Shopping Cart */}
        <div className="cart-section">
          <div className="cart-container">
            <h2>🛒 Your Cart</h2>
            {cart.length === 0 ? (
              <div className="empty-cart">
                <p>Your cart is empty</p>
                <p>Add medicines to continue</p>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item, index) => (
                    <div key={`${item.name}-${item.company}-${index}`} className="cart-item">
                      <div className="cart-item-info">
                        <h4>{item.name}</h4>
                        <p className="cart-company">{item.company}</p>
                        <p className="cart-price">₹{item.price} each</p>
                        <p className="cart-days">{item.daysSupply} days supply</p>
                      </div>
                      <div className="cart-item-actions">
                        <div className="quantity-controls">
                          <button onClick={() => updateQuantity(item.name, item.company, item.quantity - 1)}>
                            -
                          </button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.name, item.company, item.quantity + 1)}>
                            +
                          </button>
                        </div>
                        <button
                          className="remove-btn"
                          onClick={() => removeFromCart(item.name, item.company)}
                        >
                          ✕
                        </button>
                      </div>
                      <div className="cart-item-total">
                        ₹{item.price * item.quantity}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cart-summary">
                  <div className="summary-row">
                    <span>Subtotal:</span>
                    <span>₹{calculateTotal()}</span>
                  </div>
                  <div className="summary-row">
                    <span>Delivery:</span>
                    <span>₹40</span>
                  </div>
                  <div className="summary-row total">
                    <span>Total:</span>
                    <span>₹{calculateTotal() + 40}</span>
                  </div>
                </div>

                <button
                  className="place-order-btn"
                  onClick={handlePlaceOrder}
                  disabled={cart.length === 0}
                >
                  Place Order
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalStore;
