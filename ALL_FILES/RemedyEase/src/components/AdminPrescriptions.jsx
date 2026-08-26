import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  FiSearch,
  FiFileText,
  FiDownload,
  FiEye,
  FiX,
  FiRefreshCw,
  FiAlertCircle,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiExternalLink,
} from "react-icons/fi";
import "../Css_for_all/AdminDashboard.css";

export default function AdminPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Preview Modal
  const [previewPrescription, setPreviewPrescription] = useState(null);

  const token = localStorage.getItem("adminToken");

  const fetchPrescriptions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/v1/admin/prescriptions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setPrescriptions(Array.isArray(data.data) ? data.data : []);
      } else {
        setError(data.message || "Failed to fetch prescriptions");
      }
    } catch (err) {
      console.error("Prescriptions fetch error:", err);
      setError("Unable to connect to prescription service. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  /* ─── Robust Date Formatter (Fixes "Invalid Date") ─── */
  const formatDate = (dateStr) => {
    if (!dateStr || dateStr.trim() === "") return "Date unavailable";

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

  // Filtered list
  const filteredPrescriptions = useMemo(() => {
    if (!searchQuery.trim()) return prescriptions;
    const q = searchQuery.toLowerCase().trim();
    return prescriptions.filter(
      (p) =>
        p.doctorName?.toLowerCase().includes(q) ||
        p.doctorEmail?.toLowerCase().includes(q) ||
        p.userName?.toLowerCase().includes(q) ||
        p.userEmail?.toLowerCase().includes(q) ||
        p.prescription?.toLowerCase().includes(q)
    );
  }, [prescriptions, searchQuery]);

  // Paginated slice
  const totalPages = Math.ceil(filteredPrescriptions.length / pageSize) || 1;
  const paginatedPrescriptions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPrescriptions.slice(start, start + pageSize);
  }, [filteredPrescriptions, currentPage, pageSize]);

  return (
    <div>
      {/* Page Header */}
      <div className="ap-page-header">
        <div>
          <h1 className="ap-page-title">Prescriptions Management</h1>
          <p className="ap-page-subtitle">
            Review and download medical prescriptions and clinical directives uploaded by certified doctors.
          </p>
        </div>

        <button
          type="button"
          className="ap-btn-action"
          onClick={() => fetchPrescriptions()}
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
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>
              All Prescriptions
            </span>
            <span className="ap-badge ap-badge--completed">{prescriptions.length} Records</span>
          </div>

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

        {/* Table */}
        <div className="ap-table-responsive">
          <table className="ap-table">
            <thead>
              <tr>
                <th>Uploaded Date</th>
                <th>Doctor</th>
                <th>Patient</th>
                <th>Consultation Date</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "40px" }}>
                    <div className="hr-spinner" style={{ width: "28px", height: "28px" }} />
                    <p style={{ fontSize: "13px", color: "#64748b", marginTop: "10px" }}>Loading prescription files...</p>
                  </td>
                </tr>
              ) : paginatedPrescriptions.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "50px 20px" }}>
                    <div style={{ fontSize: "36px", marginBottom: "10px" }}>💊</div>
                    <strong style={{ fontSize: "15px", color: "#0f172a", display: "block", marginBottom: "4px" }}>
                      No Prescriptions Found
                    </strong>
                    <p style={{ fontSize: "13.5px", color: "#64748b", margin: 0 }}>
                      No prescription files have been uploaded yet or match your search.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedPrescriptions.map((apt) => (
                  <tr key={apt._id}>
                    <td>
                      <strong style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <FiCalendar size={13} color="#16a34a" />{" "}
                        {formatDate(apt.prescriptionUploadedAt || apt.createdAt)}
                      </strong>
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
                    <td>{formatDate(apt.date)}</td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button
                          type="button"
                          className="ap-btn-action"
                          onClick={() => setPreviewPrescription(apt)}
                          title="Preview prescription"
                        >
                          <FiEye size={13} /> Preview
                        </button>
                        {apt.prescriptionFile && (
                          <a
                            href={apt.prescriptionFile}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="ap-btn-action ap-btn-action--approve"
                            title="Download prescription file"
                          >
                            <FiDownload size={13} /> Download
                          </a>
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
            Showing <strong>{paginatedPrescriptions.length}</strong> of <strong>{filteredPrescriptions.length}</strong> prescriptions
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

      {/* ─── Prescription Preview Modal ─── */}
      {previewPrescription && (
        <div className="ap-modal-backdrop" onClick={() => setPreviewPrescription(null)}>
          <div className="ap-modal-card" style={{ maxWidth: "640px" }} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewPrescription(null)}
              style={{ position: "absolute", top: "18px", right: "18px", background: "#f1f5f9", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <FiX size={16} />
            </button>

            <h3 className="ap-modal-title">Prescription File Preview</h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px" }}>
              Issued by Dr. {previewPrescription.doctorName} for {previewPrescription.userName} on {formatDate(previewPrescription.date)}
            </p>

            <div style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: "14px", overflow: "hidden", minHeight: "260px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {previewPrescription.prescriptionFile?.endsWith(".pdf") ? (
                <iframe
                  src={previewPrescription.prescriptionFile}
                  title="Prescription PDF"
                  style={{ width: "100%", height: "400px", border: "none" }}
                />
              ) : previewPrescription.prescriptionFile ? (
                <img
                  src={previewPrescription.prescriptionFile}
                  alt="Prescription Scan"
                  style={{ maxWidth: "100%", maxHeight: "400px", objectFit: "contain" }}
                />
              ) : (
                <p style={{ color: "#94a3b8" }}>Prescription document scan not available.</p>
              )}
            </div>

            {previewPrescription.prescription && (
              <div style={{ marginTop: "16px", background: "#f0fdf4", padding: "12px", borderRadius: "10px", border: "1px solid #dcfce7" }}>
                <strong style={{ fontSize: "12.5px", color: "#15803d", display: "block", marginBottom: "4px" }}>
                  Clinical Directives / Medication Notes:
                </strong>
                <p style={{ margin: 0, color: "#166534", fontSize: "13px" }}>
                  {previewPrescription.prescription}
                </p>
              </div>
            )}

            <div style={{ marginTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <a
                href={previewPrescription.prescriptionFile}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: "13px", color: "#16a34a", fontWeight: "700", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "5px" }}
              >
                Open in Full Window <FiExternalLink size={13} />
              </a>

              <div style={{ display: "flex", gap: "10px" }}>
                {previewPrescription.prescriptionFile && (
                  <a
                    href={previewPrescription.prescriptionFile}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ap-btn-action ap-btn-action--approve"
                  >
                    <FiDownload size={13} /> Download File
                  </a>
                )}
                <button
                  type="button"
                  className="ap-btn-action"
                  onClick={() => setPreviewPrescription(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
