import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Css_for_all/AdminLogin.css";

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [wakingUp, setWakingUp] = useState(false);
  const [backendStatus, setBackendStatus] = useState("unknown");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  // Wake up the backend server
  const wakeUpBackend = async () => {
    setWakingUp(true);
    setError("");
    setBackendStatus("waking");
    
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      const healthUrl = backendUrl ? `${backendUrl}/` : '/';
      
      console.log('Waking up backend at:', healthUrl);
      
      const response = await fetch(healthUrl, {
        method: 'GET',
      });
      
      if (response.ok) {
        setBackendStatus("online");
        setError("");
      } else {
        setBackendStatus("offline");
        setError("Backend responded but may not be fully ready. Please try logging in.");
      }
    } catch (err) {
      console.error('Backend wake-up error:', err);
      setBackendStatus("offline");
      setError("Backend is starting up. Please wait 30 seconds and try again.");
    } finally {
      setWakingUp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Use relative path for production (proxied by Vercel)
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      const apiUrl = backendUrl ? `${backendUrl}/api/v1/admin/login` : '/api/v1/admin/login';
      
      console.log('Attempting admin login to:', apiUrl);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      console.log('Response status:', response.status);

      // Handle non-JSON responses (like HTML error pages)
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error('Received non-JSON response. Response might be HTML error page.');
        
        // Special handling for 405 Method Not Allowed
        if (response.status === 405) {
          setError("Backend server is waking up. Please click 'Wake Up Backend' button and wait 30 seconds, then try again.");
          setLoading(false);
          return;
        }
        
        setError(`Server error (${response.status}). The backend may be starting up. Please wait a moment and try again.`);
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        // Store admin token in localStorage
        localStorage.setItem("adminToken", data.data.accessToken);
        localStorage.setItem("adminEmail", data.data.admin.email);
        localStorage.setItem("adminRole", "admin");
        
        // Navigate to admin dashboard
        navigate("/admin/dashboard");
      } else {
        setError(data.message || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      console.error("Admin login error:", err);
      
      // Better error messages
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        setError("Cannot connect to server. Please click 'Wake Up Backend' button and wait 30-60 seconds.");
      } else if (err instanceof SyntaxError) {
        setError("Server is starting up. Please click 'Wake Up Backend' button and wait 30 seconds.");
      } else {
        setError(`Error: ${err.message}. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-box">
        <h1 className="admin-login-title">Admin Login</h1>
        <p className="admin-login-subtitle">Access the admin dashboard</p>

        <div style={{ 
          backgroundColor: '#e7f3ff', 
          color: '#004085', 
          padding: '10px', 
          borderRadius: '5px', 
          marginBottom: '15px',
          fontSize: '13px',
          border: '1px solid #b8daff'
        }}>
          ℹ️ <strong>Note:</strong> If you haven't used the app recently, click "Wake Up Backend" first and wait 30-60 seconds before logging in.
        </div>

        {error && <div className="admin-error-message">{error}</div>}

        {backendStatus === "waking" && (
          <div className="admin-info-message" style={{ backgroundColor: '#fff3cd', color: '#856404', border: '1px solid #ffc107' }}>
            ⏳ Waking up backend server... This may take 30-60 seconds.
          </div>
        )}

        {backendStatus === "online" && (
          <div className="admin-success-message" style={{ backgroundColor: '#d4edda', color: '#155724', border: '1px solid #28a745' }}>
            ✅ Backend is online! You can now login.
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="admin-form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter admin email"
              disabled={loading}
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter password"
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="admin-login-button"
            disabled={loading || wakingUp}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <button 
          onClick={wakeUpBackend}
          className="admin-wake-button"
          disabled={loading || wakingUp}
          style={{
            marginTop: '10px',
            backgroundColor: '#ffc107',
            color: '#000',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '5px',
            cursor: wakingUp ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            opacity: wakingUp ? 0.6 : 1,
            transition: 'all 0.3s ease'
          }}
        >
          {wakingUp ? "⏳ Waking up backend..." : "🚀 Wake Up Backend"}
        </button>

        <button 
          onClick={() => navigate("/")} 
          className="admin-back-button"
          disabled={loading}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default AdminLogin;
