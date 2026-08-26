import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  FiSearch,
  FiUserCheck,
  FiUserX,
  FiCheck,
  FiX,
  FiRefreshCw,
  FiAlertCircle,
  FiEye,
  FiChevronLeft,
  FiChevronRight,
  FiAward,
} from "react-icons/fi";
import "../Css_for_all/AdminDashboard.css";

export default function DoctorsManagement() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [selectedDoctorDetail, setSelectedDoctorDetail] = useState(null);
  const [doctorToReject, setDoctorToReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const token = localStorage.getItem("adminToken");

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/v1/admin/doctors", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setDoctors(Array.isArray(data.data) ? data.data : []);
      } else {
        setError(data.message || "Failed to fetch doctors");
      }
    } catch (err) {
      console.error("Doctors fetch error:", err);
      setError("Unable to connect to doctor database. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  // Approve Doctor
  const handleApprove = async (doctorId) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/doctors/${doctorId}/approval`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ approvalStatus: "approved" }),
      });

      const data = await res.json();
      if (res.ok) {
        setDoctors((prev) =>
          prev.map((d) => (d._id === doctorId ? { ...d, approvalStatus: "approved" } : d))
        );
        if (selectedDoctorDetail?._id === doctorId) {
          setSelectedDoctorDetail((prev) => ({ ...prev, approvalStatus: "approved" }));
        }
      } else {
        alert(data.message || "Failed to approve doctor");
      }
    } catch (err) {
      console.error("Approval error:", err);
      alert("Network error while approving doctor.");
    } finally {
      setActionLoading(false);
    }
  };

  // Reject Doctor
  const handleReject = async () => {
    if (!doctorToReject) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/v1/admin/doctors/${doctorToReject._id}/approval`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          approvalStatus: "rejected",
          rejectionReason: rejectionReason || "Application criteria not met",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setDoctors((prev) =>
          prev.map((d) =>
            d._id === doctorToReject._id
              ? { ...d, approvalStatus: "rejected", rejectionReason }
              : d
          )
        );
        setDoctorToReject(null);
        setRejectionReason("");
      } else {
        alert(data.message || "Failed to reject doctor");
      }
    } catch (err) {
      console.error("Rejection error:", err);
      alert("Network error while rejecting doctor.");
    } finally {
      setActionLoading(false);
    }
  };

  // Block / Unblock Doctor
  const handleToggleBlock = async (doctor) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/doctors/${doctor._id}/block`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isBlocked: !doctor.isBlocked }),
      });

      const data = await res.json();
      if (res.ok) {
        setDoctors((prev) =>
          prev.map((d) => (d._id === doctor._id ? { ...d, isBlocked: !doctor.isBlocked } : d))
        );
        if (selectedDoctorDetail?._id === doctor._id) {
          setSelectedDoctorDetail((prev) => ({ ...prev, isBlocked: !doctor.isBlocked }));
        }
      } else {
        alert(data.message || "Failed to update doctor block status");
      }
    } catch (err) {
      console.error("Block toggle error:", err);
      alert("Network error while updating doctor status.");
    } finally {
      setActionLoading(false);
    }
  };

  // Unique specializations for filter dropdown
  const specialties = useMemo(() => {
    const set = new Set(doctors.map((d) => d.specialization).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [doctors]);

  // Filtered doctors list
  const filteredDoctors = useMemo(() => {
    let list = [...doctors];

    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (d) =>
          d.fullname?.toLowerCase().includes(q) ||
          d.email?.toLowerCase().includes(q) ||
          d.specialization?.toLowerCase().includes(q) ||
          d.clinic?.toLowerCase().includes(q) ||
          d.registrationNumber?.toLowerCase().includes(q)
      );
    }

    // 2. Status Filter
    if (statusFilter !== "all") {
      if (statusFilter === "blocked") {
        list = list.filter((d) => d.isBlocked);
      } else {
        list = list.filter((d) => d.approvalStatus === statusFilter);
      }
    }

    // 3. Specialty Filter
    if (specialtyFilter !== "all") {
      list = list.filter((d) => d.specialization === specialtyFilter);
    }

    return list;
  }, [doctors, searchQuery, statusFilter, specialtyFilter]);

  // Paginated slice
  const totalPages = Math.ceil(filteredDoctors.length / pageSize) || 1;
  const paginatedDoctors = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDoctors.slice(start, start + pageSize);
  }, [filteredDoctors, currentPage, pageSize]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div>
      {/* Page Header */}
      <div className="ap-page-header">
        <div>
          <h1 className="ap-page-title">Doctors Management</h1>
          <p className="ap-page-subtitle">
            Manage medical practitioner credentials, approvals, specializations, and clinic records.
          </p>
        </div>

        <button
          type="button"
          className="ap-btn-action"
          onClick={() => fetchDoctors()}
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

      {/* Table Card */}
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
              All ({doctors.length})
            </button>
            <button
              type="button"
              className={`ap-tab-btn ${statusFilter === "approved" ? "ap-tab-btn--active" : ""}`}
              onClick={() => {
                setStatusFilter("approved");
                setCurrentPage(1);
              }}
            >
              Approved ({doctors.filter((d) => d.approvalStatus === "approved").length})
            </button>
            <button
              type="button"
              className={`ap-tab-btn ${statusFilter === "pending" ? "ap-tab-btn--active" : ""}`}
              onClick={() => {
                setStatusFilter("pending");
                setCurrentPage(1);
              }}
            >
              Pending ({doctors.filter((d) => d.approvalStatus === "pending").length})
            </button>
            <button
              type="button"
              className={`ap-tab-btn ${statusFilter === "rejected" ? "ap-tab-btn--active" : ""}`}
              onClick={() => {
                setStatusFilter("rejected");
                setCurrentPage(1);
              }}
            >
              Rejected ({doctors.filter((d) => d.approvalStatus === "rejected").length})
            </button>
            <button
              type="button"
              className={`ap-tab-btn ${statusFilter === "blocked" ? "ap-tab-btn--active" : ""}`}
              onClick={() => {
                setStatusFilter("blocked");
                setCurrentPage(1);
              }}
            >
              Blocked ({doctors.filter((d) => d.isBlocked).length})
            </button>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            {/* Specialty Dropdown */}
            <select
              value={specialtyFilter}
              onChange={(e) => {
                setSpecialtyFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="ap-table-search"
              style={{ width: "auto", padding: "8px 12px" }}
            >
              {specialties.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "All Specializations" : s}
                </option>
              ))}
            </select>

            {/* Search Input */}
            <div className="ap-search-input-wrap">
              <FiSearch className="ap-search-icon" />
              <input
                type="text"
                placeholder="Search doctors, clinic, reg #..."
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
                <th>Doctor</th>
                <th>Email</th>
                <th>Specialization</th>
                <th>Registration #</th>
                <th>Approval</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "40px" }}>
                    <div className="hr-spinner" style={{ width: "28px", height: "28px" }} />
                    <p style={{ fontSize: "13px", color: "#64748b", marginTop: "10px" }}>Loading doctors list...</p>
                  </td>
                </tr>
              ) : paginatedDoctors.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                    No doctors found matching your criteria.
                  </td>
                </tr>
              ) : (
                paginatedDoctors.map((doc) => (
                  <tr key={doc._id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        {doc.avatar ? (
                          <img
                            src={doc.avatar}
                            alt={doc.fullname}
                            style={{ width: "34px", height: "34px", borderRadius: "10px", objectFit: "cover" }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "34px",
                              height: "34px",
                              borderRadius: "10px",
                              background: "#dcfce7",
                              color: "#15803d",
                              fontWeight: "800",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "13px",
                            }}
                          >
                            {doc.fullname?.charAt(0) || "D"}
                          </div>
                        )}
                        <div>
                          <strong style={{ display: "block" }}>Dr. {doc.fullname}</strong>
                          <span style={{ fontSize: "11.5px", color: "#64748b" }}>{doc.degree}</span>
                        </div>
                      </div>
                    </td>
                    <td>{doc.email}</td>
                    <td>
                      <span style={{ color: "#16a34a", fontWeight: "600" }}>{doc.specialization}</span>
                    </td>
                    <td>{doc.registrationNumber || "—"}</td>
                    <td>
                      <span className={`ap-badge ap-badge--${doc.approvalStatus || "pending"}`}>
                        {doc.approvalStatus || "pending"}
                      </span>
                    </td>
                    <td>
                      <span className={`ap-badge ${doc.isBlocked ? "ap-badge--blocked" : "ap-badge--active"}`}>
                        {doc.isBlocked ? "Blocked" : "Active"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button
                          type="button"
                          className="ap-btn-action"
                          onClick={() => setSelectedDoctorDetail(doc)}
                          title="View doctor details"
                        >
                          <FiEye size={13} /> View
                        </button>

                        {doc.approvalStatus === "pending" && (
                          <>
                            <button
                              type="button"
                              className="ap-btn-action ap-btn-action--approve"
                              onClick={() => handleApprove(doc._id)}
                              disabled={actionLoading}
                              title="Approve credentials"
                            >
                              <FiCheck size={13} /> Approve
                            </button>
                            <button
                              type="button"
                              className="ap-btn-action ap-btn-action--reject"
                              onClick={() => setDoctorToReject(doc)}
                              disabled={actionLoading}
                              title="Reject application"
                            >
                              <FiX size={13} /> Reject
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          className={`ap-btn-action ${doc.isBlocked ? "ap-btn-action--approve" : "ap-btn-action--reject"}`}
                          onClick={() => handleToggleBlock(doc)}
                          disabled={actionLoading}
                          title={doc.isBlocked ? "Unblock doctor" : "Block doctor"}
                        >
                          {doc.isBlocked ? "Unblock" : "Block"}
                        </button>
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
            Showing <strong>{paginatedDoctors.length}</strong> of <strong>{filteredDoctors.length}</strong> doctors
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

      {/* ─── Doctor Details Modal ─── */}
      {selectedDoctorDetail && (
        <div className="ap-modal-backdrop" onClick={() => setSelectedDoctorDetail(null)}>
          <div className="ap-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setSelectedDoctorDetail(null)}
              style={{ position: "absolute", top: "18px", right: "18px", background: "#f1f5f9", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <FiX size={16} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "18px" }}>
              {selectedDoctorDetail.avatar ? (
                <img
                  src={selectedDoctorDetail.avatar}
                  alt={selectedDoctorDetail.fullname}
                  style={{ width: "56px", height: "56px", borderRadius: "16px", objectFit: "cover" }}
                />
              ) : (
                <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "#dcfce7", color: "#15803d", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: "800" }}>
                  {selectedDoctorDetail.fullname?.charAt(0) || "D"}
                </div>
              )}
              <div>
                <h3 className="ap-modal-title" style={{ margin: "0 0 2px" }}>
                  Dr. {selectedDoctorDetail.fullname}
                </h3>
                <span style={{ fontSize: "13px", color: "#16a34a", fontWeight: "700" }}>
                  {selectedDoctorDetail.specialization} • {selectedDoctorDetail.degree}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13.5px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: "#64748b" }}>Email:</span>
                <strong>{selectedDoctorDetail.email}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: "#64748b" }}>Registration Number:</span>
                <strong>{selectedDoctorDetail.registrationNumber || "N/A"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: "#64748b" }}>Clinic / Hospital:</span>
                <strong>{selectedDoctorDetail.clinic || "Private Practice"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: "#64748b" }}>Experience:</span>
                <strong>{selectedDoctorDetail.experience || "Not stated"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: "#64748b" }}>Approval Status:</span>
                <span className={`ap-badge ap-badge--${selectedDoctorDetail.approvalStatus || "pending"}`}>
                  {selectedDoctorDetail.approvalStatus || "pending"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                <span style={{ color: "#64748b" }}>Submitted Date:</span>
                <strong>{formatDate(selectedDoctorDetail.createdAt)}</strong>
              </div>
              {selectedDoctorDetail.bio && (
                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "4px" }}>
                    Doctor Bio:
                  </span>
                  <p style={{ margin: 0, color: "#334155" }}>{selectedDoctorDetail.bio}</p>
                </div>
              )}
            </div>

            <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="ap-btn-action"
                onClick={() => setSelectedDoctorDetail(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Rejection Reason Modal ─── */}
      {doctorToReject && (
        <div className="ap-modal-backdrop" onClick={() => setDoctorToReject(null)}>
          <div className="ap-modal-card" style={{ maxWidth: "460px" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="ap-modal-title">Reject Doctor Application</h3>
            <p style={{ fontSize: "13.5px", color: "#64748b", margin: "0 0 16px" }}>
              Provide a reason for rejecting Dr. {doctorToReject.fullname}'s registration. An email notice will be sent.
            </p>

            <textarea
              className="ap-table-search"
              rows={4}
              placeholder="e.g., Medical registration number could not be verified on the state medical council register..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", resize: "vertical" }}
            />

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "18px" }}>
              <button
                type="button"
                className="ap-btn-action"
                onClick={() => setDoctorToReject(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ap-btn-action ap-btn-action--reject"
                onClick={handleReject}
                disabled={actionLoading}
              >
                {actionLoading ? "Processing..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
