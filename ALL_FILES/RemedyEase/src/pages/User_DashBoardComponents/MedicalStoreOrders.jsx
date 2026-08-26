import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiPackage,
  FiClock,
  FiTruck,
  FiCheckCircle,
  FiXCircle,
  FiEye,
  FiAlertCircle,
  FiShoppingBag,
  FiX,
  FiMapPin,
} from "react-icons/fi";
import "../../Css_for_all/MedicalStore.css";

const STATUS_TABS = [
  { id: "all", label: "All Orders" },
  { id: "active", label: "Active Orders" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
];

export default function MedicalStoreOrders() {
  const navigate = useNavigate();

  // State
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [error, setError] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchOrders = useCallback(async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const url = `/api/v1/orders/user/${encodeURIComponent(user.email)}${
        activeTab !== "all" ? `?status=${activeTab}` : ""
      }`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.data) {
        setOrders(data.data.orders || []);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setError("Unable to load order history. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user?.email, activeTab]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Handle Cancel Order
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;

    setCancelling(true);
    try {
      const res = await fetch(`/api/v1/orders/${orderId}/cancel`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: user.email,
          reason: cancelReason || "Cancelled by patient via dashboard",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedOrder(null);
        fetchOrders();
      } else {
        alert(data.message || "Failed to cancel order.");
      }
    } catch (err) {
      console.error("Cancel error:", err);
      alert("Network error. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  const renderStatusBadge = (status) => {
    const s = (status || "confirmed").toLowerCase();
    let badgeClass = "ms-status-badge--confirmed";
    let icon = <FiClock size={12} />;

    if (s === "processing") {
      badgeClass = "ms-status-badge--processing";
      icon = <FiClock size={12} />;
    } else if (s === "shipped" || s === "out_for_delivery") {
      badgeClass = "ms-status-badge--shipped";
      icon = <FiTruck size={12} />;
    } else if (s === "delivered") {
      badgeClass = "ms-status-badge--delivered";
      icon = <FiCheckCircle size={12} />;
    } else if (s === "cancelled") {
      badgeClass = "ms-status-badge--cancelled";
      icon = <FiXCircle size={12} />;
    }

    return (
      <span className={`ms-status-badge ${badgeClass}`}>
        {icon} {status.replace("_", " ")}
      </span>
    );
  };

  return (
    <div className="ms-container">
      {/* Header */}
      <header className="ms-header">
        <div className="ms-header-info">
          <h1>
            My Medicine Orders <span className="ms-header-badge">Order History</span>
          </h1>
          <p>Track your medicine shipments, view invoices, and manage orders.</p>
        </div>

        <Link to="/user/dashboard/medical-store" className="ms-btn-cart">
          <FiShoppingBag size={16} /> Browse Pharmacy
        </Link>
      </header>

      {/* Filter Tabs */}
      <div className="ms-category-pills" style={{ marginBottom: "20px" }}>
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`ms-category-pill ${activeTab === tab.id ? "ms-category-pill--active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="ms-skeleton-card" style={{ height: "120px" }}>
              <div className="ms-shimmer" style={{ height: "20px", width: "40%" }} />
              <div className="ms-shimmer" style={{ height: "14px", width: "70%" }} />
              <div className="ms-shimmer" style={{ height: "20px", width: "20%" }} />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        /* Empty State */
        <div className="ms-empty-state">
          <div className="ms-empty-icon">
            <FiPackage />
          </div>
          <h3>No orders found</h3>
          <p>You haven't placed any medicine orders in this section yet.</p>
          <Link to="/user/dashboard/medical-store" className="ms-btn-nav" style={{ display: "inline-flex" }}>
            Browse Medical Store
          </Link>
        </div>
      ) : (
        /* Order Cards Grid */
        <div className="ms-orders-grid">
          {orders.map((ord) => {
            const dateStr = new Date(ord.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });

            return (
              <div key={ord._id || ord.orderId} className="ms-order-card">
                {/* Header */}
                <div className="ms-order-header">
                  <div>
                    <span className="ms-order-id">Order #{ord.orderId}</span>
                    <span className="ms-order-date" style={{ marginLeft: "10px" }}>
                      Placed on {dateStr}
                    </span>
                  </div>
                  <div>{renderStatusBadge(ord.status)}</div>
                </div>

                {/* Body */}
                <div className="ms-order-body">
                  <div className="ms-order-items-preview">
                    <strong>{ord.items?.length || 0} Items:</strong>{" "}
                    {ord.items?.map((item) => `${item.name} (${item.quantity}x)`).join(", ")}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div className="ms-order-total">₹{ord.totalAmount}</div>
                    <button
                      type="button"
                      className="ms-btn-nav"
                      onClick={() => setSelectedOrder(ord)}
                      style={{ padding: "8px 14px", fontSize: "13px" }}
                    >
                      <FiEye size={14} /> View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── ORDER DETAILS MODAL ─── */}
      {selectedOrder && (
        <div className="ms-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="ms-modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setSelectedOrder(null)}
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                background: "#f1f5f9",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <FiX size={16} />
            </button>

            <h3 style={{ fontFamily: "Manrope", fontSize: "20px", margin: "0 0 4px", fontWeight: "800" }}>
              Order #{selectedOrder.orderId}
            </h3>
            <p style={{ color: "#64748b", fontSize: "13px", margin: "0 0 20px" }}>
              Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
            </p>

            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "#334155" }}>Current Status</span>
                {renderStatusBadge(selectedOrder.status)}
              </div>
            </div>

            {/* Delivery Address */}
            <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "12px", marginBottom: "20px" }}>
              <div style={{ display: "flex", gap: "6px", alignItems: "center", fontWeight: "700", fontSize: "13.5px", marginBottom: "4px" }}>
                <FiMapPin size={15} color="#16a34a" /> Delivery Address
              </div>
              <p style={{ fontSize: "13px", color: "#475569", margin: "0", lineHeight: "1.4" }}>
                <strong>{selectedOrder.deliveryAddress?.fullName}</strong> ({selectedOrder.deliveryAddress?.phone})<br />
                {selectedOrder.deliveryAddress?.address}, {selectedOrder.deliveryAddress?.city},{" "}
                {selectedOrder.deliveryAddress?.state} - {selectedOrder.deliveryAddress?.pincode}
              </p>
            </div>

            {/* Items List */}
            <h4 style={{ fontFamily: "Manrope", fontSize: "15px", fontWeight: "700", margin: "0 0 10px" }}>
              Items Ordered
            </h4>
            <div style={{ border: "1px solid #f1f5f9", borderRadius: "12px", padding: "12px", marginBottom: "20px" }}>
              {selectedOrder.items?.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "13px",
                    padding: "8px 0",
                    borderBottom: idx === selectedOrder.items.length - 1 ? "none" : "1px solid #f8fafc",
                  }}
                >
                  <div>
                    <strong>{item.name}</strong> ({item.company})
                    <div style={{ fontSize: "11.5px", color: "#64748b" }}>
                      Qty: {item.quantity} • {item.daysSupply}d supply
                    </div>
                  </div>
                  <strong>₹{item.subtotal}</strong>
                </div>
              ))}
            </div>

            {/* Invoice Breakdown */}
            <div style={{ fontSize: "13.5px", color: "#475569", marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span>Subtotal</span>
                <span>₹{selectedOrder.subtotal}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span>Delivery Fee</span>
                <span>₹{selectedOrder.deliveryFee}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "16px",
                  fontWeight: "800",
                  color: "#0f172a",
                  paddingTop: "8px",
                  borderTop: "1px dashed #e2e8f0",
                }}
              >
                <span>Total Paid / Payable</span>
                <span>₹{selectedOrder.totalAmount}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {["confirmed", "pending", "processing"].includes(selectedOrder.status?.toLowerCase()) && (
                <button
                  type="button"
                  className="ms-btn-nav"
                  style={{ color: "#dc2626", borderColor: "#fecaca" }}
                  disabled={cancelling}
                  onClick={() => handleCancelOrder(selectedOrder.orderId)}
                >
                  {cancelling ? "Cancelling..." : "Cancel Order"}
                </button>
              )}

              <button
                type="button"
                className="ms-btn-cart"
                style={{ marginLeft: "auto" }}
                onClick={() => setSelectedOrder(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
