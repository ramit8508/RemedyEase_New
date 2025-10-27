import React, { useEffect, useState } from "react";
import { useNavigate, Routes, Route, Link, Navigate } from "react-router-dom";
import "../Css_for_all/AdminDashboard.css";
import PendingDoctors from "../components/PendingDoctors";
import UsersManagement from "../components/UsersManagement";
import DoctorsManagement from "../components/DoctorsManagement";
import AdminAppointments from "../components/AdminAppointments";
import AdminPrescriptions from "../components/AdminPrescriptions";
import AdminOverview from "../components/AdminOverview";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken) {
      navigate("/admin/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminEmail");
    localStorage.removeItem("adminRole");
    navigate("/");
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <div className="admin-dashboard">
      {/* Overlay for mobile */}
      <div 
        className={`menu-overlay ${isMenuOpen ? "active" : ""}`} 
        onClick={closeMenu}
      ></div>

      <aside className={`admin-sidebar ${isMenuOpen ? "open" : ""}`}>
        <div className="admin-sidebar-header">
          <h2>Admin Panel</h2>
          <button className="menu-close" onClick={toggleMenu}>
            ✕
          </button>
        </div>

        <nav className="admin-nav">
          <Link to="/admin/dashboard" className="admin-nav-link" onClick={closeMenu}>
            <span className="nav-icon">📊</span>
            Dashboard
          </Link>
          <Link to="/admin/dashboard/pending-doctors" className="admin-nav-link" onClick={closeMenu}>
            <span className="nav-icon">👨‍⚕️</span>
            Pending Doctors
          </Link>
          <Link to="/admin/dashboard/users" className="admin-nav-link" onClick={closeMenu}>
            <span className="nav-icon">👥</span>
            Users
          </Link>
          <Link to="/admin/dashboard/doctors" className="admin-nav-link" onClick={closeMenu}>
            <span className="nav-icon">🏥</span>
            Doctors
          </Link>
          <Link to="/admin/dashboard/appointments" className="admin-nav-link" onClick={closeMenu}>
            <span className="nav-icon">📅</span>
            Appointments
          </Link>
          <Link to="/admin/dashboard/prescriptions" className="admin-nav-link" onClick={closeMenu}>
            <span className="nav-icon">💊</span>
            Prescriptions
          </Link>
        </nav>

        <button className="admin-logout-btn" onClick={handleLogout}>
          <span className="nav-icon">🚪</span>
          Logout
        </button>
      </aside>

      <main className="admin-main">
        <button className="menu-toggle" onClick={toggleMenu}>
          ☰
        </button>

        <div className="admin-content">
          <Routes>
            <Route index element={<AdminOverview />} />
            <Route path="pending-doctors" element={<PendingDoctors />} />
            <Route path="users" element={<UsersManagement />} />
            <Route path="doctors" element={<DoctorsManagement />} />
            <Route path="appointments" element={<AdminAppointments />} />
            <Route path="prescriptions" element={<AdminPrescriptions />} />
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
