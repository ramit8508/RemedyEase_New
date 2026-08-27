import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiUsers,
  FiMessageSquare,
  FiCheck,
  FiX,
  FiEye,
  FiArrowRight,
  FiRefreshCw,
  FiPlus,
  FiAlertCircle,
  FiChevronLeft,
  FiChevronRight,
  FiActivity,
  FiFileText,
} from "react-icons/fi";
import VideoCall from "../../components/VideoCall";
import "../../Css_for_all/DoctorDashboard.css";

export default function DoctorHome() {
  const navigate = useNavigate();

  let doctor = null;
  try {
    doctor = JSON.parse(localStorage.getItem("doctor"));
  } catch {}

  const doctorEmail = doctor?.email;

  // Data states
  const [appointments, setAppointments] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [successToast, setSuccessToast] = useState("");

  // Appointments filter tab
  const [apptFilter, setApptFilter] = useState("all");

  // Compact Calendar states
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  // Active Modals state
  const [selectedAppointmentForVideo, setSelectedAppointmentForVideo] = useState(null);
  const [selectedPatientModal, setSelectedPatientModal] = useState(null);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 3500);
  };

  // Fetch all doctor appointments and conversations
  const fetchDashboardData = useCallback(async () => {
    if (!doctorEmail) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");

    try {
      // 1. Fetch appointments
      const apptPromise = fetch(`/api/v1/appointments/doctor/${doctorEmail}`)
        .then((r) => r.json())
        .catch(() => ({ success: false, data: [] }));

      // 2. Fetch conversations
      const convPromise = fetch(`/api/v1/live/chat/doctor-conversations/${doctorEmail}`)
        .then((r) => r.json())
        .catch(() => ({ success: false, data: [] }));

      const [apptRes, convRes] = await Promise.all([apptPromise, convPromise]);

      if (apptRes.success && Array.isArray(apptRes.data)) {
        setAppointments(apptRes.data);
      } else {
        setAppointments([]);
      }

      if (convRes.success && Array.isArray(convRes.data)) {
        setConversations(convRes.data);
      } else {
        setConversations([]);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("Unable to load clinical records. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [doctorEmail]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Today's date string YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Filter today's appointments
  const todayAppointments = useMemo(() => {
    return appointments.filter((a) => {
      if (!a.date) return false;
      const d = a.date.includes("T") ? a.date.split("T")[0] : a.date;
      return d === todayStr;
    });
  }, [appointments, todayStr]);

  // Filter today's appointments by status tab
  const filteredTodayAppointments = useMemo(() => {
    if (apptFilter === "all") return todayAppointments;
    return todayAppointments.filter((a) => a.status?.toLowerCase() === apptFilter);
  }, [todayAppointments, apptFilter]);

  // Upcoming appointments (excluding today, next 5)
  const upcomingAppointments = useMemo(() => {
    const upcoming = appointments.filter((a) => {
      if (!a.date) return false;
      const d = a.date.includes("T") ? a.date.split("T")[0] : a.date;
      return d > todayStr && a.status !== "cancelled";
    });
    return upcoming.slice(0, 5);
  }, [appointments, todayStr]);

  // Unique recent patients list
  const recentPatients = useMemo(() => {
    const map = new Map();
    for (const a of appointments) {
      const email = a.userEmail?.toLowerCase();
      if (email && !map.has(email)) {
        map.set(email, {
          name: a.userName || a.userEmail?.split("@")[0] || "Patient",
          email: a.userEmail,
          lastDate: a.date,
          symptoms: a.symptoms || "General Consultation",
          status: a.status,
          appointment: a,
        });
      }
    }
    return Array.from(map.values()).slice(0, 5);
  }, [appointments]);

  // Summary statistics calculations
  const stats = useMemo(() => {
    const pendingCount = appointments.filter((a) => a.status === "pending").length;
    const confirmedCount = appointments.filter((a) =>
      ["confirmed", "approved", "accepted"].includes(a.status?.toLowerCase())
    ).length;

    const unreadMessagesCount = conversations.reduce(
      (acc, c) => acc + (c.unreadCount || 0),
      0
    );

    const totalPatientsCount = new Set(
      appointments.map((a) => a.userEmail).filter(Boolean)
    ).size;

    return {
      todayCount: todayAppointments.length,
      pendingCount,
      confirmedCount,
      unreadMessagesCount,
      totalPatientsCount,
    };
  }, [appointments, todayAppointments, conversations]);

  const token =
    localStorage.getItem("doctorAccessToken") ||
    localStorage.getItem("doctorToken") ||
    localStorage.getItem("token") ||
    "";

  // Appointment Accept action
  const handleAcceptAppointment = async (apptId) => {
    setActionLoading(true);
    try {
      const headers = {
        "Content-Type": "application/json",
        "X-Doctor-Email": doctorEmail || "",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/appointments/confirm/${apptId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ doctorEmail }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const updatedAppt = data.data || { _id: apptId, status: "confirmed" };
        setAppointments((prev) =>
          prev.map((a) => (a._id === apptId ? { ...a, ...updatedAppt, status: "confirmed" } : a))
        );
        showToast("✓ Appointment confirmed successfully!");
      } else {
        const errMsg =
          res.status === 404
            ? "Appointment could not be found."
            : res.status === 403
            ? "You are not authorized to manage this appointment."
            : res.status === 409
            ? (data.message || "This appointment has already been processed.")
            : (data.message || "Failed to confirm appointment");
        alert(errMsg);
      }
    } catch (err) {
      console.error("Accept error:", err);
      alert("Unable to connect to server. Please check your connection.");
    } finally {
      setActionLoading(false);
    }
  };

  // Appointment Reject action
  const handleRejectAppointment = async (apptId) => {
    const reason = prompt("Enter rejection reason (optional):");
    if (reason === null) return; // User cancelled prompt

    setActionLoading(true);
    try {
      const headers = {
        "Content-Type": "application/json",
        "X-Doctor-Email": doctorEmail || "",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/appointments/cancel/${apptId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          doctorEmail,
          reason: reason || "Doctor unavailable",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAppointments((prev) =>
          prev.map((a) =>
            a._id === apptId
              ? { ...a, status: "cancelled", consultationNotes: reason }
              : a
          )
        );
        showToast("Appointment rejected and timeslot released.");
      } else {
        const errMsg =
          res.status === 404
            ? "Appointment could not be found."
            : res.status === 403
            ? "You are not authorized to manage this appointment."
            : res.status === 409
            ? (data.message || "This appointment has already been processed.")
            : (data.message || "Failed to reject appointment");
        alert(errMsg);
      }
    } catch (err) {
      console.error("Reject error:", err);
      alert("Unable to connect to server. Please check your connection.");
    } finally {
      setActionLoading(false);
    }
  };

  /* ─── Compact Calendar Helpers ─── */
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

  const selectedDateAppointments = useMemo(() => {
    if (!selectedCalendarDate) return [];
    return appointments.filter((a) => {
      const ad = a.date?.includes("T") ? a.date.split("T")[0] : a.date;
      return ad === selectedCalendarDate;
    });
  }, [appointments, selectedCalendarDate]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "Date unavailable";
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div>
      {/* Toast Notification */}
      {successToast && (
        <div style={{ position: "fixed", top: "24px", right: "24px", background: "#16a34a", color: "#ffffff", padding: "12px 20px", borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 1200, fontWeight: "700", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <FiCheckCircle size={16} /> {successToast}
        </div>
      )}


      {/* Page Header */}
      <div className="dd-page-header">
        <div>
          <h1 className="dd-page-title">{getGreeting()}, Dr. {doctor?.fullname || "Doctor"} 👋</h1>
          <p className="dd-page-subtitle">
            Here's an overview of today's patient consultations, appointments, and live messages.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <Link
            to="/doctor/dashboard/availability"
            className="dd-btn-action dd-btn-action--approve"
          >
            <FiPlus size={14} /> Set Timeslots
          </Link>
          <button
            type="button"
            className="dd-btn-action"
            onClick={fetchDashboardData}
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

      {/* ─── 1. Summary KPI Cards ─── */}
      <div className="dd-kpi-grid">
        <div className="dd-kpi-card">
          <div className="dd-kpi-icon-wrap dd-kpi-icon--today">
            <FiCalendar />
          </div>
          <div className="dd-kpi-data">
            <div className="dd-kpi-value">{loading ? "..." : stats.todayCount}</div>
            <div className="dd-kpi-label">Today's Appointments</div>
          </div>
        </div>

        <div className="dd-kpi-card">
          <div className="dd-kpi-icon-wrap dd-kpi-icon--pending">
            <FiClock />
          </div>
          <div className="dd-kpi-data">
            <div className="dd-kpi-value">{loading ? "..." : stats.pendingCount}</div>
            <div className="dd-kpi-label">Pending Requests</div>
          </div>
        </div>

        <div className="dd-kpi-card">
          <div className="dd-kpi-icon-wrap dd-kpi-icon--confirmed">
            <FiCheckCircle />
          </div>
          <div className="dd-kpi-data">
            <div className="dd-kpi-value">{loading ? "..." : stats.confirmedCount}</div>
            <div className="dd-kpi-label">Confirmed Sessions</div>
          </div>
        </div>

        <div className="dd-kpi-card">
          <div className="dd-kpi-icon-wrap dd-kpi-icon--messages">
            <FiMessageSquare />
          </div>
          <div className="dd-kpi-data">
            <div className="dd-kpi-value">{loading ? "..." : stats.unreadMessagesCount}</div>
            <div className="dd-kpi-label">Unread Messages</div>
          </div>
        </div>

        <div className="dd-kpi-card">
          <div className="dd-kpi-icon-wrap dd-kpi-icon--patients">
            <FiUsers />
          </div>
          <div className="dd-kpi-data">
            <div className="dd-kpi-value">{loading ? "..." : stats.totalPatientsCount}</div>
            <div className="dd-kpi-label">Total Patients</div>
          </div>
        </div>
      </div>

      {/* ─── 2. Main Two-Column Section: Today's Appointments + Compact Calendar ─── */}
      <div className="dd-dashboard-grid">
        {/* Left: Today's Appointments */}
        <div className="dd-panel-card">
          <div className="dd-panel-header">
            <h3>Today's Scheduled Consultations</h3>
            <div className="ap-filter-tabs">
              <button
                type="button"
                className={`ap-tab-btn ${apptFilter === "all" ? "ap-tab-btn--active" : ""}`}
                onClick={() => setApptFilter("all")}
              >
                All ({todayAppointments.length})
              </button>
              <button
                type="button"
                className={`ap-tab-btn ${apptFilter === "pending" ? "ap-tab-btn--active" : ""}`}
                onClick={() => setApptFilter("pending")}
              >
                Pending
              </button>
              <button
                type="button"
                className={`ap-tab-btn ${apptFilter === "confirmed" ? "ap-tab-btn--active" : ""}`}
                onClick={() => setApptFilter("confirmed")}
              >
                Confirmed
              </button>
            </div>
          </div>

          {loading ? (
            <p style={{ color: "#64748b", fontSize: "13px" }}>Loading consultations...</p>
          ) : filteredTodayAppointments.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: "36px", marginBottom: "10px" }}>☕</div>
              <strong style={{ fontSize: "14px", color: "#0f172a", display: "block", marginBottom: "4px" }}>
                No appointments scheduled for today
              </strong>
              <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 14px" }}>
                You have no upcoming consultations matching this filter today.
              </p>
              <Link to="/doctor/dashboard/appointments" className="dd-btn-action">
                View Full Appointment Schedule
              </Link>
            </div>
          ) : (
            <div className="dd-appt-list">
              {filteredTodayAppointments.map((appt) => (
                <div key={appt._id} className="dd-appt-item">
                  <div className="dd-appt-patient-info">
                    <div className="dd-patient-avatar">
                      {appt.userName?.charAt(0) || "P"}
                    </div>
                    <div>
                      <h4 className="dd-patient-name">{appt.userName || "Patient"}</h4>
                      <div className="dd-appt-meta">
                        <span><FiClock size={11} /> {appt.time || "Time not set"}</span>
                        <span>•</span>
                        <span style={{ color: "#16a34a" }}>{appt.symptoms || "General Care"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="dd-appt-actions">
                    <span className={`dd-badge dd-badge--${appt.status || "pending"}`}>
                      {appt.status || "pending"}
                    </span>

                    {appt.status === "pending" && (
                      <>
                        <button
                          type="button"
                          className="dd-btn-action dd-btn-action--approve"
                          onClick={() => handleAcceptAppointment(appt._id)}
                          disabled={actionLoading}
                          title="Accept appointment"
                        >
                          <FiCheck size={13} /> Accept
                        </button>
                        <button
                          type="button"
                          className="dd-btn-action dd-btn-action--reject"
                          onClick={() => handleRejectAppointment(appt._id)}
                          disabled={actionLoading}
                          title="Reject appointment"
                        >
                          <FiX size={13} /> Reject
                        </button>
                      </>
                    )}

                    {["confirmed", "approved", "accepted"].includes(appt.status?.toLowerCase()) && (
                      <>
                        <button
                          type="button"
                          className="dd-btn-action dd-btn-action--approve"
                          onClick={() => setSelectedAppointmentForVideo(appt)}
                          title="Start video consultation"
                        >
                          <FiVideo size={13} /> Video
                        </button>
                        <button
                          type="button"
                          className="dd-btn-action"
                          onClick={() =>
                            navigate(`/doctor/dashboard/chat?appointmentId=${appt._id}`, {
                              state: { activeAppointmentId: appt._id, patientName: appt.userName },
                            })
                          }
                          title="Open messages & chat with patient"
                        >
                          <FiMessageSquare size={13} /> Chat
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      className="dd-btn-action"
                      onClick={() => setSelectedPatientModal(appt)}
                      title="View details"
                    >
                      <FiEye size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Compact Calendar & Daily Schedule Preview */}
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
                  title="Go to current month"
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

            {/* Weekday headers */}
            <div className="dd-cal-grid">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <div key={day} className="dd-cal-weekday">
                  {day}
                </div>
              ))}

              {/* Days */}
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

          {/* Schedule on selected date */}
          <div style={{ marginTop: "20px", borderTop: "1px solid #e2e8f0", paddingTop: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <strong style={{ fontSize: "13px", color: "#0f172a" }}>
                Schedule for {formatDate(selectedCalendarDate)}
              </strong>
              <span className="dd-badge dd-badge--confirmed">
                {selectedDateAppointments.length} Sessions
              </span>
            </div>

            {selectedDateAppointments.length === 0 ? (
              <p style={{ color: "#94a3b8", fontSize: "12.5px", margin: 0 }}>
                No appointments on this date.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {selectedDateAppointments.map((a) => (
                  <div
                    key={a._id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 10px",
                      background: "#f8fafc",
                      borderRadius: "10px",
                      fontSize: "12.5px",
                    }}
                  >
                    <div>
                      <strong style={{ color: "#0f172a" }}>{a.userName}</strong>
                      <span style={{ color: "#64748b", display: "block", fontSize: "11.5px" }}>
                        {a.time} • {a.symptoms || "Consultation"}
                      </span>
                    </div>
                    <span className={`dd-badge dd-badge--${a.status || "pending"}`}>
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── 3. Secondary Section: Upcoming Appointments & Recent Patients ─── */}
      <div className="dd-dashboard-grid">
        {/* Left: Upcoming Appointments */}
        <div className="dd-panel-card">
          <div className="dd-panel-header">
            <h3>Upcoming Consultations</h3>
            <Link to="/doctor/dashboard/appointments" className="ap-panel-link">
              View All <FiArrowRight size={13} />
            </Link>
          </div>

          {upcomingAppointments.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: "13px" }}>No upcoming appointments scheduled.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {upcomingAppointments.map((appt) => (
                <div
                  key={appt._id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    background: "#f8fafc",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div>
                    <strong style={{ fontSize: "13.5px", color: "#0f172a", display: "block" }}>
                      {appt.userName || "Patient"}
                    </strong>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      {formatDate(appt.date)} at {appt.time} • {appt.symptoms || "General Care"}
                    </span>
                  </div>
                  <span className={`dd-badge dd-badge--${appt.status || "confirmed"}`}>
                    {appt.status || "confirmed"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Recent Patients */}
        <div className="dd-panel-card">
          <div className="dd-panel-header">
            <h3>Recent Patients</h3>
            <Link to="/doctor/dashboard/history" className="ap-panel-link">
              Patient Records <FiArrowRight size={13} />
            </Link>
          </div>

          {recentPatients.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: "13px" }}>No recent patient records.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {recentPatients.map((p, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 12px",
                    background: "#f8fafc",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div className="dd-patient-avatar" style={{ width: "34px", height: "34px", fontSize: "12px" }}>
                      {p.name?.charAt(0)}
                    </div>
                    <div>
                      <strong style={{ fontSize: "13px", color: "#0f172a", display: "block" }}>
                        {p.name}
                      </strong>
                      <span style={{ fontSize: "11.5px", color: "#64748b" }}>
                        Last Visit: {formatDate(p.lastDate)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="dd-btn-action"
                    onClick={() => setSelectedPatientModal(p.appointment)}
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Patient Appointment Modal ─── */}
      {selectedPatientModal && (
        <div className="ap-modal-backdrop" onClick={() => setSelectedPatientModal(null)}>
          <div className="ap-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setSelectedPatientModal(null)}
              style={{ position: "absolute", top: "18px", right: "18px", background: "#f1f5f9", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <FiX size={16} />
            </button>

            <h3 className="ap-modal-title">Consultation Details</h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px" }}>
              Patient: {selectedPatientModal.userName} ({selectedPatientModal.userEmail})
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13.5px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: "#64748b" }}>Date & Time:</span>
                <strong>{formatDate(selectedPatientModal.date)} at {selectedPatientModal.time}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: "#64748b" }}>Status:</span>
                <span className={`dd-badge dd-badge--${selectedPatientModal.status || "pending"}`}>
                  {selectedPatientModal.status}
                </span>
              </div>
              {selectedPatientModal.symptoms && (
                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "4px" }}>
                    Reported Symptoms:
                  </span>
                  <p style={{ margin: 0, color: "#334155" }}>{selectedPatientModal.symptoms}</p>
                </div>
              )}
            </div>

            <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="dd-btn-action dd-btn-action--approve"
                onClick={() => {
                  const apt = selectedPatientModal;
                  setSelectedPatientModal(null);
                  navigate(`/doctor/dashboard/chat?appointmentId=${apt._id}`, {
                    state: { activeAppointmentId: apt._id, patientName: apt.userName },
                  });
                }}
              >
                <FiMessageSquare size={13} /> Open Messages & Chat
              </button>
              <button
                type="button"
                className="dd-btn-action"
                onClick={() => setSelectedPatientModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Video Consultation Modal ─── */}
      {selectedAppointmentForVideo && (
        <VideoCall
          appointmentId={selectedAppointmentForVideo._id}
          currentUser={doctor}
          userType="doctor"
          onClose={() => setSelectedAppointmentForVideo(null)}
        />
      )}
    </div>
  );
}