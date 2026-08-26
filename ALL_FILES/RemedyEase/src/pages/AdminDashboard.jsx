import React, { useEffect, useState } from "react";
import { useNavigate, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import {
  FiGrid,
  FiUsers,
  FiUserCheck,
  FiClock,
  FiCalendar,
  FiFileText,
  FiLock,
  FiLogOut,
  FiMenu,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiShield,
} from "react-icons/fi";
import "../Css_for_all/AdminDashboard.css";

import AdminOverview from "../components/AdminOverview";
import UsersManagement from "../components/UsersManagement";
import DoctorsManagement from "../components/DoctorsManagement";
import PendingDoctors from "../components/PendingDoctors";
import AdminAppointments from "../components/AdminAppointments";
import AdminPrescriptions from "../components/AdminPrescriptions";
import ChangeAdminPassword from "../components/ChangeAdminPassword";

const AUTHORIZED_ADMIN_EMAIL = "ramitgoyal1987@gmail.com";

const NAV_ITEMS = [
  { to: "/admin/dashboard", label: "Dashboard", icon: FiGrid, exact: true },
  { to: "/admin/dashboard/users", label: "Patients & Users", icon: FiUsers },
  { to: "/admin/dashboard/doctors", label: "Doctors", icon: FiUserCheck },
  { to: "/admin/dashboard/pending-doctors", label: "Pending Approvals", icon: FiClock },
  { to: "/admin/dashboard/appointments", label: "Appointments", icon: FiCalendar },
  { to: "/admin/dashboard/prescriptions", label: "Prescriptions", icon: FiFileText },
  { to: "/admin/dashboard/change-password", label: "Security & Access", icon: FiLock },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const adminEmail = localStorage.getItem("adminEmail") || "";

  // Verify Admin Authentication
  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    const email = localStorage.getItem("adminEmail");

    if (!adminToken) {
      navigate("/admin/login");
      return;
    }

    if (!email || email.toLowerCase() !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminEmail");
      localStorage.removeItem("adminRole");
      navigate("/admin/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminEmail");
    localStorage.removeItem("adminRole");
    navigate("/admin/login");
  };

  const isActive = (item) => {
    if (item.exact) {
      return (
        location.pathname === "/admin/dashboard" ||
        location.pathname === "/admin/dashboard/"
      );
    }
    return location.pathname.startsWith(item.to);
  };

  const getBreadcrumbTitle = () => {
    const current = NAV_ITEMS.find((item) => isActive(item));
    return current ? current.label : "Admin Workspace";
  };

  return (
    <div className="ap-layout">
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="ap-modal-backdrop"
          style={{ zIndex: 95 }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ─── Sidebar ─── */}
      <aside
        className={`ap-sidebar ${sidebarCollapsed ? "ap-sidebar--collapsed" : ""} ${
          mobileOpen ? "ap-sidebar--mobile-open" : ""
        }`}
      >
        <div className="ap-sidebar-header">
          <Link to="/admin/dashboard" className="ap-brand" onClick={() => setMobileOpen(false)}>
            <div className="ap-brand-icon">☘</div>
            {!sidebarCollapsed && (
              <>
                <span>RemedyEase</span>
                <span className="ap-brand-badge">Admin</span>
              </>
            )}
          </Link>

          <button
            type="button"
            className="ap-sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <FiChevronRight size={18} /> : <FiChevronLeft size={18} />}
          </button>
        </div>

        {/* Nav list */}
        <nav className="ap-nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`ap-nav-link ${active ? "ap-nav-link--active" : ""}`}
                onClick={() => setMobileOpen(false)}
                title={sidebarCollapsed ? item.label : ""}
              >
                <Icon className="ap-nav-icon" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer Logout */}
        <div className="ap-sidebar-footer">
          <button type="button" className="ap-logout-btn" onClick={handleLogout}>
            <FiLogOut size={16} />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main className="ap-main">
        {/* Topbar */}
        <header className="ap-topbar">
          <div className="ap-topbar-left">
            <button
              type="button"
              className="ap-mobile-menu-btn"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>
            <div className="ap-breadcrumb">{getBreadcrumbTitle()}</div>
          </div>

          <div className="ap-topbar-right">
            <div className="ap-admin-profile-pill">
              <div className="ap-admin-avatar">RG</div>
              <div className="ap-admin-info">
                <span className="ap-admin-name">Admin Console</span>
                <span className="ap-admin-role">{adminEmail || "Super Admin"}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Router Viewport */}
        <div className="ap-content-container">
          <Routes>
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<UsersManagement />} />
            <Route path="doctors" element={<DoctorsManagement />} />
            <Route path="pending-doctors" element={<PendingDoctors />} />
            <Route path="appointments" element={<AdminAppointments />} />
            <Route path="prescriptions" element={<AdminPrescriptions />} />
            <Route path="change-password" element={<ChangeAdminPassword />} />
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
