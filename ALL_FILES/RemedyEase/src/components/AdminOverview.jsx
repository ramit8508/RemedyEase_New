import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FiUsers,
  FiUserCheck,
  FiClock,
  FiCalendar,
  FiFileText,
  FiArrowRight,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";
import "../Css_for_all/AdminDashboard.css";

export default function AdminOverview() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDoctors: 0,
    pendingDoctors: 0,
    totalAppointments: 0,
    totalPrescriptions: 0,
  });

  const [todayAppointments, setTodayAppointments] = useState([]);
  const [pendingDoctorsList, setPendingDoctorsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("adminToken");

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const fetchOverviewData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // 1. Fetch User stats
      const userStatsPromise = fetch("/api/v1/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => (r.ok ? r.json() : { data: {} }))
        .catch(() => ({ data: {} }));

      // 2. Fetch Doctor stats
      const doctorStatsPromise = fetch("/api/v1/admin/doctors/stats", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => (r.ok ? r.json() : { data: {} }))
        .catch(() => ({ data: {} }));

      // 3. Fetch Appointment stats
      const apptStatsPromise = fetch("/api/v1/admin/appointments/stats", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => (r.ok ? r.json() : { data: {} }))
        .catch(() => ({ data: {} }));

      // 4. Fetch Prescription stats
      const rxStatsPromise = fetch("/api/v1/admin/prescriptions/stats", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => (r.ok ? r.json() : { data: {} }))
        .catch(() => ({ data: {} }));

      // 5. Fetch Pending doctors for quick review widget
      const pendingDocsPromise = fetch("/api/v1/admin/doctors/pending", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => (r.ok ? r.json() : { data: [] }))
        .catch(() => ({ data: [] }));

      // 6. Fetch Appointments for today's summary widget
      const apptsPromise = fetch("/api/v1/admin/appointments", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => (r.ok ? r.json() : { data: [] }))
        .catch(() => ({ data: [] }));

      const [userStats, docStats, apptStats, rxStats, pendingDocs, allAppts] =
        await Promise.all([
          userStatsPromise,
          doctorStatsPromise,
          apptStatsPromise,
          rxStatsPromise,
          pendingDocsPromise,
          apptsPromise,
        ]);

      setStats({
        totalUsers: userStats.data?.totalUsers || 0,
        totalDoctors: docStats.data?.total || 0,
        pendingDoctors: docStats.data?.pending || 0,
        totalAppointments: apptStats.data?.total || 0,
        totalPrescriptions: rxStats.data?.total || 0,
      });

      setPendingDoctorsList(Array.isArray(pendingDocs.data) ? pendingDocs.data.slice(0, 4) : []);

      const apptsList = Array.isArray(allAppts.data) ? allAppts.data : [];
      // Take first 5 recent appointments
      setTodayAppointments(apptsList.slice(0, 5));
    } catch (err) {
      console.error("Dashboard overview fetch error:", err);
      setError("Unable to load overview data. Please verify network connection.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchOverviewData();
  }, [fetchOverviewData]);

  // Date formatting helper
  const formatAppointmentDate = (dateStr, timeStr) => {
    if (!dateStr) return "Date unavailable";
    return `${dateStr} ${timeStr ? `at ${timeStr}` : ""}`;
  };

  return (
    <div>
      {/* Page Header */}
      <div className="ap-page-header">
        <div>
          <h1 className="ap-page-title">{getGreeting()}, Admin 👋</h1>
          <p className="ap-page-subtitle">
            Here's an overview of clinical operations, patient consultations, and doctor verifications today.
          </p>
        </div>

        <button
          type="button"
          className="ap-btn-action"
          onClick={() => fetchOverviewData()}
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

      {/* KPI Cards Grid */}
      <div className="ap-kpi-grid">
        <div className="ap-kpi-card">
          <div className="ap-kpi-icon-wrap ap-kpi-icon--users">
            <FiUsers />
          </div>
          <div className="ap-kpi-data">
            <div className="ap-kpi-value">{loading ? "..." : stats.totalUsers}</div>
            <div className="ap-kpi-label">Registered Patients</div>
          </div>
        </div>

        <div className="ap-kpi-card">
          <div className="ap-kpi-icon-wrap ap-kpi-icon--doctors">
            <FiUserCheck />
          </div>
          <div className="ap-kpi-data">
            <div className="ap-kpi-value">{loading ? "..." : stats.totalDoctors}</div>
            <div className="ap-kpi-label">Verified Doctors</div>
          </div>
        </div>

        <div className="ap-kpi-card">
          <div className="ap-kpi-icon-wrap ap-kpi-icon--pending">
            <FiClock />
          </div>
          <div className="ap-kpi-data">
            <div className="ap-kpi-value">{loading ? "..." : stats.pendingDoctors}</div>
            <div className="ap-kpi-label">Pending Approvals</div>
          </div>
        </div>

        <div className="ap-kpi-card">
          <div className="ap-kpi-icon-wrap ap-kpi-icon--appts">
            <FiCalendar />
          </div>
          <div className="ap-kpi-data">
            <div className="ap-kpi-value">{loading ? "..." : stats.totalAppointments}</div>
            <div className="ap-kpi-label">Total Appointments</div>
          </div>
        </div>

        <div className="ap-kpi-card">
          <div className="ap-kpi-icon-wrap ap-kpi-icon--rx">
            <FiFileText />
          </div>
          <div className="ap-kpi-data">
            <div className="ap-kpi-value">{loading ? "..." : stats.totalPrescriptions}</div>
            <div className="ap-kpi-label">Prescriptions</div>
          </div>
        </div>
      </div>

      {/* Two-Column Operational Section */}
      <div className="ap-dashboard-grid">
        {/* Left: Recent Consultations */}
        <div className="ap-panel-card">
          <div className="ap-panel-header">
            <h3>Recent Scheduled Consultations</h3>
            <Link to="/admin/dashboard/appointments" className="ap-panel-link">
              View All <FiArrowRight size={13} />
            </Link>
          </div>

          {loading ? (
            <p style={{ color: "#64748b", fontSize: "13px" }}>Loading recent appointments...</p>
          ) : todayAppointments.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: "13.5px" }}>No recent appointments found.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {todayAppointments.map((apt) => (
                <div
                  key={apt._id}
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
                      {apt.userName || apt.userEmail || "Patient"}
                    </strong>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      with Dr. {apt.doctorName || apt.doctorEmail} • {formatAppointmentDate(apt.date, apt.time)}
                    </span>
                  </div>
                  <span className={`ap-badge ap-badge--${apt.status || "pending"}`}>
                    {apt.status || "pending"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Pending Doctor Approvals */}
        <div className="ap-panel-card">
          <div className="ap-panel-header">
            <h3>Doctors Awaiting Verification</h3>
            <Link to="/admin/dashboard/pending-doctors" className="ap-panel-link">
              Review All ({stats.pendingDoctors}) <FiArrowRight size={13} />
            </Link>
          </div>

          {loading ? (
            <p style={{ color: "#64748b", fontSize: "13px" }}>Loading pending approvals...</p>
          ) : pendingDoctorsList.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "#16a34a" }}>
              <FiCheckCircle size={28} />
              <p style={{ fontSize: "13.5px", marginTop: "8px", fontWeight: "600" }}>
                All doctor applications have been processed!
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {pendingDoctorsList.map((doc) => (
                <div
                  key={doc._id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    background: "#fffbeb",
                    borderRadius: "12px",
                    border: "1px solid #fde68a",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        background: "#dcfce7",
                        color: "#15803d",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "800",
                        fontSize: "13px",
                      }}
                    >
                      {doc.fullname?.charAt(0) || "D"}
                    </div>
                    <div>
                      <strong style={{ fontSize: "13.5px", color: "#0f172a", display: "block" }}>
                        Dr. {doc.fullname}
                      </strong>
                      <span style={{ fontSize: "12px", color: "#b45309" }}>
                        {doc.specialization} • Reg: {doc.registrationNumber || "Pending"}
                      </span>
                    </div>
                  </div>

                  <Link
                    to="/admin/dashboard/pending-doctors"
                    className="ap-btn-action ap-btn-action--approve"
                    style={{ fontSize: "11.5px", padding: "5px 10px" }}
                  >
                    Review
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
