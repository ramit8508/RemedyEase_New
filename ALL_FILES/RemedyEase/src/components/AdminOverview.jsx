import React, { useEffect, useState } from "react";
import "../Css_for_all/AdminOverview.css";

const AdminOverview = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDoctors: 0,
    pendingDoctors: 0,
    totalAppointments: 0,
    completedAppointments: 0,
    totalPrescriptions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("adminToken");

      // Fetch user stats
      const userStatsRes = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/admin/stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );
      const userStatsData = await userStatsRes.json();

      // Fetch doctor stats
      const doctorStatsRes = await fetch(
        `${import.meta.env.VITE_DOCTOR_BACKEND_URL}/api/v1/admin/doctors/stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const doctorStatsData = await doctorStatsRes.json();

      // Fetch appointment stats
      const appointmentStatsRes = await fetch(
        `${import.meta.env.VITE_DOCTOR_BACKEND_URL}/api/v1/admin/appointments/stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const appointmentStatsData = await appointmentStatsRes.json();

      setStats({
        totalUsers: userStatsData.data?.totalUsers || 0,
        totalDoctors: doctorStatsData.data?.totalDoctors || 0,
        pendingDoctors: doctorStatsData.data?.pendingDoctors || 0,
        totalAppointments: appointmentStatsData.data?.totalAppointments || 0,
        completedAppointments: appointmentStatsData.data?.completedAppointments || 0,
        totalPrescriptions: appointmentStatsData.data?.totalPrescriptions || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="admin-loading">Loading dashboard...</div>;
  }

  return (
    <div className="admin-overview">
      <h1 className="admin-overview-title">Dashboard Overview</h1>
      <p className="admin-overview-subtitle">Monitor your platform statistics</p>

      <div className="stats-grid">
        <div className="stat-card stat-users">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.totalUsers}</h3>
            <p>Total Users</p>
          </div>
        </div>

        <div className="stat-card stat-doctors">
          <div className="stat-icon">👨‍⚕️</div>
          <div className="stat-content">
            <h3>{stats.totalDoctors}</h3>
            <p>Total Doctors</p>
          </div>
        </div>

        <div className="stat-card stat-pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{stats.pendingDoctors}</h3>
            <p>Pending Approvals</p>
          </div>
        </div>

        <div className="stat-card stat-appointments">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>{stats.totalAppointments}</h3>
            <p>Total Appointments</p>
          </div>
        </div>

        <div className="stat-card stat-completed">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.completedAppointments}</h3>
            <p>Completed</p>
          </div>
        </div>

        <div className="stat-card stat-prescriptions">
          <div className="stat-icon">💊</div>
          <div className="stat-content">
            <h3>{stats.totalPrescriptions}</h3>
            <p>Prescriptions</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
