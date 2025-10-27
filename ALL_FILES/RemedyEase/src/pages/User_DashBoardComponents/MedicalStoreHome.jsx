import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../Css_for_all/MedicalStoreHome.css';

const MedicalStoreHome = () => {
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [daysFilter, setDaysFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 500 });
  const [cart, setCart] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    fetchUserPrescriptions();
    loadCartFromStorage();
  }, []);

  useEffect(() => {
    saveCartToStorage();
  }, [cart]);

  const loadCartFromStorage = () => {
    try {
      const savedCart = localStorage.getItem('medicalStoreCart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        setCart(Array.isArray(parsedCart) ? parsedCart : []);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      setCart([]);
    }
  };

  const saveCartToStorage = () => {
    try {
      localStorage.setItem('medicalStoreCart', JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  };

  const showNotification = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

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

  // Get all unique companies
  const allCompanies = [...new Set(Object.values(medicinesDatabase).flat().map(m => m.company))];

  // Filter medicines based on search and filters
  const getFilteredMedicines = () => {
    let allMedicines = Object.values(medicinesDatabase).flat();

    // Search filter
    if (searchQuery) {
      allMedicines = allMedicines.filter(med => 
        med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        med.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        med.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Company filter
    if (companyFilter !== 'all') {
      allMedicines = allMedicines.filter(med => med.company === companyFilter);
    }

    // Price filter
    allMedicines = allMedicines.filter(med => 
      med.price >= priceRange.min && med.price <= priceRange.max
    );

    return allMedicines;
  };

  const addToCart = (medicine, daysSupply) => {
    const existingItem = cart.find(item => 
      item.name === medicine.name && 
      item.company === medicine.company &&
      item.daysSupply === daysSupply
    );
    
    if (existingItem) {
      const updatedCart = cart.map(item =>
        item.name === medicine.name && 
        item.company === medicine.company &&
        item.daysSupply === daysSupply
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      setCart(updatedCart);
      showNotification(`${medicine.company} quantity updated to ${existingItem.quantity + 1}`);
    } else {
      const newItem = { 
        ...medicine, 
        quantity: 1, 
        daysSupply: daysSupply,
        id: `${medicine.name}-${medicine.company}-${daysSupply}-${Date.now()}`
      };
      setCart([...cart, newItem]);
      showNotification(`${medicine.company} ${medicine.name} added to cart (${daysSupply} days)`);
    }
  };

  const getCartCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const filteredMedicines = getFilteredMedicines();

  if (loading) {
    return (
      <div className="medical-store-loading">
        <div className="spinner"></div>
        <p>Loading medical store...</p>
      </div>
    );
  }

  return (
    <div className="medical-store-home">
      {/* Toast Notification */}
      {showToast && (
        <div className="toast-notification">
          ✓ {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="store-header">
        <div className="header-content">
          <h1>🏥 Medical Store</h1>
          <p>Order medicines from your prescriptions</p>
        </div>
        <button className="cart-icon-btn" onClick={() => navigate('/user/dashboard/medical-store/cart')}>
          🛒 Cart ({getCartCount()})
        </button>
      </div>

      {/* Prescriptions Section */}
      {prescriptions.length > 0 && (
        <div className="prescriptions-section">
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
                  View PDF
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters Section */}
      <div className="filters-section">
        <h2> Find Your Medicines</h2>
        
        {/* Search Bar */}
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search medicines by name, company, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button className="search-btn">Search</button>
        </div>

        <div className="filters-grid">
          {/* Days Filter */}
          <div className="filter-group">
            <label>📅 Days Supply</label>
            <select value={daysFilter} onChange={(e) => setDaysFilter(e.target.value)} className="filter-select">
              <option value="all">All Durations</option>
              <option value="15">15 Days</option>
              <option value="30">30 Days</option>
              <option value="45">45 Days</option>
              <option value="60">60 Days</option>
            </select>
          </div>

          {/* Company Filter */}
          <div className="filter-group">
            <label>🏢 Company</label>
            <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} className="filter-select">
              <option value="all">All Companies</option>
              {allCompanies.map(company => (
                <option key={company} value={company}>{company}</option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div className="filter-group">
            <label>💰 Price Range: ₹{priceRange.min} - ₹{priceRange.max}</label>
            <div className="price-inputs">
              <input
                type="number"
                placeholder="Min"
                value={priceRange.min}
                onChange={(e) => setPriceRange({...priceRange, min: parseInt(e.target.value) || 0})}
                className="price-input"
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Max"
                value={priceRange.max}
                onChange={(e) => setPriceRange({...priceRange, max: parseInt(e.target.value) || 500})}
                className="price-input"
              />
            </div>
          </div>
        </div>

        <button className="clear-filters-btn" onClick={() => {
          setSearchQuery('');
          setDaysFilter('all');
          setCompanyFilter('all');
          setPriceRange({ min: 0, max: 500 });
        }}>
          Clear Filters
        </button>
      </div>

      {/* Medicines Grid */}
      <div className="medicines-section">
        <h2>💊 Available Medicines ({filteredMedicines.length})</h2>
        {filteredMedicines.length === 0 ? (
          <div className="no-results">
            <p>No medicines found matching your filters.</p>
            <button onClick={() => {
              setSearchQuery('');
              setDaysFilter('all');
              setCompanyFilter('all');
              setPriceRange({ min: 0, max: 500 });
            }}>Clear Filters</button>
          </div>
        ) : (
          <div className="medicines-grid">
            {filteredMedicines.map((medicine, index) => (
              <div key={`${medicine.company}-${index}`} className="medicine-card">
                <div className="medicine-icon">💊</div>
                <h3>{medicine.name}</h3>
                <p className="medicine-company">{medicine.company}</p>
                <p className="medicine-category">{medicine.category}</p>
                <p className="medicine-price">₹{medicine.price}</p>
                
                {/* Days Selection */}
                <div className="days-selection">
                  <label>Select Days:</label>
                  <div className="days-buttons-small">
                    {[15, 30, 45, 60].map(days => (
                      <button
                        key={days}
                        className="day-btn-small"
                        onClick={() => addToCart(medicine, days)}
                      >
                        {days}d
                      </button>
                    ))}
                  </div>
                </div>
                
                <button
                  className="add-to-cart-btn"
                  onClick={() => addToCart(medicine, parseInt(daysFilter) || 30)}
                  disabled={!medicine.inStock}
                >
                  {medicine.inStock ? '+ Add to Cart' : 'Out of Stock'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalStoreHome;
