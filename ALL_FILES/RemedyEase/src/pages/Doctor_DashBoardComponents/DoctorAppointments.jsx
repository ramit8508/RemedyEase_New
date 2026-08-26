import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  FiCalendar,
  FiClock,
  FiSearch,
  FiFilter,
  FiCheck,
  FiX,
  FiEye,
  FiMessageSquare,
  FiVideo,
  FiFileText,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertCircle,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiUpload,
  FiUser,
  FiActivity,
  FiList,
  FiGrid,
} from "react-icons/fi";
import LiveChat from "../../components/LiveChat";
import VideoCall from "../../components/VideoCall";
import "../../Css_for_all/DoctorDashboard.css";

const apiBase = import.meta.env.VITE_DOCTOR_BACKEND_URL || "";

export default function DoctorAppointments() {
  let doctor = null;
  try {
    doctor = JSON.parse(localStorage.getItem("doctor"));
  } catch {}

  const doctorEmail = doctor?.email;

  // Data states
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [successToast, setSuccessToast] = useState("");

  // Filters & View states
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'calendar'
  const [searchQuery, setSearchQuery] = useState("");
  const [statusTab, setStatusTab] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Calendar View state
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  // Modal states
  const [selectedAppointmentDetail, setSelectedAppointmentDetail] = useState(null);
  const [selectedForChat, setSelectedForChat] = useState(null);
  const [selectedForVideo, setSelectedForVideo] = useState(null);
  const [prescriptionModalAppt, setPrescriptionModalAppt] = useState(null);
  const [rejectionModalAppt, setRejectionModalAppt] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Treatment / Prescription form
  const [treatmentNotes, setTreatmentNotes] = useState("");
  const [prescriptionText, setPrescriptionText] = useState("");
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [prescriptionUploading, setPrescriptionUploading] = useState(false);

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 3500);
  };

  // Fetch appointments for this doctor
  const fetchAppointments = useCallback(async () => {
    if (!doctorEmail) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/v1/appointments/doctor/${doctorEmail}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        setAppointments(data.data);
      } else {
        setAppointments([]);
      }
    } catch (err) {
      console.error("Fetch doctor appointments error:", err);
      setError("Unable to load appointments. Please check your network.");
    } finally {
      setLoading(false);
    }
  }, [doctorEmail]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Today string YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

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

  // Accept Appointment
  const handleAccept = async (apptId) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/appointments/confirm/${apptId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok) {
        setAppointments((prev) =>
          prev.map((a) => (a._id === apptId ? { ...a, status: "confirmed" } : a))
        );
        if (selectedAppointmentDetail?._id === apptId) {
          setSelectedAppointmentDetail((prev) => ({ ...prev, status: "confirmed" }));
        }
        showToast("✓ Appointment confirmed successfully!");
      } else {
        alert(data.message || "Failed to confirm appointment");
      }
    } catch (err) {
      console.error("Accept error:", err);
      alert("Network error while confirming appointment.");
    } finally {
      setActionLoading(false);
    }
  };

  // Reject Appointment
  const handleReject = async () => {
    if (!rejectionModalAppt) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/appointments/cancel/${rejectionModalAppt._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectionReason || "Doctor unavailable" }),
      });
      const data = await res.json();
      if (res.ok) {
        setAppointments((prev) =>
          prev.map((a) =>
            a._id === rejectionModalAppt._id
              ? { ...a, status: "cancelled", consultationNotes: rejectionReason }
              : a
          )
        );
        if (selectedAppointmentDetail?._id === rejectionModalAppt._id) {
          setSelectedAppointmentDetail((prev) => ({ ...prev, status: "cancelled" }));
        }
        setRejectionModalAppt(null);
        setRejectionReason("");
        showToast("Appointment rejected and timeslot released.");
      } else {
        alert(data.message || "Failed to reject appointment");
      }
    } catch (err) {
      console.error("Reject error:", err);
      alert("Network error while rejecting appointment.");
    } finally {
      setActionLoading(false);
    }
  };

  // Save Treatment & Prescription
  const handleSaveTreatment = async (e) => {
    e.preventDefault();
    if (!prescriptionModalAppt) return;

    setPrescriptionUploading(true);

    try {
      // 1. If file attached, upload prescription file
      if (prescriptionFile) {
        const formData = new FormData();
        formData.append("prescription", prescriptionFile);
        formData.append("doctorEmail", doctorEmail);
        formData.append("prescriptionNotes", prescriptionText || treatmentNotes);

        await fetch(`/api/v1/appointments/prescription/${prescriptionModalAppt._id}`, {
          method: "POST",
          body: formData,
        });
      }

      // 2. Save treatment details and mark as completed
      const treatmentRes = await fetch(
        `/api/v1/appointments/treatment/${prescriptionModalAppt._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            treatment: treatmentNotes,
            prescription: prescriptionText,
            treatedBy: doctor?.fullname || doctorEmail,
            treatmentDate: new Date().toISOString(),
            consultationNotes: treatmentNotes,
          }),
        }
      );

      const treatmentData = await treatmentRes.json();
      if (treatmentRes.ok) {
        setAppointments((prev) =>
          prev.map((a) =>
            a._id === prescriptionModalAppt._id
              ? {
                  ...a,
                  status: "completed",
                  treatment: treatmentNotes,
                  prescription: prescriptionText,
                  prescriptionFile: prescriptionFile
                    ? URL.createObjectURL(prescriptionFile)
                    : a.prescriptionFile,
                }
              : a
          )
        );
        showToast("✓ Clinical prescription and treatment saved!");
        setPrescriptionModalAppt(null);
        setTreatmentNotes("");
        setPrescriptionText("");
        setPrescriptionFile(null);
      } else {
        alert(treatmentData.message || "Failed to save treatment details.");
      }
    } catch (err) {
      console.error("Prescription save error:", err);
      alert("Network error while saving treatment.");
    } finally {
      setPrescriptionUploading(false);
    }
  };

  // Statistics calculation
  const stats = useMemo(() => {
    const todayCount = appointments.filter((a) => {
      const d = a.date?.includes("T") ? a.date.split("T")[0] : a.date;
      return d === todayStr;
    }).length;

    const pending = appointments.filter((a) => a.status === "pending").length;
    const confirmed = appointments.filter((a) =>
      ["confirmed", "approved", "accepted"].includes(a.status?.toLowerCase())
    ).length;
    const completed = appointments.filter((a) => a.status === "completed").length;
    const cancelled = appointments.filter((a) => a.status === "cancelled").length;

    return { todayCount, pending, confirmed, completed, cancelled };
  }, [appointments, todayStr]);

  // Filtered & Sorted appointments
  const filteredAppointments = useMemo(() => {
    let list = [...appointments];

    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.userName?.toLowerCase().includes(q) ||
          a.userEmail?.toLowerCase().includes(q) ||
          a._id?.toLowerCase().includes(q) ||
          a.symptoms?.toLowerCase().includes(q)
      );
    }

    // 2. Status Tab Filter
    if (statusTab === "today") {
      list = list.filter((a) => {
        const d = a.date?.includes("T") ? a.date.split("T")[0] : a.date;
        return d === todayStr;
      });
    } else if (statusTab === "upcoming") {
      list = list.filter((a) => {
        const d = a.date?.includes("T") ? a.date.split("T")[0] : a.date;
        return d > todayStr && a.status !== "cancelled";
      });
    } else if (statusTab === "pending") {
      list = list.filter((a) => a.status === "pending");
    } else if (statusTab === "confirmed") {
      list = list.filter((a) =>
        ["confirmed", "approved", "accepted"].includes(a.status?.toLowerCase())
      );
    } else if (statusTab === "completed") {
      list = list.filter((a) => a.status === "completed");
    } else if (statusTab === "cancelled") {
      list = list.filter((a) => a.status === "cancelled");
    }

    // 3. Date Picker Filter
    if (dateFilter) {
      list = list.filter((a) => {
        const d = a.date?.includes("T") ? a.date.split("T")[0] : a.date;
        return d === dateFilter;
      });
    }

    // 4. Sorting
    list.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (sortBy === "name") {
        return (a.userName || "").localeCompare(b.userName || "");
      }
      return 0;
    });

    return list;
  }, [appointments, searchQuery, statusTab, dateFilter, sortBy, todayStr]);

  // Paginated slice
  const totalPages = Math.ceil(filteredAppointments.length / pageSize) || 1;
  const paginatedAppointments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAppointments.slice(start, start + pageSize);
  }, [filteredAppointments, currentPage, pageSize]);

  // Clear filters
  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusTab("all");
    setDateFilter("");
    setSortBy("newest");
    setCurrentPage(1);
  };

  /* ─── Compact Calendar Calculation ─── */
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const apptsOnDay = appointments.filter((a) => {
        const ad = a.date?.includes("T") ? a.date.split("T")[0] : a.date;
        return ad === iso;
      });

      days.push({
        date: d,
        iso,
        dayNumber: day,
        hasAppts: apptsOnDay.length > 0,
        apptsCount: apptsOnDay.length,
      });
    }
    return days;
  }, [calendarMonth, appointments]);

  const selectedCalendarDateAppointments = useMemo(() => {
    if (!selectedCalendarDate) return [];
    return appointments.filter((a) => {
      const ad = a.date?.includes("T") ? a.date.split("T")[0] : a.date;
      return ad === selectedCalendarDate;
    });
  }, [appointments, selectedCalendarDate]);

  return (
    <div>
      {/* Toast */}
      {successToast && (
        <div style={{ position: "fixed", top: "24px", right: "24px", background: "#16a34a", color: "#ffffff", padding: "12px 20px", borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 1200, fontWeight: "700", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <FiCheckCircle size={16} /> {successToast}
        </div>
      )}

      {/* Live Chat Modal View */}
      {selectedForChat && (
        <LiveChat
          appointmentId={selectedForChat._id}
          currentUser={doctor}
          userType="doctor"
          onClose={() => setSelectedForChat(null)}
        />
      )}

      {/* Video Call Modal View */}
      {selectedForVideo && (
        <VideoCall
          appointmentId={selectedForVideo._id}
          currentUser={doctor}
          userType="doctor"
          onClose={() => setSelectedForVideo(null)}
        />
      )}

      {/* Page Header */}
      <div className="dd-page-header">
        <div>
          <h1 className="dd-page-title">Appointments Workspace</h1>
          <p className="dd-page-subtitle">
            Review patient consultation requests, conduct live sessions, and issue clinical prescriptions.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {/* View Mode Toggle */}
          <div className="ap-filter-tabs" style={{ background: "#e2e8f0" }}>
            <button
              type="button"
              className={`ap-tab-btn ${viewMode === "list" ? "ap-tab-btn--active" : ""}`}
              onClick={() => setViewMode("list")}
            >
              <FiList size={13} /> Table
            </button>
            <button
              type="button"
              className={`ap-tab-btn ${viewMode === "calendar" ? "ap-tab-btn--active" : ""}`}
              onClick={() => setViewMode("calendar")}
            >
              <FiCalendar size={13} /> Calendar
            </button>
          </div>

          <button
            type="button"
            className="dd-btn-action"
            onClick={fetchAppointments}
            disabled={loading}
          >
            <FiRefreshCw size={13} className={loading ? "hr-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "14px 18px", borderRadius: "12px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", color: "#b91c1c", fontSize: "13.5px" }}>
          <FiAlertCircle size={16} /> {error}
        </div>
      )}

      {/* ─── 1. Statistics Cards ─── */}
      <div className="dd-kpi-grid" style={{ marginBottom: "24px" }}>
        <div className="dd-kpi-card">
          <div className="dd-kpi-icon-wrap dd-kpi-icon--today">
            <FiCalendar />
          </div>
          <div className="dd-kpi-data">
            <div className="dd-kpi-value">{loading ? "..." : stats.todayCount}</div>
            <div className="dd-kpi-label">Today's Schedule</div>
          </div>
        </div>

        <div className="dd-kpi-card">
          <div className="dd-kpi-icon-wrap dd-kpi-icon--pending">
            <FiClock />
          </div>
          <div className="dd-kpi-data">
            <div className="dd-kpi-value">{loading ? "..." : stats.pending}</div>
            <div className="dd-kpi-label">Pending Requests</div>
          </div>
        </div>

        <div className="dd-kpi-card">
          <div className="dd-kpi-icon-wrap dd-kpi-icon--confirmed">
            <FiCheckCircle />
          </div>
          <div className="dd-kpi-data">
            <div className="dd-kpi-value">{loading ? "..." : stats.confirmed}</div>
            <div className="dd-kpi-label">Confirmed</div>
          </div>
        </div>

        <div className="dd-kpi-card">
          <div className="dd-kpi-icon-wrap dd-kpi-icon--messages">
            <FiCheck />
          </div>
          <div className="dd-kpi-data">
            <div className="dd-kpi-value">{loading ? "..." : stats.completed}</div>
            <div className="dd-kpi-label">Completed</div>
          </div>
        </div>

        <div className="dd-kpi-card">
          <div className="dd-kpi-icon-wrap" style={{ background: "#fef2f2", color: "#dc2626" }}>
            <FiX />
          </div>
          <div className="dd-kpi-data">
            <div className="dd-kpi-value">{loading ? "..." : stats.cancelled}</div>
            <div className="dd-kpi-label">Cancelled</div>
          </div>
        </div>
      </div>

      {/* ─── Calendar View (When toggled) ─── */}
      {viewMode === "calendar" ? (
        <div className="dd-dashboard-grid">
          {/* Calendar Widget */}
          <div className="dd-panel-card">
            <div className="dd-compact-calendar">
              <div className="dd-cal-header">
                <span className="dd-cal-month-title">
                  {monthNames[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                </span>
                <div className="dd-cal-nav-buttons">
                  <button
                    type="button"
                    className="dd-cal-btn"
                    onClick={() => {
                      const prev = new Date(calendarMonth);
                      prev.setMonth(prev.getMonth() - 1);
                      setCalendarMonth(prev);
                    }}
                  >
                    <FiChevronLeft size={14} />
                  </button>
                  <button
                    type="button"
                    className="dd-cal-btn"
                    onClick={() => setCalendarMonth(new Date())}
                    title="Current Month"
                  >
                    ●
                  </button>
                  <button
                    type="button"
                    className="dd-cal-btn"
                    onClick={() => {
                      const next = new Date(calendarMonth);
                      next.setMonth(next.getMonth() + 1);
                      setCalendarMonth(next);
                    }}
                  >
                    <FiChevronRight size={14} />
                  </button>
                </div>
              </div>

              <div className="dd-cal-grid">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                  <div key={day} className="dd-cal-weekday">
                    {day}
                  </div>
                ))}

                {calendarDays.map((item, idx) => {
                  if (!item) {
                    return <div key={`empty-${idx}`} className="dd-cal-day dd-cal-day--empty" />;
                  }
                  const isSelected = selectedCalendarDate === item.iso;
                  const isToday = todayStr === item.iso;

                  return (
                    <div
                      key={item.iso}
                      className={`dd-cal-day ${isToday ? "dd-cal-day--today" : ""} ${
                        isSelected ? "dd-cal-day--selected" : ""
                      } ${item.hasAppts ? "dd-cal-day--has-appt" : ""}`}
                      onClick={() => setSelectedCalendarDate(item.iso)}
                    >
                      <span>{item.dayNumber}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Schedule for Selected Date */}
          <div className="dd-panel-card">
            <div className="dd-panel-header">
              <h3>Schedule for {formatDate(selectedCalendarDate)}</h3>
              <span className="dd-badge dd-badge--confirmed">
                {selectedCalendarDateAppointments.length} Consultations
              </span>
            </div>

            {selectedCalendarDateAppointments.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{ fontSize: "36px", marginBottom: "10px" }}>☕</div>
                <p style={{ color: "#64748b", fontSize: "13px" }}>
                  No consultations scheduled for {formatDate(selectedCalendarDate)}.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {selectedCalendarDateAppointments.map((appt) => (
                  <div
                    key={appt._id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 14px",
                      background: "#f8fafc",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: "13.5px", color: "#0f172a", display: "block" }}>
                        {appt.userName}
                      </strong>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>
                        {appt.time} • {appt.symptoms || "Consultation"}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="button"
                        className="dd-btn-action"
                        onClick={() => setSelectedAppointmentDetail(appt)}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        className="dd-btn-action dd-btn-action--approve"
                        onClick={() => setSelectedForChat(appt)}
                      >
                        <FiMessageSquare size={13} /> Chat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ─── List / Table View ─── */
        <div className="ap-table-card">
          {/* Toolbar & Filter Tabs */}
          <div className="ap-toolbar">
            <div className="ap-filter-tabs">
              <button
                type="button"
                className={`ap-tab-btn ${statusTab === "all" ? "ap-tab-btn--active" : ""}`}
                onClick={() => {
                  setStatusTab("all");
                  setCurrentPage(1);
                }}
              >
                All ({appointments.length})
              </button>
              <button
                type="button"
                className={`ap-tab-btn ${statusTab === "today" ? "ap-tab-btn--active" : ""}`}
                onClick={() => {
                  setStatusTab("today");
                  setCurrentPage(1);
                }}
              >
                Today ({stats.todayCount})
              </button>
              <button
                type="button"
                className={`ap-tab-btn ${statusTab === "pending" ? "ap-tab-btn--active" : ""}`}
                onClick={() => {
                  setStatusTab("pending");
                  setCurrentPage(1);
                }}
              >
                Pending ({stats.pending})
              </button>
              <button
                type="button"
                className={`ap-tab-btn ${statusTab === "confirmed" ? "ap-tab-btn--active" : ""}`}
                onClick={() => {
                  setStatusTab("confirmed");
                  setCurrentPage(1);
                }}
              >
                Confirmed ({stats.confirmed})
              </button>
              <button
                type="button"
                className={`ap-tab-btn ${statusTab === "completed" ? "ap-tab-btn--active" : ""}`}
                onClick={() => {
                  setStatusTab("completed");
                  setCurrentPage(1);
                }}
              >
                Completed ({stats.completed})
              </button>
              <button
                type="button"
                className={`ap-tab-btn ${statusTab === "cancelled" ? "ap-tab-btn--active" : ""}`}
                onClick={() => {
                  setStatusTab("cancelled");
                  setCurrentPage(1);
                }}
              >
                Cancelled ({stats.cancelled})
              </button>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
              {/* Date Filter */}
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

              {/* Sort By Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="ap-table-search"
                style={{ width: "auto", padding: "8px 12px" }}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Patient Name</option>
              </select>

              {/* Search Box */}
              <div className="ap-search-input-wrap">
                <FiSearch className="ap-search-icon" />
                <input
                  type="text"
                  placeholder="Search patient, symptoms..."
                  className="ap-table-search"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              {(searchQuery || statusTab !== "all" || dateFilter) && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="dd-btn-action"
                  title="Clear all filters"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="ap-table-responsive">
            <table className="ap-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Schedule Date & Time</th>
                  <th>Reason / Symptoms</th>
                  <th>Status</th>
                  <th>Live Consultation</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "40px" }}>
                      <div className="hr-spinner" style={{ width: "28px", height: "28px" }} />
                      <p style={{ fontSize: "13px", color: "#64748b", marginTop: "10px" }}>Loading consultations...</p>
                    </td>
                  </tr>
                ) : paginatedAppointments.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "50px 20px" }}>
                      <div style={{ fontSize: "36px", marginBottom: "10px" }}>📋</div>
                      <strong style={{ fontSize: "15px", color: "#0f172a", display: "block", marginBottom: "4px" }}>
                        No Appointments Found
                      </strong>
                      <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                        No appointments match your selected status, search, or date criteria.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedAppointments.map((appt) => (
                    <tr key={appt._id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div className="dd-patient-avatar" style={{ width: "36px", height: "36px", fontSize: "13px" }}>
                            {appt.userName?.charAt(0) || "P"}
                          </div>
                          <div>
                            <strong style={{ display: "block" }}>{appt.userName || "Patient"}</strong>
                            <span style={{ fontSize: "11.5px", color: "#64748b" }}>{appt.userEmail}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <strong style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <FiCalendar size={13} color="#16a34a" /> {formatDate(appt.date)}
                          </strong>
                          <span style={{ fontSize: "12px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                            <FiClock size={12} /> {appt.time || "Time not specified"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{ color: "#334155" }}>
                          {appt.symptoms || "General Care"}
                        </span>
                      </td>
                      <td>
                        <span className={`dd-badge dd-badge--${appt.status || "pending"}`}>
                          {appt.status || "pending"}
                        </span>
                      </td>
                      <td>
                        {["confirmed", "approved", "accepted"].includes(appt.status?.toLowerCase()) ? (
                          <div style={{ display: "inline-flex", gap: "6px" }}>
                            <button
                              type="button"
                              className="dd-btn-action dd-btn-action--approve"
                              onClick={() => setSelectedForChat(appt)}
                              title="Open chat consultation"
                            >
                              <FiMessageSquare size={13} /> Chat
                            </button>
                            <button
                              type="button"
                              className="dd-btn-action"
                              onClick={() => setSelectedForVideo(appt)}
                              title="Start video consultation"
                            >
                              <FiVideo size={13} /> Video
                            </button>
                          </div>
                        ) : appt.status === "completed" ? (
                          <button
                            type="button"
                            className="dd-btn-action"
                            onClick={() => setSelectedForChat(appt)}
                            title="View chat history"
                          >
                            <FiMessageSquare size={13} /> Chat Log
                          </button>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: "12px" }}>Awaiting Confirmation</span>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          <button
                            type="button"
                            className="dd-btn-action"
                            onClick={() => setSelectedAppointmentDetail(appt)}
                            title="View appointment details"
                          >
                            <FiEye size={13} /> View
                          </button>

                          {appt.status === "pending" && (
                            <>
                              <button
                                type="button"
                                className="dd-btn-action dd-btn-action--approve"
                                onClick={() => handleAccept(appt._id)}
                                disabled={actionLoading}
                                title="Accept appointment"
                              >
                                <FiCheck size={13} /> Accept
                              </button>
                              <button
                                type="button"
                                className="dd-btn-action dd-btn-action--reject"
                                onClick={() => setRejectionModalAppt(appt)}
                                disabled={actionLoading}
                                title="Reject appointment"
                              >
                                <FiX size={13} /> Reject
                              </button>
                            </>
                          )}

                          {["confirmed", "completed"].includes(appt.status?.toLowerCase()) && (
                            <button
                              type="button"
                              className="dd-btn-action"
                              onClick={() => {
                                setPrescriptionModalAppt(appt);
                                setTreatmentNotes(appt.treatment || appt.consultationNotes || "");
                                setPrescriptionText(appt.prescription || "");
                              }}
                              title="Write / Manage Prescription"
                            >
                              <FiFileText size={13} /> Rx
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
      )}

      {/* ─── Appointment Details Modal ─── */}
      {selectedAppointmentDetail && (
        <div className="ap-modal-backdrop" onClick={() => setSelectedAppointmentDetail(null)}>
          <div className="ap-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setSelectedAppointmentDetail(null)}
              style={{ position: "absolute", top: "18px", right: "18px", background: "#f1f5f9", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <FiX size={16} />
            </button>

            <h3 className="ap-modal-title">Consultation File</h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px" }}>
              ID: {selectedAppointmentDetail._id}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13.5px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: "#64748b" }}>Patient:</span>
                <strong>{selectedAppointmentDetail.userName} ({selectedAppointmentDetail.userEmail})</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: "#64748b" }}>Date & Time:</span>
                <strong>{formatDate(selectedAppointmentDetail.date)} at {selectedAppointmentDetail.time}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: "#64748b" }}>Status:</span>
                <span className={`dd-badge dd-badge--${selectedAppointmentDetail.status || "pending"}`}>
                  {selectedAppointmentDetail.status}
                </span>
              </div>
              {selectedAppointmentDetail.symptoms && (
                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "4px" }}>
                    Patient Reported Symptoms:
                  </span>
                  <p style={{ margin: 0, color: "#334155" }}>{selectedAppointmentDetail.symptoms}</p>
                </div>
              )}
              {selectedAppointmentDetail.treatment && (
                <div style={{ background: "#f0fdf4", padding: "12px", borderRadius: "10px", border: "1px solid #dcfce7" }}>
                  <span style={{ fontSize: "12px", color: "#15803d", display: "block", marginBottom: "4px" }}>
                    Prescribed Treatment / Notes:
                  </span>
                  <p style={{ margin: 0, color: "#166534" }}>{selectedAppointmentDetail.treatment}</p>
                </div>
              )}
              {selectedAppointmentDetail.consultationNotes && (
                <div style={{ background: "#fffbeb", padding: "12px", borderRadius: "10px", border: "1px solid #fde68a" }}>
                  <span style={{ fontSize: "12px", color: "#92400e", display: "block", marginBottom: "4px" }}>
                    Clinical / Cancellation Notes:
                  </span>
                  <p style={{ margin: 0, color: "#78350f" }}>{selectedAppointmentDetail.consultationNotes}</p>
                </div>
              )}
            </div>

            <div style={{ marginTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                {["confirmed", "completed"].includes(selectedAppointmentDetail.status?.toLowerCase()) && (
                  <button
                    type="button"
                    className="dd-btn-action dd-btn-action--approve"
                    onClick={() => {
                      const apt = selectedAppointmentDetail;
                      setSelectedAppointmentDetail(null);
                      setSelectedForChat(apt);
                    }}
                  >
                    <FiMessageSquare size={13} /> Chat
                  </button>
                )}
                {selectedAppointmentDetail.status === "confirmed" && (
                  <button
                    type="button"
                    className="dd-btn-action"
                    onClick={() => {
                      const apt = selectedAppointmentDetail;
                      setSelectedAppointmentDetail(null);
                      setSelectedForVideo(apt);
                    }}
                  >
                    <FiVideo size={13} /> Video
                  </button>
                )}
              </div>

              <button
                type="button"
                className="dd-btn-action"
                onClick={() => setSelectedAppointmentDetail(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Prescription & Treatment Modal ─── */}
      {prescriptionModalAppt && (
        <div className="ap-modal-backdrop" onClick={() => setPrescriptionModalAppt(null)}>
          <div className="ap-modal-card" style={{ maxWidth: "600px" }} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPrescriptionModalAppt(null)}
              style={{ position: "absolute", top: "18px", right: "18px", background: "#f1f5f9", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <FiX size={16} />
            </button>

            <h3 className="ap-modal-title">Clinical Prescription & Treatment</h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 18px" }}>
              Issue treatment guidelines and prescriptions for <strong>{prescriptionModalAppt.userName}</strong>.
            </p>

            <form onSubmit={handleSaveTreatment} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#0f172a", marginBottom: "6px" }}>
                  Clinical Diagnosis & Treatment Plan
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g., Acute viral pharyngitis with mild dehydration. Advised warm saline gargles..."
                  value={treatmentNotes}
                  onChange={(e) => setTreatmentNotes(e.target.value)}
                  className="ap-table-search"
                  style={{ width: "100%", resize: "vertical" }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#0f172a", marginBottom: "6px" }}>
                  Medication Instructions & Dosage
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g., Tab Paracetamol 650mg TDS x 3 days, Tab Cetirizine 10mg OD HS x 5 days..."
                  value={prescriptionText}
                  onChange={(e) => setPrescriptionText(e.target.value)}
                  className="ap-table-search"
                  style={{ width: "100%", resize: "vertical" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#0f172a", marginBottom: "6px" }}>
                  Upload Prescription Scan / PDF (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setPrescriptionFile(e.target.files[0] || null)}
                  className="ap-table-search"
                  style={{ width: "100%" }}
                />
              </div>

              {prescriptionModalAppt.prescriptionFile && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px" }}>
                  <span style={{ color: "#64748b" }}>Existing prescription file:</span>
                  <a
                    href={prescriptionModalAppt.prescriptionFile}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#16a34a", fontWeight: "700" }}
                  >
                    View Current Rx Document
                  </a>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  className="dd-btn-action"
                  onClick={() => setPrescriptionModalAppt(null)}
                  disabled={prescriptionUploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="dd-btn-action dd-btn-action--approve"
                  disabled={prescriptionUploading}
                >
                  <FiUpload size={14} />{" "}
                  {prescriptionUploading ? "Saving & Uploading..." : "Save & Issue Prescription"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Rejection Modal ─── */}
      {rejectionModalAppt && (
        <div className="ap-modal-backdrop" onClick={() => setRejectionModalAppt(null)}>
          <div className="ap-modal-card" style={{ maxWidth: "460px" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="ap-modal-title">Reject Consultation Request</h3>
            <p style={{ fontSize: "13.5px", color: "#64748b", margin: "0 0 16px" }}>
              Are you sure you want to reject the appointment with <strong>{rejectionModalAppt.userName}</strong> on <strong>{formatDate(rejectionModalAppt.date)}</strong>?
            </p>

            <textarea
              className="ap-table-search"
              rows={3}
              placeholder="Provide reason for rejection (e.g., Doctor on emergency hospital round)..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", resize: "vertical" }}
            />

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "18px" }}>
              <button
                type="button"
                className="dd-btn-action"
                onClick={() => setRejectionModalAppt(null)}
                disabled={actionLoading}
              >
                Go Back
              </button>
              <button
                type="button"
                className="dd-btn-action dd-btn-action--reject"
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
