import React, { useState, useEffect, useCallback, useRef } from "react";
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
  FiCheck,
} from "react-icons/fi";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
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
      {
        to: "/doctor/dashboard",
        aliases: ["/doctor/dashboard", "/doctor/dashboard/", "/doctor/dashboard/home"],
        label: "Dashboard",
        icon: FiGrid,
        exact: true,
      },
      {
        to: "/doctor/dashboard/appointments",
        aliases: ["/doctor/dashboard/appointments"],
        label: "Appointments",
        icon: FiCalendar,
      },
      {
        to: "/doctor/dashboard/history",
        aliases: ["/doctor/dashboard/history", "/doctor/dashboard/patients"],
        label: "Patients & History",
        icon: FiUsers,
      },
      {
        to: "/doctor/dashboard/chat",
        aliases: ["/doctor/dashboard/chat", "/doctor/dashboard/messages"],
        label: "Messages & Chat",
        icon: FiMessageSquare,
      },
    ],
  },
  {
    groupTitle: "CLINICAL",
    items: [
      {
        to: "/doctor/dashboard/ai",
        aliases: ["/doctor/dashboard/ai", "/doctor/dashboard/ai-assistant"],
        label: "AI Health Assistant",
        icon: FiCpu,
      },
      {
        to: "/doctor/dashboard/availability",
        aliases: ["/doctor/dashboard/availability"],
        label: "Availability",
        icon: FiClock,
      },
    ],
  },
  {
    groupTitle: "ACCOUNT",
    items: [
      {
        to: "/doctor/dashboard/profile",
        aliases: ["/doctor/dashboard/profile"],
        label: "Doctor Profile",
        icon: FiUser,
      },
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

  const token =
    localStorage.getItem("doctorAccessToken") ||
    localStorage.getItem("doctorToken") ||
    localStorage.getItem("token") ||
    "";

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const [notifError, setNotifError] = useState("");

  const notifDropdownRef = useRef(null);
  const notifBtnRef = useRef(null);

  // Authentication check
  useEffect(() => {
    if (!doctor) {
      navigate("/doctor/login");
    }
  }, [doctor, navigate]);

  // Fetch real persistent notifications for doctor
  const fetchNotifications = useCallback(async () => {
    if (!doctor?.email) return;
    try {
      setNotifError("");
      const headers = {
        "Content-Type": "application/json",
        "X-Doctor-Email": doctor.email,
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(
        `/api/v1/doctors/notifications?doctorEmail=${encodeURIComponent(doctor.email)}`,
        { headers }
      );
      const data = await res.json();

      if (res.ok && data.success && data.data) {
        const fetchedNotifs = data.data.notifications || [];
        setNotifications(fetchedNotifs);
        const unread =
          typeof data.data.unreadCount === "number"
            ? data.data.unreadCount
            : fetchedNotifs.filter((n) => !n.isRead && !n.read).length;
        setUnreadNotifsCount(unread);
      } else {
        // Fallback to live notifications endpoint if needed
        const liveRes = await fetch(`/api/v1/live/notifications/${doctor.email}`);
        const liveData = await liveRes.json();
        if (liveData.success && liveData.data) {
          setNotifications(liveData.data.notifications || []);
          setUnreadNotifsCount(liveData.data.count || 0);
        }
      }
    } catch (err) {
      console.warn("Notification fetch error:", err.message);
      setNotifError("Unable to load notifications.");
    }
  }, [doctor?.email, token]);

  // Polling every 15 seconds for real-time synchronization
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Real-time Socket.io listener for instant notification receipt
  useEffect(() => {
    if (!doctor?.email) return;

    let socket = null;
    try {
      socket = io({
        transports: ["websocket", "polling"],
      });

      socket.on("connect", () => {
        socket.emit("user-online", {
          userId: doctor._id || doctor.email,
          userType: "doctor",
          userName: doctor.fullname || "Doctor",
        });
      });

      const handleIncomingNotification = (payload) => {
        const targetEmail = payload?.recipientDoctorEmail || payload?.doctorEmail;
        const targetId = payload?.recipientDoctorId || payload?.doctorId;

        if (
          !targetEmail ||
          targetEmail.toLowerCase() === doctor.email.toLowerCase() ||
          targetId === doctor._id
        ) {
          fetchNotifications();

          const patientName =
            payload?.patientName ||
            payload?.notification?.patientName ||
            "A patient";
          const msg =
            payload?.notification?.message ||
            `New appointment request from ${patientName}`;

          toast.info(msg, {
            position: "top-right",
            autoClose: 4000,
          });
        }
      };

      socket.on("new-notification", handleIncomingNotification);
      socket.on("new-appointment-request", handleIncomingNotification);
      socket.on("new-appointment-notification", handleIncomingNotification);

      return () => {
        if (socket) {
          socket.off("new-notification", handleIncomingNotification);
          socket.off("new-appointment-request", handleIncomingNotification);
          socket.off("new-appointment-notification", handleIncomingNotification);
          socket.disconnect();
        }
      };
    } catch (socketErr) {
      console.warn("Socket initialization error:", socketErr);
    }
  }, [doctor?.email, doctor?._id, doctor?.fullname, fetchNotifications]);

  // Click outside to close notification dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        notifDropdownRef.current &&
        !notifDropdownRef.current.contains(e.target) &&
        !notifBtnRef.current?.contains(e.target)
      ) {
        setShowNotifs(false);
      }
    };
    if (showNotifs) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifs]);

  // Handle clicking an individual notification
  const handleNotificationClick = async (n) => {
    const notifId = n._id || n.id;

    // Optimistically update UI
    setNotifications((prev) =>
      prev.map((item) =>
        item._id === notifId || item.id === notifId
          ? { ...item, isRead: true, read: true }
          : item
      )
    );

    if (!n.isRead && !n.read) {
      setUnreadNotifsCount((prev) => Math.max(0, prev - 1));
    }

    setShowNotifs(false);

    // Call backend to mark read
    if (notifId) {
      try {
        const headers = {
          "Content-Type": "application/json",
          "X-Doctor-Email": doctor?.email || "",
        };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        await fetch(`/api/v1/doctors/notifications/${notifId}/read`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ doctorEmail: doctor?.email, notificationId: notifId }),
        });
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
      }
    }

    // Navigate to appointment if appointmentId exists
    if (n.appointmentId) {
      navigate(`/doctor/dashboard/appointments?highlight=${n.appointmentId}`, {
        state: { highlightId: n.appointmentId },
      });
    }
  };

  // Handle "Mark all as read"
  const handleMarkAllAsRead = async (e) => {
    if (e) e.stopPropagation();

    // Optimistically mark all read in UI
    setNotifications((prev) =>
      prev.map((item) => ({ ...item, isRead: true, read: true }))
    );
    setUnreadNotifsCount(0);

    try {
      const headers = {
        "Content-Type": "application/json",
        "X-Doctor-Email": doctor?.email || "",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await fetch("/api/v1/doctors/notifications/read-all", {
        method: "PATCH",
        headers,
        body: JSON.stringify({ doctorEmail: doctor?.email }),
      });
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  // Helper for human-readable relative time
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return "Recently";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Recently";

    const now = new Date();
    const diffSec = Math.floor((now - d) / 1000);

    if (diffSec < 45) return "Just now";
    if (diffSec < 3600) {
      const m = Math.floor(diffSec / 60);
      return `${m} minute${m > 1 ? "s" : ""} ago`;
    }
    if (diffSec < 86400) {
      const h = Math.floor(diffSec / 3600);
      return `${h} hour${h > 1 ? "s" : ""} ago`;
    }
    const days = Math.floor(diffSec / 86400);
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;

    return d.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("doctor");
    localStorage.removeItem("token");
    localStorage.removeItem("doctorToken");
    localStorage.removeItem("doctorAccessToken");
    localStorage.removeItem("doctorRefreshToken");
    localStorage.removeItem("doctorEmail");
    navigate("/doctor/login");
  };

  const isActive = (item) => {
    const path = location.pathname.toLowerCase();
    if (item.aliases) {
      return item.aliases.some((alias) =>
        alias === "/doctor/dashboard"
          ? path === "/doctor/dashboard" ||
            path === "/doctor/dashboard/" ||
            path === "/doctor/dashboard/home"
          : path.startsWith(alias)
      );
    }
    return path.startsWith(item.to);
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
          style={{ zIndex: 950 }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ─── 1. FIXED DOCTOR SIDEBAR (100vh Permanently Fixed on Desktop) ─── */}
      <aside
        className={`dd-sidebar ${sidebarCollapsed ? "dd-sidebar--collapsed" : ""} ${
          mobileOpen ? "dd-sidebar--mobile-open" : ""
        }`}
      >
        {/* Brand Header */}
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

        {/* Compact Doctor Profile Card */}
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

        {/* Middle Scrollable Navigation List */}
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

        {/* Pinned Bottom Status & Sign Out */}
        <div className="dd-sidebar-bottom">
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

      {/* ─── 2. INDEPENDENTLY SCROLLING MAIN CONTENT (Margin-Left matches Sidebar) ─── */}
      <main className={`dd-main ${sidebarCollapsed ? "dd-main--collapsed" : ""}`}>
        {/* Top Header (Height 64px, Sticky at top of Main Content) */}
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
                ref={notifBtnRef}
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

              {/* Notification Dropdown Popup */}
              {showNotifs && (
                <div ref={notifDropdownRef} className="dd-notif-dropdown">
                  {/* Popup Header */}
                  <div className="dd-notif-header">
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <strong style={{ fontSize: "14.5px", color: "#0f172a", fontWeight: "700" }}>
                        Clinical Alerts
                      </strong>
                      {unreadNotifsCount > 0 && (
                        <span className="dd-notif-header-badge">
                          {unreadNotifsCount} new
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {unreadNotifsCount > 0 && (
                        <button
                          type="button"
                          className="dd-notif-markall-btn"
                          onClick={handleMarkAllAsRead}
                          title="Mark all notifications as read"
                        >
                          Mark all as read
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowNotifs(false)}
                        className="dd-notif-close-btn"
                        aria-label="Close notification panel"
                      >
                        <FiX size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Notification List Body */}
                  <div className="dd-notif-body">
                    {notifError ? (
                      <p className="dd-notif-empty-text" style={{ color: "#ef4444" }}>
                        {notifError}
                      </p>
                    ) : notifications.length === 0 ? (
                      <div className="dd-notif-empty-state">
                        <div style={{ fontSize: "28px", marginBottom: "6px" }}>🔔</div>
                        <p style={{ margin: 0, fontSize: "13px", color: "#64748b", fontWeight: "500" }}>
                          No new patient notifications.
                        </p>
                      </div>
                    ) : (
                      <div className="dd-notif-list">
                        {notifications.map((n) => {
                          const isUnread = !n.isRead && !n.read;
                          const notifId = n._id || n.id;
                          const patientName =
                            n.patientName || n.userName || "A patient";
                          const title = n.title || "New Appointment Request";
                          const message =
                            n.message ||
                            (n.sessionType
                              ? `${patientName} started ${n.sessionType} session`
                              : `${patientName} requested an appointment for ${n.date || "scheduled date"} at ${n.time || "scheduled time"}.`);

                          return (
                            <div
                              key={notifId}
                              className={`dd-notif-item ${
                                isUnread ? "dd-notif-item--unread" : "dd-notif-item--read"
                              }`}
                              onClick={() => handleNotificationClick(n)}
                              title="Click to view appointment details"
                            >
                              <div className="dd-notif-item-header">
                                <span
                                  className={`dd-notif-dot ${
                                    isUnread ? "dd-notif-dot--active" : "dd-notif-dot--read"
                                  }`}
                                />
                                <strong className="dd-notif-item-title">
                                  {title}
                                </strong>
                              </div>

                              <p className="dd-notif-item-message">{message}</p>

                              <div className="dd-notif-item-footer">
                                <span className="dd-notif-time">
                                  {formatTimeAgo(n.createdAt || n.timestamp)}
                                </span>
                                {isUnread && (
                                  <span className="dd-notif-unread-pill">Unread</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
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

        {/* Viewport Content */}
        <div className="dd-content-container">
          <Routes>
            <Route index element={<DoctorHome />} />
            <Route path="home" element={<DoctorHome />} />
            <Route path="appointments" element={<DoctorAppointments />} />
            <Route path="history" element={<DoctorHistory />} />
            <Route path="patients" element={<DoctorHistory />} />
            <Route path="chat" element={<DoctorChat />} />
            <Route path="messages" element={<DoctorChat />} />
            <Route path="availability" element={<DoctorAvailability />} />
            <Route path="ai" element={<DoctorAi />} />
            <Route path="ai-assistant" element={<DoctorAi />} />
            <Route path="profile" element={<DoctorProfile />} />
            <Route path="*" element={<Navigate to="/doctor/dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}