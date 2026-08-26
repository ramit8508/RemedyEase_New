import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  FiSearch,
  FiCalendar,
  FiClock,
  FiEye,
  FiX,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiFileText,
} from "react-icons/fi";
import "../Css_for_all/AdminDashboard.css";

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [successToast, setSuccessToast] = useState("");

  const token = localStorage.getItem("adminToken");

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/v1/admin/appointments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setAppointments(Array.isArray(data.data) ? data.data : []);
      } else {
        setError(data.message || "Failed to fetch appointments");
      }
    } catch (err) {
      console.error("Appointments fetch error:", err);
      setError("Unable to connect to appointment database. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 3500);
  };

  // Cancel Appointment
  const handleCancel = async () => {
    if (!appointmentToCancel) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/v1/admin/appointments/${appointmentToCancel._id}/cancel`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: cancelReason || "Cancelled by administrator" }),
      });

      const data = await res.json();
      if (res.ok) {
        setAppointments((prev) =>
          prev.map((a) =>
            a._id === appointmentToCancel._id
              ? { ...a, status: "cancelled", consultationNotes: cancelReason }
              : a
          )
        );
        if (selectedAppointment?._id === appointmentToCancel._id) {
          setSelectedAppointment((prev) => ({ ...prev, status: "cancelled" }));
        }
        setAppointmentToCancel(null);
        setCancelReason("");
        showToast("✓ Appointment cancelled and timeslot released!");
      } else {
        alert(data.message || "Failed to cancel appointment");
      }
    } catch (err) {
      console.error("Error cancelling appointment:", err);
      alert("Network error while cancelling appointment.");
    } finally {
      setActionLoading(false);
    }
  };

  /* ─── Robust Date Formatting (Fixes "Invalid Date") ─── */
  const formatDate = (dateStr) => {
    if (!dateStr || dateStr.trim() === "") return "Date unavailable";

    // If dateStr is format YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split("-");
      const d = new Date(Number(year), Number(month) - 1, Number(day));
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      }
    }

    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }

    return dateStr;
  };

  // Filtered appointments list
  const filteredAppointments = useMemo(() => {
    let list = [...appointments];

    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.userName?.toLowerCase().includes(q) ||
          a.userEmail?.toLowerCase().includes(q) ||
          a.doctorName?.toLowerCase().includes(q) ||
          a.doctorEmail?.toLowerCase().includes(q) ||
          a.symptoms?.toLowerCase().includes(q)
      );
    }

    // 2. Status Filter
    if (statusFilter !== "all") {
      list = list.filter((a) => a.status === statusFilter);
    }

    // 3. Date Filter
    if (dateFilter) {
      list = list.filter((a) => a.date === dateFilter);
    }

    return list;
  }, [appointments, searchQuery, statusFilter, dateFilter]);

  // Paginated slice
  const totalPages = Math.ceil(filteredAppointments.length / pageSize) || 1;
  const paginatedAppointments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAppointments.slice(start, start + pageSize);
  }, [filteredAppointments, currentPage, pageSize]);

  return (
    <div>
      {/* Toast */}
      {successToast && (
        <div style={{ position: "fixed", top: "24px", right: "24px", background: "#16a34a", color: "#ffffff", padding: "12px 20px", borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 1200, fontWeight: "700", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <FiCheckCircle size={16} /> {successToast}
        </div>
      )}

      {/* Page Header */}
      <div className="ap-page-header">
        <div>
          <h1 className="ap-page-title">Appointments Management</h1>
          <p className="ap-page-subtitle">
            View, filter, and manage patient consultations and doctor booking schedules.
          </p>
        </div>

        <button
          type="button"
          className="ap-btn-action"
          onClick={() => fetchAppointments()}
          disabled={loading}
        >
          <FiRefreshCw size={13} className={loading ? "hr-spin" : ""} /> Refresh
        </button>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "14px 18px", borderRadius: "12px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", color: "#b91c1c", fontSize: "13.5px" }}>
          <FiAlertCircle size={16} /> {error}
        </div>
      )}

      {/* Main Table Card */}
      <div className="ap-table-card">
        {/* Toolbar */}
        <div className="ap-toolbar">
          {/* Status Tabs */}
          <div className="ap-filter-tabs">
            <button
              type="button"
              className={`ap-tab-btn ${statusFilter === "all" ? "ap-tab-btn--active" : ""}`}
              onClick={() => {
                setStatusFilter("all");
                setCurrentPage(1);
              }}
            >
              All ({appointments.length})
            </button>
            <button
              type="button"
              className={`ap-tab-btn ${statusFilter === "pending" ? "ap-tab-btn--active" : ""}`}
              onClick={() => {
                setStatusFilter("pending");
                setCurrentPage(1);
              }}
            >
              Pending ({appointments.filter((a) => a.status === "pending").length})
            </button>
            <button
              type="button"
              className={`ap-tab-btn ${statusFilter === "confirmed" ? "ap-tab-btn--active" : ""}`}
              onClick={() => {
                setStatusFilter("confirmed");
                setCurrentPage(1);
              }}
            >
              Confirmed ({appointments.filter((a) => a.status === "confirmed").length})
            </button>
            <button
              type="button"
              className={`ap-tab-btn ${statusFilter === "completed" ? "ap-tab-btn--active" : ""}`}
              onClick={() => {
                setStatusFilter("completed");
                setCurrentPage(1);
              }}
            >
              Completed ({appointments.filter((a) => a.status === "completed").length})
            </button>
            <button
              type="button"
              className={`ap-tab-btn ${statusFilter === "cancelled" ? "ap-tab-btn--active" : ""}`}
              onClick={() => {
                setStatusFilter("cancelled");
                setCurrentPage(1);
              }}
            >
              Cancelled ({appointments.filter((a) => a.status === "cancelled").length})
            </button>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            {/* Date filter */}
            <input
              type="date"
              className="ap-table-search"
              style={{ width: "auto" }}
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
            />

            {/* Search Input */}
            <div className="ap-search-input-wrap">
              <FiSearch className="ap-search-icon" />
              <input
                type="text"
                placeholder="Search patient, doctor..."
                className="ap-table-search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="ap-table-responsive">
          <table className="ap-table">
            <thead>
              <tr>
                <th>Schedule Date & Time</th>
                <th>Doctor</th>
                <th>Patient</th>
                <th>Status</th>
                <th>Prescription</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "40px" }}>
                    <div className="hr-spinner" style={{ width: "28px", height: "28px" }} />
                    <p style={{ fontSize: "13px", color: "#64748b", marginTop: "10px" }}>Loading appointments...</p>
                  </td>
                </tr>
              ) : paginatedAppointments.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                    No appointments found matching your filters.
                  </td>
                </tr>
              ) : (
                paginatedAppointments.map((apt) => (
                  <tr key={apt._id}>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <strong style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <FiCalendar size={13} color="#16a34a" /> {formatDate(apt.date)}
                        </strong>
                        <span style={{ fontSize: "12px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                          <FiClock size={12} /> {apt.time || "Time not specified"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>Dr. {apt.doctorName || apt.doctorEmail}</strong>
                        <span style={{ fontSize: "11.5px", color: "#64748b", display: "block" }}>
                          {apt.doctorEmail}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{apt.userName || apt.userEmail}</strong>
                        <span style={{ fontSize: "11.5px", color: "#64748b", display: "block" }}>
                          {apt.userEmail}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`ap-badge ap-badge--${apt.status || "pending"}`}>
                        {apt.status || "pending"}
                      </span>
                    </td>
                    <td>
                      {apt.prescriptionFile ? (
                        <a
                          href={apt.prescriptionFile}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#16a34a", fontSize: "12.5px", fontWeight: "700", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}
                        >
                          <FiFileText size={13} /> View Rx
                        </a>
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: "12px" }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button
                          type="button"
                          className="ap-btn-action"
                          onClick={() => setSelectedAppointment(apt)}
                          title="View appointment details"
                        >
                          <FiEye size={13} /> View
                        </button>
                        {apt.status !== "cancelled" && apt.status !== "completed" && (
                          <button
                            type="button"
                            className="ap-btn-action ap-btn-action--reject"
                            onClick={() => setAppointmentToCancel(apt)}
                            title="Cancel appointment"
                          >
                            <FiX size={13} /> Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="ap-pagination-bar">
          <div>
            Showing <strong>{paginatedAppointments.length}</strong> of <strong>{filteredAppointments.length}</strong> appointments
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span>Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="ap-table-search"
                style={{ width: "auto", padding: "4px 8px", fontSize: "12.5px" }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="ap-page-buttons">
              <button
                type="button"
                className="ap-page-btn"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <FiChevronLeft />
              </button>
              <span style={{ fontSize: "12.5px", fontWeight: "600", padding: "0 6px" }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                className="ap-page-btn"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <FiChevronRight />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Appointment Details Modal ─── */}
      {selectedAppointment && (
        <div className="ap-modal-backdrop" onClick={() => setSelectedAppointment(null)}>
          <div className="ap-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setSelectedAppointment(null)}
              style={{ position: "absolute", top: "18px", right: "18px", background: "#f1f5f9", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <FiX size={16} />
            </button>

            <h3 className="ap-modal-title">Appointment Details</h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 18px" }}>
              Consultation ID: {selectedAppointment._id}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13.5px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: "#64748b" }}>Date & Time:</span>
                <strong>
                  {formatDate(selectedAppointment.date)} at {selectedAppointment.time}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: "#64748b" }}>Doctor:</span>
                <strong>Dr. {selectedAppointment.doctorName} ({selectedAppointment.doctorEmail})</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: "#64748b" }}>Patient:</span>
                <strong>{selectedAppointment.userName} ({selectedAppointment.userEmail})</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: "#64748b" }}>Status:</span>
                <span className={`ap-badge ap-badge--${selectedAppointment.status || "pending"}`}>
                  {selectedAppointment.status || "pending"}
                </span>
              </div>
              {selectedAppointment.symptoms && (
                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "4px" }}>
                    Patient Reported Symptoms:
                  </span>
                  <p style={{ margin: 0, color: "#334155" }}>{selectedAppointment.symptoms}</p>
                </div>
              )}
              {selectedAppointment.consultationNotes && (
                <div style={{ background: "#fffbeb", padding: "12px", borderRadius: "10px", border: "1px solid #fde68a" }}>
                  <span style={{ fontSize: "12px", color: "#92400e", display: "block", marginBottom: "4px" }}>
                    Consultation / Cancellation Notes:
                  </span>
                  <p style={{ margin: 0, color: "#78350f" }}>{selectedAppointment.consultationNotes}</p>
                </div>
              )}
            </div>

            <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              {selectedAppointment.status !== "cancelled" && selectedAppointment.status !== "completed" && (
                <button
                  type="button"
                  className="ap-btn-action ap-btn-action--reject"
                  onClick={() => {
                    setAppointmentToCancel(selectedAppointment);
                    setSelectedAppointment(null);
                  }}
                >
                  Cancel Consultation
                </button>
              )}
              <button
                type="button"
                className="ap-btn-action"
                onClick={() => setSelectedAppointment(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Cancel Confirmation Modal ─── */}
      {appointmentToCancel && (
        <div className="ap-modal-backdrop" onClick={() => setAppointmentToCancel(null)}>
          <div className="ap-modal-card" style={{ maxWidth: "460px" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="ap-modal-title">Cancel Appointment</h3>
            <p style={{ fontSize: "13.5px", color: "#64748b", margin: "0 0 16px" }}>
              Are you sure you want to cancel the appointment between <strong>{appointmentToCancel.userName}</strong> and <strong>Dr. {appointmentToCancel.doctorName}</strong> on <strong>{formatDate(appointmentToCancel.date)}</strong>? The doctor's timeslot will be released.
            </p>

            <textarea
              className="ap-table-search"
              rows={3}
              placeholder="Provide reason for cancellation..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", resize: "vertical" }}
            />

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "18px" }}>
              <button
                type="button"
                className="ap-btn-action"
                onClick={() => setAppointmentToCancel(null)}
                disabled={actionLoading}
              >
                Go Back
              </button>
              <button
                type="button"
                className="ap-btn-action ap-btn-action--reject"
                onClick={handleCancel}
                disabled={actionLoading}
              >
                {actionLoading ? "Processing..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
