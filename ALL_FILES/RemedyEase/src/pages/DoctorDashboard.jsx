import React, { useState, useEffect, useCallback } from "react";
import { Routes, Route, Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import {
  FiGrid,
  FiCalendar,
  FiUsers,
  FiMessageSquare,
  FiClock,
  FiCpu,
  FiUser,
  FiLogOut,
  FiMenu,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiBell,
  FiCheckCircle,
} from "react-icons/fi";
import "../Css_for_all/DoctorDashboard.css";

import DoctorHome from "./Doctor_DashBoardComponents/DoctorHome";
import DoctorAppointments from "./Doctor_DashBoardComponents/DoctorAppointments";
import DoctorHistory from "./Doctor_DashBoardComponents/DoctorHistory";
import DoctorChat from "./Doctor_DashBoardComponents/DoctorChat";
import DoctorAvailability from "./Doctor_DashBoardComponents/DoctorAvailability";
import DoctorAi from "./Doctor_DashBoardComponents/DoctorAi";
import DoctorProfile from "./Doctor_DashBoardComponents/DoctorProfile";

// Grouped Navigation Structure
const NAV_GROUPS = [
  {
    groupTitle: "MAIN",
    items: [
      { to: "/doctor/dashboard", label: "Dashboard", icon: FiGrid, exact: true },
      { to: "/doctor/dashboard/appointments", label: "Appointments", icon: FiCalendar },
      { to: "/doctor/dashboard/history", label: "Patients & History", icon: FiUsers },
      { to: "/doctor/dashboard/chat", label: "Messages & Chat", icon: FiMessageSquare },
    ],
  },
  {
    groupTitle: "CLINICAL",
    items: [
      { to: "/doctor/dashboard/ai", label: "AI Health Assistant", icon: FiCpu },
      { to: "/doctor/dashboard/availability", label: "Availability", icon: FiClock },
    ],
  },
  {
    groupTitle: "ACCOUNT",
    items: [
      { to: "/doctor/dashboard/profile", label: "Doctor Profile", icon: FiUser },
    ],
  },
];

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  let doctor = null;
  try {
    doctor = JSON.parse(localStorage.getItem("doctor"));
  } catch {}

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

  // Authentication check
  useEffect(() => {
    if (!doctor) {
      navigate("/doctor/login");
    }
  }, [doctor, navigate]);

  // Fetch live notifications for doctor
  const fetchNotifications = useCallback(async () => {
    if (!doctor?.email) return;
    try {
      const res = await fetch(`/api/v1/live/notifications/${doctor.email}`);
      const data = await res.json();
      if (data.success && data.data) {
        setNotifications(data.data.notifications || []);
        setUnreadNotifsCount(data.data.count || 0);
      }
    } catch (err) {
      // Ignore background notification error
    }
  }, [doctor?.email]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleLogout = () => {
    localStorage.removeItem("doctor");
    localStorage.removeItem("token");
    localStorage.removeItem("doctorToken");
    navigate("/doctor/login");
  };

  const isActive = (item) => {
    if (item.exact) {
      return (
        location.pathname === "/doctor/dashboard" ||
        location.pathname === "/doctor/dashboard/" ||
        location.pathname === "/doctor/dashboard/home"
      );
    }
    return location.pathname.startsWith(item.to);
  };

  const getBreadcrumbTitle = () => {
    for (const group of NAV_GROUPS) {
      for (const item of group.items) {
        if (isActive(item)) return item.label;
      }
    }
    return "Doctor Portal";
  };

  const todayFormatted = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="dd-layout">
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="ap-modal-backdrop"
          style={{ zIndex: 95 }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ─── Doctor Fixed Sidebar (264px) ─── */}
      <aside
        className={`dd-sidebar ${sidebarCollapsed ? "dd-sidebar--collapsed" : ""} ${
          mobileOpen ? "dd-sidebar--mobile-open" : ""
        }`}
      >
        {/* Top Brand Area */}
        <div className="dd-sidebar-header">
          <Link
            to="/doctor/dashboard"
            className="dd-brand-wrapper"
            onClick={() => setMobileOpen(false)}
          >
            <div className="dd-brand-icon">☘</div>
            {!sidebarCollapsed && (
              <div className="dd-brand-text-block">
                <span className="dd-brand-name">RemedyEase</span>
                <span className="dd-brand-portal-label">Doctor Portal</span>
              </div>
            )}
          </Link>

          <button
            type="button"
            className="dd-sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label="Toggle sidebar width"
          >
            {sidebarCollapsed ? <FiChevronRight size={18} /> : <FiChevronLeft size={18} />}
          </button>
        </div>

        {/* Compact Doctor Profile Box */}
        {!sidebarCollapsed && doctor && (
          <div className="dd-sidebar-profile">
            <div className="dd-profile-avatar-wrap">
              {doctor.avatar ? (
                <img
                  src={doctor.avatar}
                  alt={doctor.fullname}
                  className="dd-profile-avatar"
                />
              ) : (
                <div className="dd-profile-avatar">
                  {doctor.fullname?.charAt(0) || "D"}
                </div>
              )}
              <span className="dd-profile-status-dot" />
            </div>

            <div className="dd-profile-info">
              <span className="dd-profile-name">
                Dr. {doctor.fullname || "Doctor"}
              </span>
              <span className="dd-profile-role">
                {doctor.specialization || "General Physician"}
              </span>
            </div>
          </div>
        )}

        {/* Grouped Navigation */}
        <nav className="dd-nav">
          {NAV_GROUPS.map((group) => (
            <div key={group.groupTitle}>
              {!sidebarCollapsed && (
                <div className="dd-nav-group-title">{group.groupTitle}</div>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`dd-nav-link ${active ? "dd-nav-link--active" : ""}`}
                    onClick={() => setMobileOpen(false)}
                    title={sidebarCollapsed ? item.label : ""}
                  >
                    <div className="dd-nav-icon-container">
                      <Icon />
                    </div>
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Pinned Bottom Sidebar Section */}
        <div className="dd-sidebar-bottom">
          {/* Availability status card */}
          {!sidebarCollapsed && (
            <div
              className="dd-availability-card"
              onClick={() => setIsAvailable(!isAvailable)}
              title="Click to toggle availability status"
            >
              <div className="dd-availability-info">
                <span
                  className={`dd-avail-dot ${
                    isAvailable ? "dd-avail-dot--online" : "dd-avail-dot--busy"
                  }`}
                />
                <span className="dd-avail-text">
                  {isAvailable ? "Available for consultations" : "Currently busy"}
                </span>
              </div>
              <span
                className={`dd-avail-pill-btn ${
                  isAvailable ? "dd-avail-pill-btn--online" : "dd-avail-pill-btn--busy"
                }`}
              >
                {isAvailable ? "Online" : "Busy"}
              </span>
            </div>
          )}

          {/* Sign out button */}
          <button
            type="button"
            className="dd-logout-btn"
            onClick={handleLogout}
            title="Sign out of doctor portal"
          >
            <FiLogOut size={16} />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ─── Main Content Area ─── */}
      <main className="dd-main">
        {/* Top Header (Height 68px) */}
        <header className="dd-topbar">
          <div className="dd-topbar-left">
            <button
              type="button"
              className="dd-mobile-menu-btn"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle mobile menu"
            >
              {mobileOpen ? <FiX /> : <FiMenu />}
            </button>
            <h2 className="dd-page-title-header" style={{ margin: 0 }}>
              {getBreadcrumbTitle()}
            </h2>
          </div>

          <div className="dd-topbar-right">
            {/* Today's date pill */}
            <div className="dd-date-pill">
              <FiCalendar size={13} color="#16a34a" />
              <span>{todayFormatted}</span>
            </div>

            {/* Availability status toggle pill */}
            <button
              type="button"
              className={`dd-status-indicator-btn ${
                isAvailable
                  ? "dd-status-indicator-btn--online"
                  : "dd-status-indicator-btn--busy"
              }`}
              onClick={() => setIsAvailable(!isAvailable)}
              title="Toggle availability"
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: isAvailable ? "#16a34a" : "#f59e0b",
                }}
              />
              {isAvailable ? "Available" : "Busy"}
            </button>

            {/* Notification Bell */}
            <div style={{ position: "relative" }}>
              <button
                type="button"
                className="dd-notif-btn"
                onClick={() => setShowNotifs(!showNotifs)}
                title="Notifications"
                aria-label="Doctor notifications"
              >
                <FiBell size={16} />
                {unreadNotifsCount > 0 && (
                  <span className="dd-notif-badge">{unreadNotifsCount}</span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifs && (
                <div className="dd-notif-dropdown">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <strong style={{ fontSize: "14px", color: "#0f172a" }}>
                      Clinical Alerts
                    </strong>
                    <button
                      type="button"
                      onClick={() => setShowNotifs(false)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#64748b",
                        cursor: "pointer",
                      }}
                    >
                      <FiX size={14} />
                    </button>
                  </div>

                  {notifications.length === 0 ? (
                    <p style={{ fontSize: "12.5px", color: "#64748b", margin: "10px 0" }}>
                      No new patient notifications.
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          style={{
                            padding: "8px 10px",
                            background: "#f8fafc",
                            borderRadius: "10px",
                            border: "1px solid #e2e8f0",
                            fontSize: "12px",
                          }}
                        >
                          <strong style={{ color: "#0f172a", display: "block" }}>
                            {n.patientName}
                          </strong>
                          <span style={{ color: "#64748b" }}>
                            Started {n.sessionType} session
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Doctor Profile Pill */}
            {doctor && (
              <Link
                to="/doctor/dashboard/profile"
                className="dd-topbar-profile-pill"
                title="Doctor Profile"
              >
                {doctor.avatar ? (
                  <img
                    src={doctor.avatar}
                    alt={doctor.fullname}
                    className="dd-topbar-avatar"
                  />
                ) : (
                  <div className="dd-topbar-avatar">
                    {doctor.fullname?.charAt(0) || "D"}
                  </div>
                )}
                <span className="dd-topbar-doc-name">
                  Dr. {doctor.fullname?.split(" ")[0] || "Doctor"}
                </span>
              </Link>
            )}
          </div>
        </header>

        {/* Viewport content */}
        <div className="dd-content-container">
          <Routes>
            <Route index element={<DoctorHome />} />
            <Route path="home" element={<DoctorHome />} />
            <Route path="appointments" element={<DoctorAppointments />} />
            <Route path="history" element={<DoctorHistory />} />
            <Route path="chat" element={<DoctorChat />} />
            <Route path="availability" element={<DoctorAvailability />} />
            <Route path="ai" element={<DoctorAi />} />
            <Route path="profile" element={<DoctorProfile />} />
            <Route path="*" element={<Navigate to="/doctor/dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}