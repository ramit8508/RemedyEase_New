import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  FiSearch,
  FiUserCheck,
  FiUserX,
  FiRefreshCw,
  FiAlertCircle,
  FiEye,
  FiX,
  FiShield,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import "../Css_for_all/AdminDashboard.css";

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [bloodGroupFilter, setBloodGroupFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [userToBlock, setUserToBlock] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const token = localStorage.getItem("adminToken");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/v1/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setUsers(Array.isArray(data.data) ? data.data : []);
      } else {
        setError(data.message || "Failed to fetch users");
      }
    } catch (err) {
      console.error("Users fetch error:", err);
      setError("Unable to connect to user database. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Block / Unblock handler
  const handleToggleBlock = async () => {
    if (!userToBlock) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/v1/admin/users/${userToBlock._id}/block`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isBlocked: !userToBlock.isBlocked }),
      });

      const data = await res.json();
      if (res.ok) {
        // Update user state locally
        setUsers((prev) =>
          prev.map((u) =>
            u._id === userToBlock._id ? { ...u, isBlocked: !userToBlock.isBlocked } : u
          )
        );
        setUserToBlock(null);
      } else {
        alert(data.message || "Failed to update user block status");
      }
    } catch (err) {
      console.error("Error toggling user block:", err);
      alert("Network error while updating user status.");
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered users list
  const filteredUsers = useMemo(() => {
    let list = [...users];

    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (u) =>
          u.fullname?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.phone?.toLowerCase().includes(q)
      );
    }

    // 2. Status Filter
    if (statusFilter === "active") {
      list = list.filter((u) => !u.isBlocked);
    } else if (statusFilter === "blocked") {
      list = list.filter((u) => u.isBlocked);
    }

    // 3. Blood Group Filter
    if (bloodGroupFilter !== "all") {
      list = list.filter((u) => u.bloodGroup?.toLowerCase() === bloodGroupFilter.toLowerCase());
    }

    return list;
  }, [users, searchQuery, statusFilter, bloodGroupFilter]);

  // Paginated Slice
  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

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
          <h1 className="ap-page-title">Patients & Users</h1>
          <p className="ap-page-subtitle">
            Manage registered patients, review profile credentials, and manage account security.
          </p>
        </div>

        <button
          type="button"
          className="ap-btn-action"
          onClick={() => fetchUsers()}
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
              All ({users.length})
            </button>
            <button
              type="button"
              className={`ap-tab-btn ${statusFilter === "active" ? "ap-tab-btn--active" : ""}`}
              onClick={() => {
                setStatusFilter("active");
                setCurrentPage(1);
              }}
            >
              Active ({users.filter((u) => !u.isBlocked).length})
            </button>
            <button
              type="button"
              className={`ap-tab-btn ${statusFilter === "blocked" ? "ap-tab-btn--active" : ""}`}
              onClick={() => {
                setStatusFilter("blocked");
                setCurrentPage(1);
              }}
            >
              Blocked ({users.filter((u) => u.isBlocked).length})
            </button>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            {/* Blood group dropdown */}
            <select
              value={bloodGroupFilter}
              onChange={(e) => {
                setBloodGroupFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="ap-table-search"
              style={{ width: "auto", padding: "8px 12px" }}
            >
              <option value="all">All Blood Groups</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </select>

            {/* Search Input */}
            <div className="ap-search-input-wrap">
              <FiSearch className="ap-search-icon" />
              <input
                type="text"
                placeholder="Search by name, email..."
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

        {/* Table View */}
        <div className="ap-table-responsive">
          <table className="ap-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Email</th>
                <th>Blood Group</th>
                <th>Status</th>
                <th>Registered</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "40px" }}>
                    <div className="hr-spinner" style={{ width: "28px", height: "28px" }} />
                    <p style={{ fontSize: "13px", color: "#64748b", marginTop: "10px" }}>Loading patient records...</p>
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                    No users matching the criteria.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
                          {user.fullname?.charAt(0) || "P"}
                        </div>
                        <strong>{user.fullname || "Anonymous"}</strong>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>{user.bloodGroup || "—"}</td>
                    <td>
                      <span className={`ap-badge ${user.isBlocked ? "ap-badge--blocked" : "ap-badge--active"}`}>
                        {user.isBlocked ? "Blocked" : "Active"}
                      </span>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button
                          type="button"
                          className="ap-btn-action"
                          onClick={() => setSelectedUserDetail(user)}
                          title="View user details"
                        >
                          <FiEye size={13} /> View
                        </button>
                        <button
                          type="button"
                          className={`ap-btn-action ${user.isBlocked ? "ap-btn-action--approve" : "ap-btn-action--reject"}`}
                          onClick={() => setUserToBlock(user)}
                          title={user.isBlocked ? "Unblock account" : "Block account"}
                        >
                          {user.isBlocked ? (
                            <>
                              <FiUserCheck size={13} /> Unblock
                            </>
                          ) : (
                            <>
                              <FiUserX size={13} /> Block
                            </>
                          )}
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
            Showing <strong>{paginatedUsers.length}</strong> of <strong>{filteredUsers.length}</strong> patients
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

      {/* ─── User Details Modal ─── */}
      {selectedUserDetail && (
        <div className="ap-modal-backdrop" onClick={() => setSelectedUserDetail(null)}>
          <div className="ap-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setSelectedUserDetail(null)}
              style={{ position: "absolute", top: "18px", right: "18px", background: "#f1f5f9", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <FiX size={16} />
            </button>

            <h3 className="ap-modal-title">Patient Profile Details</h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 18px" }}>
              Comprehensive patient record information registered in RemedyEase.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13.5px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: "#64748b" }}>Full Name:</span>
                <strong>{selectedUserDetail.fullname || "N/A"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: "#64748b" }}>Email:</span>
                <strong>{selectedUserDetail.email}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: "#64748b" }}>Phone:</span>
                <strong>{selectedUserDetail.phone || "Not provided"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: "#64748b" }}>Blood Group:</span>
                <strong>{selectedUserDetail.bloodGroup || "Not specified"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: "#64748b" }}>Allergies:</span>
                <strong style={{ color: selectedUserDetail.allergies ? "#b45309" : "#0f172a" }}>
                  {selectedUserDetail.allergies || "None declared"}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: "#64748b" }}>Account Status:</span>
                <span className={`ap-badge ${selectedUserDetail.isBlocked ? "ap-badge--blocked" : "ap-badge--active"}`}>
                  {selectedUserDetail.isBlocked ? "Blocked" : "Active"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                <span style={{ color: "#64748b" }}>Registered Date:</span>
                <strong>{formatDate(selectedUserDetail.createdAt)}</strong>
              </div>
            </div>

            <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="ap-btn-action"
                onClick={() => setSelectedUserDetail(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Block / Unblock Confirmation Modal ─── */}
      {userToBlock && (
        <div className="ap-modal-backdrop" onClick={() => setUserToBlock(null)}>
          <div className="ap-modal-card" style={{ maxWidth: "440px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: userToBlock.isBlocked ? "#dcfce7" : "#fee2e2", color: userToBlock.isBlocked ? "#15803d" : "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", marginBottom: "14px" }}>
              {userToBlock.isBlocked ? <FiUserCheck /> : <FiUserX />}
            </div>

            <h3 className="ap-modal-title">
              {userToBlock.isBlocked ? "Unblock Patient Account?" : "Block Patient Account?"}
            </h3>

            <p style={{ fontSize: "13.5px", color: "#64748b", lineHeight: "1.5", margin: "0 0 20px" }}>
              {userToBlock.isBlocked
                ? `Are you sure you want to unblock ${userToBlock.fullname || userToBlock.email}? They will regain full access to their dashboard and appointments.`
                : `Are you sure you want to block ${userToBlock.fullname || userToBlock.email}? This user will no longer be able to log in or book consultations.`}
            </p>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="ap-btn-action"
                onClick={() => setUserToBlock(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`ap-btn-action ${userToBlock.isBlocked ? "ap-btn-action--approve" : "ap-btn-action--reject"}`}
                onClick={handleToggleBlock}
                disabled={actionLoading}
              >
                {actionLoading
                  ? "Processing..."
                  : userToBlock.isBlocked
                  ? "Unblock User"
                  : "Block User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
