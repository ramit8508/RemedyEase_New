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
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    // Auto-retry after 3 seconds if there was an error and retry count < 3
    if (error && retryCount < 3) {
      const timer = setTimeout(() => {
        console.log(`Retrying... (Attempt ${retryCount + 1}/3)`);
        setError(null);
        setLoading(true);
        setRetryCount(prev => prev + 1);
        fetchStats();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [error, retryCount]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("adminToken");

      // Use relative paths for production (proxied by Vercel)
      const userBackendUrl = import.meta.env.VITE_BACKEND_URL || '';
      const doctorBackendUrl = import.meta.env.VITE_DOCTOR_BACKEND_URL || '';

      // Fetch user stats
      const userStatsRes = await fetch(
        userBackendUrl ? `${userBackendUrl}/api/v1/admin/stats` : '/api/v1/admin/stats',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );
      
      // Check if response is JSON
      const contentType = userStatsRes.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error('User backend returned non-JSON response. Backend may be sleeping.');
        throw new Error('Backend is waking up. Retrying automatically...');
      }
      
      const userStatsData = await userStatsRes.json();

      // Fetch doctor stats
      const doctorStatsRes = await fetch(
        doctorBackendUrl ? `${doctorBackendUrl}/api/v1/admin/doctors/stats` : '/api/v1/admin/doctors/stats',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      const doctorContentType = doctorStatsRes.headers.get("content-type");
      if (!doctorContentType || !doctorContentType.includes("application/json")) {
        console.error('Doctor backend returned non-JSON response. Backend may be sleeping.');
        throw new Error('Doctor backend is waking up. Retrying automatically...');
      }
      
      const doctorStatsData = await doctorStatsRes.json();

      // Fetch appointment stats
      const appointmentStatsRes = await fetch(
        doctorBackendUrl ? `${doctorBackendUrl}/api/v1/admin/appointments/stats` : '/api/v1/admin/appointments/stats',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      const appointmentContentType = appointmentStatsRes.headers.get("content-type");
      if (!appointmentContentType || !appointmentContentType.includes("application/json")) {
        console.error('Appointment backend returned non-JSON response. Backend may be sleeping.');
        throw new Error('Appointment backend is waking up. Retrying automatically...');
      }
      
      const appointmentStatsData = await appointmentStatsRes.json();

      // Fetch prescription stats
      const prescriptionStatsRes = await fetch(
        doctorBackendUrl ? `${doctorBackendUrl}/api/v1/admin/prescriptions/stats` : '/api/v1/admin/prescriptions/stats',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      const prescriptionContentType = prescriptionStatsRes.headers.get("content-type");
      if (!prescriptionContentType || !prescriptionContentType.includes("application/json")) {
        console.error('Prescription backend returned non-JSON response. Backend may be sleeping.');
        throw new Error('Prescription backend is waking up. Retrying automatically...');
      }
      
      const prescriptionStatsData = await prescriptionStatsRes.json();

      setStats({
        totalUsers: userStatsData.data?.totalUsers || 0,
        totalDoctors: doctorStatsData.data?.total || 0,
        pendingDoctors: doctorStatsData.data?.pending || 0,
        totalAppointments: appointmentStatsData.data?.total || 0,
        completedAppointments: appointmentStatsData.data?.completed || 0,
        totalPrescriptions: prescriptionStatsData.data?.total || 0,
      });
      
      setError(null);
      setRetryCount(0);
    } catch (error) {
      console.error("Error fetching stats:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading" style={{ textAlign: 'center', padding: '50px' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
        <h2>Loading dashboard...</h2>
        {retryCount > 0 && <p>Retry attempt {retryCount}/3</p>}
        <p style={{ color: '#666', fontSize: '14px' }}>Backends are waking up, please wait...</p>
      </div>
    );
  }

  if (error && retryCount >= 3) {
    return (
      <div className="admin-error" style={{ textAlign: 'center', padding: '50px' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
        <h2>Unable to load dashboard</h2>
        <p style={{ color: '#d32f2f', marginBottom: '20px' }}>{error}</p>
        <button 
          onClick={() => {
            setRetryCount(0);
            setError(null);
            setLoading(true);
            fetchStats();
          }}
          style={{
            backgroundColor: '#388e3c',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Try Again
        </button>
      </div>
    );
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
