import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiTrash2,
  FiPlus,
  FiMinus,
  FiShoppingCart,
  FiShield,
  FiAlertCircle,
  FiCheck,
  FiArrowRight,
} from "react-icons/fi";
import "../../Css_for_all/MedicalStore.css";

export default function MedicalStoreCart() {
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

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("medicalStoreCart", JSON.stringify(cart));
    } catch (err) {
      console.error("Failed to save cart:", err);
    }
  }, [cart]);

  // Handlers
  const handleUpdateQuantity = (index, delta) => {
    setCart((prev) => {
      const next = [...prev];
      const item = next[index];
      if (!item) return prev;

      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        // Remove item
        next.splice(index, 1);
      } else {
        next[index] = { ...item, quantity: newQty };
      }
      return next;
    });
  };

  const handleUpdateDaysSupply = (index, newDays) => {
    setCart((prev) => {
      const next = [...prev];
      if (!next[index]) return prev;
      next[index] = { ...next[index], daysSupply: newDays };
      return next;
    });
  };

  const handleRemoveItem = (index) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearCart = () => {
    if (window.confirm("Are you sure you want to clear your cart?")) {
      setCart([]);
    }
  };

  // Pricing calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
  }, [cart]);

  const deliveryFee = subtotal >= 500 || subtotal === 0 ? 0 : 40;
  const grandTotal = subtotal + deliveryFee;
  const totalItemsCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  }, [cart]);

  // Check if any item in cart requires prescription
  const hasPrescriptionItem = useMemo(() => {
    return cart.some((item) => Boolean(item.prescriptionRequired));
  }, [cart]);

  if (cart.length === 0) {
    return (
      <div className="ms-container">
        <header className="ms-header">
          <div className="ms-header-info">
            <h1>Shopping Cart</h1>
            <p>Review your selected medicines and proceed to checkout.</p>
          </div>
          <Link to="/user/dashboard/medical-store" className="ms-btn-nav">
            <FiArrowLeft size={16} /> Continue Shopping
          </Link>
        </header>

        <div className="ms-empty-state">
          <div className="ms-empty-icon">
            <FiShoppingCart />
          </div>
          <h3>Your cart is currently empty</h3>
          <p>Explore verified medicines, healthcare essentials, and wellness products from our store.</p>
          <Link to="/user/dashboard/medical-store" className="ms-btn-cart" style={{ display: "inline-flex" }}>
            Browse Medical Store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="ms-container">
      {/* Header */}
      <header className="ms-header">
        <div className="ms-header-info">
          <h1>
            Shopping Cart <span className="ms-header-badge">{totalItemsCount} {totalItemsCount === 1 ? "Item" : "Items"}</span>
          </h1>
          <p>Review your selected medications and delivery estimate.</p>
        </div>

        <div className="ms-header-actions">
          <button className="ms-btn-nav" onClick={handleClearCart} type="button" style={{ color: "#ef4444" }}>
            <FiTrash2 size={15} /> Clear Cart
          </button>
          <Link to="/user/dashboard/medical-store" className="ms-btn-nav">
            <FiArrowLeft size={16} /> Back to Store
          </Link>
        </div>
      </header>

      {/* Prescription Notice Banner if applicable */}
      {hasPrescriptionItem && (
        <div
          style={{
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: "14px",
            padding: "16px 20px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <FiAlertCircle size={22} color="#b45309" style={{ flexShrink: 0 }} />
          <div>
            <h4 style={{ margin: "0 0 2px", color: "#92400e", fontSize: "14px", fontFamily: "Manrope" }}>
              Prescription Required for Selected Items
            </h4>
            <p style={{ margin: "0", color: "#78350f", fontSize: "13px" }}>
              One or more items in your cart require a valid prescription. You can attach a prescription at checkout.
            </p>
          </div>
        </div>
      )}

      {/* Cart Layout */}
      <div className="ms-cart-layout">
        {/* Cart Items List */}
        <div className="ms-cart-items-card">
          <div className="ms-cart-items-header">
            <h2>Selected Items ({cart.length})</h2>
            <span style={{ fontSize: "13px", color: "#64748b" }}>Prices include standard GST</span>
          </div>

          {cart.map((item, idx) => {
            const itemTotal = (Number(item.price) || 0) * (Number(item.quantity) || 1);

            return (
              <div key={idx} className="ms-cart-item">
                {/* Product Info */}
                <div className="ms-cart-item-info">
                  <h3 className="ms-cart-item-title">{item.brand || item.name}</h3>
                  <p className="ms-cart-item-sub">
                    {item.company} • ₹{item.price} per unit
                  </p>
                  <div className="ms-cart-item-tags">
                    <span className="ms-supply-tag">{item.daysSupply || 30} Days Supply</span>
                    {item.prescriptionRequired && (
                      <span className="ms-badge-rx" style={{ fontSize: "9.5px" }}>
                        Rx Required
                      </span>
                    )}
                  </div>
                </div>

                {/* Days Supply Selector */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>Supply:</span>
                  <select
                    value={item.daysSupply || 30}
                    onChange={(e) => handleUpdateDaysSupply(idx, Number(e.target.value))}
                    style={{
                      padding: "4px 8px",
                      fontSize: "12px",
                      borderRadius: "6px",
                      border: "1px solid #e2e8f0",
                      background: "#ffffff",
                    }}
                  >
                    <option value={15}>15 Days</option>
                    <option value={30}>30 Days</option>
                    <option value={45}>45 Days</option>
                    <option value={60}>60 Days</option>
                  </select>
                </div>

                {/* Quantity Stepper */}
                <div className="ms-stepper">
                  <button
                    type="button"
                    className="ms-stepper-btn"
                    onClick={() => handleUpdateQuantity(idx, -1)}
                    title="Decrease quantity"
                  >
                    <FiMinus size={13} />
                  </button>
                  <span className="ms-stepper-val">{item.quantity}</span>
                  <button
                    type="button"
                    className="ms-stepper-btn"
                    onClick={() => handleUpdateQuantity(idx, 1)}
                    title="Increase quantity"
                  >
                    <FiPlus size={13} />
                  </button>
                </div>

                {/* Subtotal */}
                <div className="ms-cart-item-price">₹{itemTotal}</div>

                {/* Delete Button */}
                <button
                  type="button"
                  className="ms-btn-remove"
                  onClick={() => handleRemoveItem(idx)}
                  title="Remove from cart"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            );
          })}

          <div style={{ marginTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Link to="/user/dashboard/medical-store" style={{ color: "#16a34a", fontSize: "13.5px", fontWeight: "600", textDecoration: "none" }}>
              + Add More Medicines
            </Link>
          </div>
        </div>

        {/* Order Summary Sticky Panel */}
        <aside className="ms-summary-card">
          <h3 className="ms-summary-title">Order Summary</h3>

          <div className="ms-summary-row">
            <span>Items Subtotal</span>
            <span style={{ fontWeight: "700", color: "#0f172a" }}>₹{subtotal}</span>
          </div>

          <div className="ms-summary-row">
            <span>Standard Delivery</span>
            {deliveryFee === 0 ? (
              <span className="ms-free-delivery-badge">FREE</span>
            ) : (
              <span style={{ fontWeight: "600", color: "#0f172a" }}>₹{deliveryFee}</span>
            )}
          </div>

          {subtotal < 500 && (
            <div style={{ fontSize: "12px", color: "#15803d", background: "#f0fdf4", padding: "8px 12px", borderRadius: "8px", marginBottom: "14px" }}>
              💡 Add ₹{500 - subtotal} more to qualify for <strong>FREE Delivery</strong>!
            </div>
          )}

          <div className="ms-summary-row ms-summary-row--total">
            <span>Estimated Total</span>
            <span>₹{grandTotal}</span>
          </div>

          <button
            type="button"
            className="ms-btn-checkout"
            onClick={() => navigate("/user/dashboard/medical-store/checkout")}
          >
            Proceed to Checkout <FiArrowRight size={16} />
          </button>

          <div style={{ marginTop: "18px", display: "flex", gap: "8px", alignItems: "center", justifyContent: "center", fontSize: "12px", color: "#64748b" }}>
            <FiShield size={14} color="#16a34a" /> 256-Bit SSL Encrypted Healthcare Checkout
          </div>
        </aside>
      </div>
    </div>
  );
}
