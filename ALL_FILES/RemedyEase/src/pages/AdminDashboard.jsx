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
  const [backendReady, setBackendReady] = useState(false);

  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken) {
      navigate("/admin/login");
    } else {
      // Wake up backends when dashboard loads
      wakeUpBackends();
    }
  }, [navigate]);

  // Wake up both backends on dashboard load
  const wakeUpBackends = async () => {
    try {
      const userBackendUrl = import.meta.env.VITE_BACKEND_URL || '';
      const doctorBackendUrl = import.meta.env.VITE_DOCTOR_BACKEND_URL || '';
      
      console.log('Waking up backends...');
      
      // Ping both backends simultaneously
      const promises = [];
      if (userBackendUrl) {
        promises.push(fetch(`${userBackendUrl}/`).catch(e => console.log('User backend waking...')));
      } else {
        promises.push(fetch('/').catch(e => console.log('User backend waking...')));
      }
      
      if (doctorBackendUrl) {
        promises.push(fetch(`${doctorBackendUrl}/`).catch(e => console.log('Doctor backend waking...')));
      }
      
      await Promise.all(promises);
      console.log('Backends pinged successfully');
      
      // Wait 2 seconds for backends to fully wake up
      setTimeout(() => {
        setBackendReady(true);
      }, 2000);
    } catch (error) {
      console.error('Error waking backends:', error);
      setBackendReady(true); // Proceed anyway
    }
  };

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
