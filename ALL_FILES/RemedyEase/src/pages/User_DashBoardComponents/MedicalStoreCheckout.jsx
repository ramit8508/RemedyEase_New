import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiShield,
  FiCheck,
  FiFileText,
  FiCreditCard,
  FiDollarSign,
  FiTruck,
  FiAlertCircle,
  FiPackage,
} from "react-icons/fi";
import "../../Css_for_all/MedicalStore.css";

export default function MedicalStoreCheckout() {
  const navigate = useNavigate();

  // State
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem("medicalStoreCart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [userProfile, setUserProfile] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  });

  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPrescription, setSelectedPrescription] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    paymentMethod: "cod",
  });

  const [errors, setErrors] = useState({});
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [placedOrderDetails, setPlacedOrderDetails] = useState(null);
  const [orderError, setOrderError] = useState("");

  // Idempotency key per checkout attempt
  const idempotencyKeyRef = useRef(`idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);

  // Redirect if cart is empty and not on success screen
  useEffect(() => {
    if (cart.length === 0 && !placedOrderDetails) {
      navigate("/user/dashboard/medical-store/cart");
    }
  }, [cart, placedOrderDetails, navigate]);

  // Autofill user profile data
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user) {
      setUserProfile(user);
      setFormData((prev) => ({
        ...prev,
        fullName: user.fullname || user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        state: user.state || "",
        pincode: user.pincode || "",
      }));

      // Fetch user's previous prescriptions
      if (user.email) {
        fetch(`/api/v1/users/prescriptions?email=${encodeURIComponent(user.email)}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success && Array.isArray(data.data) && data.data.length > 0) {
              setPrescriptions(data.data);
              setSelectedPrescription(data.data[0]?.prescriptionFile || "");
            }
          })
          .catch(() => {});
      }
    }
  }, []);

  // Form input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Check if any cart item requires prescription
  const hasPrescriptionItem = useMemo(() => {
    return cart.some((item) => Boolean(item.prescriptionRequired));
  }, [cart]);

  // Subtotal & Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
  }, [cart]);

  const deliveryFee = subtotal >= 500 || subtotal === 0 ? 0 : 40;
  const grandTotal = subtotal + deliveryFee;

  // Validate form
  const validateForm = () => {
    const errs = {};
    if (!formData.fullName.trim()) errs.fullName = "Full name is required";
    if (!formData.phone.trim()) errs.phone = "Phone number is required";
    else if (!/^\+?[\d\s-]{7,15}$/.test(formData.phone.trim())) {
      errs.phone = "Enter a valid phone number";
    }
    if (!formData.address.trim()) errs.address = "Street address is required";
    if (!formData.city.trim()) errs.city = "City is required";
    if (!formData.state.trim()) errs.state = "State is required";
    if (!formData.pincode.trim()) errs.pincode = "PIN Code is required";
    else if (!/^\d{5,8}$/.test(formData.pincode.trim())) {
      errs.pincode = "Enter a valid postal PIN code";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Place Order Handler
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsPlacingOrder(true);
    setOrderError("");

    const orderPayload = {
      idempotencyKey: idempotencyKeyRef.current,
      userEmail: formData.email || userProfile.email || "patient@remedyease.com",
      userName: formData.fullName || userProfile.fullname || "Patient",
      items: cart.map((item) => ({
        medicineId: item.medicineId,
        name: item.name,
        company: item.company,
        category: item.category,
        price: item.price,
        quantity: item.quantity,
        daysSupply: item.daysSupply || 30,
        subtotal: item.price * item.quantity,
      })),
      deliveryAddress: {
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email || userProfile.email,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
      },
      paymentMethod: formData.paymentMethod,
      prescriptionFile: selectedPrescription || "",
    };

    try {
      const res = await fetch("/api/v1/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();
      if (res.ok && data.success && data.data) {
        // Clear cart
        localStorage.removeItem("medicalStoreCart");
        setCart([]);
        setPlacedOrderDetails(data.data);
      } else {
        setOrderError(data.message || "Failed to place order. Please verify your details and try again.");
      }
    } catch (err) {
      console.error("Order error:", err);
      setOrderError("Network error while communicating with pharmacy server. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // ─── ORDER SUCCESS CONFIRMATION SCREEN ───
  if (placedOrderDetails) {
    return (
      <div className="ms-container">
        <div className="ms-success-container">
          <div className="ms-success-icon">
            <FiCheck />
          </div>
          <h2>Order Placed Successfully!</h2>
          <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 16px" }}>
            Thank you for ordering with RemedyEase Pharmacy. Your medicine order is confirmed and being prepared.
          </p>

          <span className="ms-order-id-chip">Order #{placedOrderDetails.orderId}</span>

          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              padding: "18px 20px",
              textAlign: "left",
              marginBottom: "24px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontSize: "13.5px" }}>
              <span style={{ color: "#64748b" }}>Estimated Delivery:</span>
              <strong style={{ color: "#15803d" }}>Within 24-48 Hours</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontSize: "13.5px" }}>
              <span style={{ color: "#64748b" }}>Payment Method:</span>
              <strong style={{ textTransform: "uppercase" }}>{placedOrderDetails.paymentMethod}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px" }}>
              <span style={{ color: "#64748b" }}>Total Amount:</span>
              <strong style={{ fontSize: "15px", color: "#0f172a" }}>₹{placedOrderDetails.totalAmount}</strong>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/user/dashboard/medical-store/orders" className="ms-btn-cart">
              <FiPackage size={16} /> View Order History
            </Link>
            <Link to="/user/dashboard/medical-store" className="ms-btn-nav">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── CHECKOUT FORM ───
  return (
    <div className="ms-container">
      {/* Header */}
      <header className="ms-header">
        <div className="ms-header-info">
          <h1>
            Pharmacy Checkout <span className="ms-header-badge">✓ Secure 256-Bit</span>
          </h1>
          <p>Provide your delivery details and choose a payment method.</p>
        </div>

        <Link to="/user/dashboard/medical-store/cart" className="ms-btn-nav">
          <FiArrowLeft size={16} /> Back to Cart
        </Link>
      </header>

      {orderError && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fee2e2",
            borderRadius: "12px",
            padding: "14px 18px",
            color: "#b91c1c",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "20px",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          <FiAlertCircle size={18} /> {orderError}
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="ms-checkout-layout">
        {/* Left Column: Delivery & Payment Details */}
        <div className="ms-checkout-forms">
          {/* 1. Delivery Information Section */}
          <section className="ms-checkout-section">
            <h3 className="ms-section-heading">
              <span className="ms-section-step">1</span> Delivery Information
            </h3>

            <div className="ms-form-grid">
              <div className="ms-form-group">
                <label className="ms-form-label" htmlFor="chk-name">
                  Full Name *
                </label>
                <input
                  id="chk-name"
                  type="text"
                  name="fullName"
                  className="ms-form-input"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  required
                />
                {errors.fullName && <span style={{ color: "#dc2626", fontSize: "12px" }}>{errors.fullName}</span>}
              </div>

              <div className="ms-form-group">
                <label className="ms-form-label" htmlFor="chk-phone">
                  Phone Number *
                </label>
                <input
                  id="chk-phone"
                  type="tel"
                  name="phone"
                  className="ms-form-input"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. +91 98765 43210"
                  required
                />
                {errors.phone && <span style={{ color: "#dc2626", fontSize: "12px" }}>{errors.phone}</span>}
              </div>

              <div className="ms-form-group ms-form-group--full">
                <label className="ms-form-label" htmlFor="chk-address">
                  Street Address & Flat / House No. *
                </label>
                <textarea
                  id="chk-address"
                  name="address"
                  rows={2}
                  className="ms-form-textarea"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="e.g. Flat 402, Green Valley Apartments, MG Road"
                  required
                />
                {errors.address && <span style={{ color: "#dc2626", fontSize: "12px" }}>{errors.address}</span>}
              </div>

              <div className="ms-form-group">
                <label className="ms-form-label" htmlFor="chk-city">
                  City *
                </label>
                <input
                  id="chk-city"
                  type="text"
                  name="city"
                  className="ms-form-input"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g. Mumbai"
                  required
                />
                {errors.city && <span style={{ color: "#dc2626", fontSize: "12px" }}>{errors.city}</span>}
              </div>

              <div className="ms-form-group">
                <label className="ms-form-label" htmlFor="chk-state">
                  State *
                </label>
                <input
                  id="chk-state"
                  type="text"
                  name="state"
                  className="ms-form-input"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="e.g. Maharashtra"
                  required
                />
                {errors.state && <span style={{ color: "#dc2626", fontSize: "12px" }}>{errors.state}</span>}
              </div>

              <div className="ms-form-group">
                <label className="ms-form-label" htmlFor="chk-pincode">
                  Postal PIN Code *
                </label>
                <input
                  id="chk-pincode"
                  type="text"
                  name="pincode"
                  className="ms-form-input"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="e.g. 400001"
                  required
                />
                {errors.pincode && <span style={{ color: "#dc2626", fontSize: "12px" }}>{errors.pincode}</span>}
              </div>
            </div>
          </section>

          {/* 2. Prescription Section (if required) */}
          {hasPrescriptionItem && (
            <section className="ms-checkout-section">
              <h3 className="ms-section-heading">
                <span className="ms-section-step">2</span> Prescription Verification
              </h3>

              {prescriptions.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <p style={{ fontSize: "13px", color: "#475569", margin: "0" }}>
                    Select a verified prescription on file:
                  </p>
                  <select
                    value={selectedPrescription}
                    onChange={(e) => setSelectedPrescription(e.target.value)}
                    className="ms-filter-select"
                  >
                    {prescriptions.map((rx, idx) => (
                      <option key={idx} value={rx.prescriptionFile}>
                        Doctor: {rx.doctorName || "Consultation"} — {new Date(rx.date || rx.uploadedAt).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "10px", fontSize: "13px", color: "#64748b" }}>
                  ℹ️ Our pharmacy team will verify your prescription details during confirmation.
                </div>
              )}
            </section>
          )}

          {/* 3. Payment Method Section */}
          <section className="ms-checkout-section">
            <h3 className="ms-section-heading">
              <span className="ms-section-step">{hasPrescriptionItem ? "3" : "2"}</span> Payment Method
            </h3>

            <div className="ms-payment-options">
              {/* Cash on Delivery */}
              <div
                className={`ms-payment-card ${formData.paymentMethod === "cod" ? "ms-payment-card--active" : ""}`}
                onClick={() => setFormData((prev) => ({ ...prev, paymentMethod: "cod" }))}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={formData.paymentMethod === "cod"}
                  onChange={() => {}}
                  style={{ accentColor: "#16a34a" }}
                />
                <div>
                  <h4 className="ms-payment-title">Cash on Delivery (COD)</h4>
                  <p className="ms-payment-desc">Pay in cash or UPI at the time of doorstep delivery.</p>
                </div>
              </div>

              {/* Online Payment */}
              <div
                className={`ms-payment-card ${formData.paymentMethod === "online" ? "ms-payment-card--active" : ""}`}
                onClick={() => setFormData((prev) => ({ ...prev, paymentMethod: "online" }))}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="online"
                  checked={formData.paymentMethod === "online"}
                  onChange={() => {}}
                  style={{ accentColor: "#16a34a" }}
                />
                <div>
                  <h4 className="ms-payment-title">Online Payment (UPI / Cards)</h4>
                  <p className="ms-payment-desc">Instant payment via UPI, NetBanking, Credit or Debit Card.</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Order Summary & Confirmation */}
        <aside className="ms-summary-card">
          <h3 className="ms-summary-title">Order Overview ({cart.length} Items)</h3>

          <div style={{ maxHeight: "200px", overflowY: "auto", marginBottom: "16px", paddingRight: "4px" }}>
            {cart.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "13px",
                  padding: "6px 0",
                  borderBottom: "1px solid #f8fafc",
                }}
              >
                <div>
                  <div style={{ fontWeight: "600", color: "#0f172a" }}>{item.brand || item.name}</div>
                  <div style={{ fontSize: "11.5px", color: "#64748b" }}>
                    Qty: {item.quantity} • {item.daysSupply || 30}d supply
                  </div>
                </div>
                <div style={{ fontWeight: "700", color: "#0f172a" }}>
                  ₹{(Number(item.price) || 0) * (Number(item.quantity) || 1)}
                </div>
              </div>
            ))}
          </div>

          <div className="ms-summary-row">
            <span>Items Subtotal</span>
            <span style={{ fontWeight: "700", color: "#0f172a" }}>₹{subtotal}</span>
          </div>

          <div className="ms-summary-row">
            <span>Delivery Fee</span>
            {deliveryFee === 0 ? (
              <span className="ms-free-delivery-badge">FREE</span>
            ) : (
              <span style={{ fontWeight: "600", color: "#0f172a" }}>₹{deliveryFee}</span>
            )}
          </div>

          <div className="ms-summary-row ms-summary-row--total">
            <span>Grand Total</span>
            <span>₹{grandTotal}</span>
          </div>

          <button type="submit" className="ms-btn-checkout" disabled={isPlacingOrder}>
            {isPlacingOrder ? "Placing Order..." : `Place Order (₹${grandTotal})`}
          </button>

          <div
            style={{
              marginTop: "20px",
              padding: "12px",
              background: "#f0fdf4",
              borderRadius: "10px",
              border: "1px solid #dcfce7",
              fontSize: "12px",
              color: "#15803d",
              textAlign: "center",
            }}
          >
            ✓ 100% Genuine Medicines • Sealed Packaging
          </div>
        </aside>
      </form>
    </div>
  );
}
