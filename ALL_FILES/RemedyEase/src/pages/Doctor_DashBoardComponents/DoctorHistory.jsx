import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  FiUsers,
  FiCalendar,
  FiClock,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertCircle,
  FiFileText,
  FiEye,
  FiPlus,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiActivity,
  FiUser,
} from "react-icons/fi";
import "../../Css_for_all/DoctorHistory.css";
import "../../Css_for_all/DoctorDashboard.css";

export default function DoctorHistory() {
  let doctor = null;
  try {
    doctor = JSON.parse(localStorage.getItem("doctor"));
  } catch {}

  const doctorEmail = doctor?.email;

  // Data states
  const [consultationHistory, setConsultationHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successToast, setSuccessToast] = useState("");
  const [submittingTreatment, setSubmittingTreatment] = useState(false);

  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal states
  const [treatmentModalAppt, setTreatmentModalAppt] = useState(null);
  const [patientDetailModal, setPatientDetailModal] = useState(null);
  const [treatmentInput, setTreatmentInput] = useState("");
  const [prescriptionInput, setPrescriptionInput] = useState("");

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 3500);
  };

  // Fetch consultation history from backend
  const fetchConsultationHistory = useCallback(async () => {
    if (!doctorEmail) {
      setError("Doctor session not found. Please log in.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/v1/appointments/doctor/${doctorEmail}/history`
      );
      const data = await response.json();

      if (response.ok && data.success && Array.isArray(data.data)) {
        setConsultationHistory(data.data);
      } else {
        // Fallback: fetch appointments
        const apptRes = await fetch(`/api/v1/appointments/doctor/${doctorEmail}`);
        const apptData = await apptRes.json();
        if (apptRes.ok && Array.isArray(apptData.data)) {
          setConsultationHistory(apptData.data);
        } else {
          setConsultationHistory([]);
        }
      }
    } catch (err) {
      console.error("Error fetching consultation history:", err);
      setError("An error occurred while loading patient records.");
    } finally {
      setLoading(false);
    }
  }, [doctorEmail]);

  useEffect(() => {
    fetchConsultationHistory();
  }, [fetchConsultationHistory]);

  // Add Treatment Details Handler
  const handleSaveTreatment = async (e) => {
    e.preventDefault();
    if (!treatmentModalAppt || !treatmentInput.trim()) return;

    setSubmittingTreatment(true);

    try {
      const response = await fetch(
        `/api/v1/appointments/treatment/${treatmentModalAppt._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            treatment: treatmentInput.trim(),
            prescription: prescriptionInput.trim(),
            treatedBy: doctor?.fullname || doctorEmail,
            treatmentDate: new Date().toISOString(),
            consultationNotes: treatmentInput.trim(),
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setConsultationHistory((prev) =>
          prev.map((c) =>
            c._id === treatmentModalAppt._id
              ? {
                  ...c,
                  status: "completed",
                  treatment: treatmentInput.trim(),
                  prescription: prescriptionInput.trim(),
                  treatmentDate: new Date().toISOString(),
                  consultationNotes: treatmentInput.trim(),
                }
              : c
          )
        );
        showToast("✓ Clinical treatment record saved successfully!");
        setTreatmentModalAppt(null);
        setTreatmentInput("");
        setPrescriptionInput("");
      } else {
        alert(data.message || "Failed to save treatment record.");
      }
    } catch (err) {
      console.error("Error saving treatment:", err);
      alert("Network error while saving treatment.");
    } finally {
      setSubmittingTreatment(false);
    }
  };

  /* ─── Robust Date Formatter ─── */
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

  // Summary KPI Calculations
  const stats = useMemo(() => {
    const totalPatients = new Set(
      consultationHistory.map((c) => c.userEmail?.toLowerCase()).filter(Boolean)
    ).size;

    const totalConsultations = consultationHistory.length;
    const confirmed = consultationHistory.filter((c) =>
      ["confirmed", "approved", "accepted"].includes(c.status?.toLowerCase())
    ).length;
    const completed = consultationHistory.filter(
      (c) => c.status === "completed" || Boolean(c.treatment)
    ).length;

    return { totalPatients, totalConsultations, confirmed, completed };
  }, [consultationHistory]);

  // Filtered & Sorted History
  const filteredHistory = useMemo(() => {
    let list = [...consultationHistory];

    // 1. Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.userName?.toLowerCase().includes(q) ||
          c.userEmail?.toLowerCase().includes(q) ||
          c.symptoms?.toLowerCase().includes(q) ||
          c.treatment?.toLowerCase().includes(q)
      );
    }

    // 2. Status filter
    if (filterStatus !== "all") {
      list = list.filter((c) => c.status?.toLowerCase() === filterStatus);
    }

    // 3. Date range filter
    if (dateRange === "last30") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      list = list.filter((c) => new Date(c.date || c.createdAt) >= thirtyDaysAgo);
    } else if (dateRange === "thisYear") {
      const currentYear = new Date().getFullYear();
      list = list.filter(
        (c) => new Date(c.date || c.createdAt).getFullYear() === currentYear
      );
    }

    // 4. Sorting
    list.sort((a, b) => {
      if (sortBy === "newest") {
        return (
          new Date(b.date || b.createdAt).getTime() -
          new Date(a.date || a.createdAt).getTime()
        );
      }
      if (sortBy === "oldest") {
        return (
          new Date(a.date || a.createdAt).getTime() -
          new Date(b.date || b.createdAt).getTime()
        );
      }
      if (sortBy === "patient") {
        return (a.userName || "").localeCompare(b.userName || "");
      }
      return 0;
    });

    return list;
  }, [consultationHistory, searchTerm, filterStatus, dateRange, sortBy]);

  // Paginated records
  const totalPages = Math.ceil(filteredHistory.length / pageSize) || 1;
  const paginatedHistory = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredHistory.slice(start, start + pageSize);
  }, [filteredHistory, currentPage, pageSize]);

  // Grouped consultations for a specific patient when opening profile modal
  const selectedPatientConsultations = useMemo(() => {
    if (!patientDetailModal?.userEmail) return [];
    return consultationHistory.filter(
      (c) =>
        c.userEmail?.toLowerCase() ===
        patientDetailModal.userEmail?.toLowerCase()
    );
  }, [consultationHistory, patientDetailModal]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setDateRange("all");
    setSortBy("newest");
    setCurrentPage(1);
  };

  return (
    <div className="dh-container">
      {/* Toast Notification */}
      {successToast && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            background: "#16a34a",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            zIndex: 1200,
            fontWeight: "700",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <FiCheckCircle size={16} /> {successToast}
        </div>
      )}

      {/* Header */}
      <div className="dh-header">
        <div className="dh-header-left">
          <h1>Patients & History</h1>
          <p>Review patient consultations, treatment records, and clinical history.</p>
        </div>

        <button
          type="button"
          className="dd-btn-action"
          onClick={fetchConsultationHistory}
          disabled={loading}
        >
          <FiRefreshCw size={13} className={loading ? "hr-spin" : ""} /> Refresh
        </button>
      </div>

      {error && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            padding: "14px 18px",
            borderRadius: "12px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: "#b91c1c",
            fontSize: "13.5px",
          }}
        >
          <FiAlertCircle size={16} /> {error}
        </div>
      )}

      {/* ─── 1. Summary Section ─── */}
      <div className="dh-summary-grid">
        <div className="dh-summary-card">
          <div className="dh-icon-box dh-icon-box--patients">
            <FiUsers />
          </div>
          <div>
            <div className="dh-summary-value">
              {loading ? "..." : stats.totalPatients}
            </div>
            <div className="dh-summary-label">Total Patients</div>
          </div>
        </div>

        <div className="dh-summary-card">
          <div className="dh-icon-box dh-icon-box--consultations">
            <FiCalendar />
          </div>
          <div>
            <div className="dh-summary-value">
              {loading ? "..." : stats.totalConsultations}
            </div>
            <div className="dh-summary-label">Total Consultations</div>
          </div>
        </div>

        <div className="dh-summary-card">
          <div className="dh-icon-box dh-icon-box--confirmed">
            <FiCheckCircle />
          </div>
          <div>
            <div className="dh-summary-value">
              {loading ? "..." : stats.confirmed}
            </div>
            <div className="dh-summary-label">Confirmed</div>
          </div>
        </div>

        <div className="dh-summary-card">
          <div className="dh-icon-box dh-icon-box--pending">
            <FiFileText />
          </div>
          <div>
            <div className="dh-summary-value">
              {loading ? "..." : stats.completed}
            </div>
            <div className="dh-summary-label">Treated & Completed</div>
          </div>
        </div>
      </div>

      {/* ─── 2. Search & Filter Bar ─── */}
      <div className="dh-filter-card">
        <div className="dh-search-wrap">
          <FiSearch className="dh-search-icon" />
          <input
            type="text"
            placeholder="Search patient name, email, or symptoms..."
            className="dh-search-input"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="dh-filter-group">
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="dh-select"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Date Range Filter */}
          <select
            value={dateRange}
            onChange={(e) => {
              setDateRange(e.target.value);
              setCurrentPage(1);
            }}
            className="dh-select"
          >
            <option value="all">All Time</option>
            <option value="last30">Last 30 Days</option>
            <option value="thisYear">This Year</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="dh-select"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="patient">Patient Name</option>
          </select>

          {(searchTerm || filterStatus !== "all" || dateRange !== "all") && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="dd-btn-action"
              title="Clear active filters"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ─── 3. Patient History Consultation List ─── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div className="hr-spinner" style={{ width: "32px", height: "32px" }} />
          <p style={{ fontSize: "13.5px", color: "#64748b", marginTop: "12px" }}>
            Loading patient records and consultation history...
          </p>
        </div>
      ) : paginatedHistory.length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            padding: "60px 20px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>📋</div>
          <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", margin: "0 0 6px" }}>
            Your patient history is empty
          </h3>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
            Completed and confirmed patient consultations will appear here.
          </p>
        </div>
      ) : (
        <div className="dh-history-list">
          {paginatedHistory.map((item) => (
            <div key={item._id} className="dh-card">
              <div className="dh-card-grid">
                {/* Left: Patient Identity + Appointment */}
                <div className="dh-identity-col">
                  <div>
                    <div className="dh-patient-meta">
                      <div className="dh-avatar">
                        {item.userName?.charAt(0) || "P"}
                      </div>
                      <div>
                        <h3 className="dh-patient-name">{item.userName || "Patient"}</h3>
                        <p className="dh-patient-email">{item.userEmail}</p>
                      </div>
                    </div>

                    <div className="dh-appt-info-block">
                      <div className="dh-appt-date-row">
                        <FiCalendar size={13} color="#16a34a" />
                        <span>{formatDate(item.date || item.createdAt)}</span>
                      </div>
                      <div className="dh-appt-time-row">
                        <FiClock size={12} />
                        <span>{item.time || "Time not specified"}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: "14px" }}>
                    <span className={`dd-badge dd-badge--${item.status || "pending"}`}>
                      {item.status || "pending"}
                    </span>
                  </div>
                </div>

                {/* Right: Symptoms & Treatment */}
                <div className="dh-clinical-col">
                  <div>
                    {/* Symptoms Box */}
                    <div className="dh-section-title">Reported Symptoms</div>
                    <div className="dh-symptoms-box">
                      {item.symptoms || "General Health Consultation"}
                    </div>

                    {/* Treatment Box */}
                    <div className="dh-section-title">Clinical Treatment Plan</div>
                    {item.treatment || item.consultationNotes ? (
                      <div className="dh-treatment-box">
                        <p style={{ margin: 0, fontWeight: "600" }}>
                          {item.treatment || item.consultationNotes}
                        </p>
                        {item.treatmentDate && (
                          <span
                            style={{
                              display: "block",
                              fontSize: "11.5px",
                              color: "#15803d",
                              marginTop: "6px",
                            }}
                          >
                            Recorded on {formatDate(item.treatmentDate)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="dh-treatment-empty">
                        <p>No treatment details recorded yet.</p>
                        <button
                          type="button"
                          className="dd-btn-action dd-btn-action--approve"
                          onClick={() => {
                            setTreatmentModalAppt(item);
                            setTreatmentInput(item.treatment || item.consultationNotes || "");
                            setPrescriptionInput(item.prescription || "");
                          }}
                        >
                          <FiPlus size={13} /> Add Treatment
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="dh-card-actions">
                    <button
                      type="button"
                      className="dd-btn-action"
                      onClick={() => setPatientDetailModal(item)}
                      title="View complete patient record"
                    >
                      <FiEye size={13} /> View Patient File
                    </button>

                    <button
                      type="button"
                      className="dd-btn-action dd-btn-action--approve"
                      onClick={() => {
                        setTreatmentModalAppt(item);
                        setTreatmentInput(item.treatment || item.consultationNotes || "");
                        setPrescriptionInput(item.prescription || "");
                      }}
                      title="Update treatment"
                    >
                      <FiFileText size={13} />{" "}
                      {item.treatment ? "Edit Treatment" : "Add Treatment Details"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── 4. Pagination ─── */}
      {!loading && filteredHistory.length > 0 && (
        <div className="ap-pagination-bar" style={{ marginTop: "24px" }}>
          <div>
            Showing <strong>{paginatedHistory.length}</strong> of{" "}
            <strong>{filteredHistory.length}</strong> patient consultations
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
      )}

      {/* ─── 5. Add / Edit Treatment Details Modal ─── */}
      {treatmentModalAppt && (
        <div
          className="ap-modal-backdrop"
          onClick={() => setTreatmentModalAppt(null)}
        >
          <div
            className="ap-modal-card"
            style={{ maxWidth: "560px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setTreatmentModalAppt(null)}
              style={{
                position: "absolute",
                top: "18px",
                right: "18px",
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

            <h3 className="ap-modal-title">Clinical Treatment Record</h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px" }}>
              Patient: <strong>{treatmentModalAppt.userName}</strong> (
              {treatmentModalAppt.userEmail})
            </p>

            <form
              onSubmit={handleSaveTreatment}
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "700",
                    color: "#0f172a",
                    marginBottom: "6px",
                  }}
                >
                  Diagnosis & Treatment Provided
                </label>
                <textarea
                  rows={4}
                  placeholder="Enter detailed clinical notes, recommended medications, and advice provided..."
                  value={treatmentInput}
                  onChange={(e) => setTreatmentInput(e.target.value)}
                  className="ap-table-search"
                  style={{ width: "100%", resize: "vertical" }}
                  required
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "700",
                    color: "#0f172a",
                    marginBottom: "6px",
                  }}
                >
                  Prescription Instructions (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Tab Azithromycin 500mg once daily after food..."
                  value={prescriptionInput}
                  onChange={(e) => setPrescriptionInput(e.target.value)}
                  className="ap-table-search"
                  style={{ width: "100%", resize: "vertical" }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "10px",
                }}
              >
                <button
                  type="button"
                  className="dd-btn-action"
                  onClick={() => setTreatmentModalAppt(null)}
                  disabled={submittingTreatment}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="dd-btn-action dd-btn-action--approve"
                  disabled={submittingTreatment}
                >
                  {submittingTreatment ? "Saving..." : "Save Treatment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── 6. Patient Profile File Modal (Timeline & History) ─── */}
      {patientDetailModal && (
        <div
          className="ap-modal-backdrop"
          onClick={() => setPatientDetailModal(null)}
        >
          <div
            className="ap-modal-card"
            style={{ maxWidth: "680px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPatientDetailModal(null)}
              style={{
                position: "absolute",
                top: "18px",
                right: "18px",
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

            {/* Patient File Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                marginBottom: "20px",
                borderBottom: "1px solid #f1f5f9",
                paddingBottom: "16px",
              }}
            >
              <div
                className="dh-avatar"
                style={{ width: "52px", height: "52px", fontSize: "18px" }}
              >
                {patientDetailModal.userName?.charAt(0) || "P"}
              </div>
              <div>
                <h3
                  style={{
                    fontFamily: "Manrope, sans-serif",
                    fontSize: "18px",
                    fontWeight: "800",
                    color: "#0f172a",
                    margin: 0,
                  }}
                >
                  {patientDetailModal.userName}
                </h3>
                <span style={{ fontSize: "13px", color: "#64748b" }}>
                  {patientDetailModal.userEmail}
                </span>
                <div style={{ marginTop: "4px" }}>
                  <span className="dd-badge dd-badge--confirmed">
                    {selectedPatientConsultations.length} Consultations on Record
                  </span>
                </div>
              </div>
            </div>

            {/* Consultation Timeline */}
            <h4
              style={{
                fontSize: "14px",
                fontWeight: "800",
                color: "#0f172a",
                margin: "0 0 14px",
              }}
            >
              Consultation Timeline & Medical History
            </h4>

            <div className="dh-modal-body-scroll">
              {selectedPatientConsultations.map((c, idx) => (
                <div key={c._id || idx} className="dh-timeline-item">
                  <div className="dh-timeline-dot" />
                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      padding: "14px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "8px",
                      }}
                    >
                      <strong style={{ fontSize: "13.5px", color: "#0f172a" }}>
                        {formatDate(c.date || c.createdAt)} at {c.time || "N/A"}
                      </strong>
                      <span className={`dd-badge dd-badge--${c.status || "pending"}`}>
                        {c.status}
                      </span>
                    </div>

                    <div style={{ fontSize: "12.5px", color: "#334155", marginBottom: "6px" }}>
                      <strong>Symptoms:</strong> {c.symptoms || "General Care"}
                    </div>

                    {c.treatment && (
                      <div
                        style={{
                          background: "#f0fdf4",
                          border: "1px solid #dcfce7",
                          borderRadius: "8px",
                          padding: "8px 10px",
                          fontSize: "12.5px",
                          color: "#166534",
                          marginTop: "6px",
                        }}
                      >
                        <strong>Treatment:</strong> {c.treatment}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: "20px",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                className="dd-btn-action"
                onClick={() => setPatientDetailModal(null)}
              >
                Close File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}