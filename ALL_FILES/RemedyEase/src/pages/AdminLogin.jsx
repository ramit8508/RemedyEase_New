import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../Css_for_all/AdminLogin.css";
import { FiShield, FiArrowLeft, FiInfo, FiCheckCircle, FiAlertCircle, FiLoader } from "react-icons/fi";

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
        // Double check - verify the authorized admin email
        const AUTHORIZED_ADMIN_EMAIL = "ramitgoyal1987@gmail.com";
        if (data.data.admin.email.toLowerCase() !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
          setError("Unauthorized access. Only authorized personnel can access admin panel.");
          console.warn("⚠️ Unauthorized admin login attempt blocked!");
          return;
        }
        
        // Store admin token in localStorage
        localStorage.setItem("adminToken", data.data.accessToken);
        localStorage.setItem("adminEmail", data.data.admin.email);
        localStorage.setItem("adminRole", "admin");
        
        console.log("✅ Admin login successful - redirecting to dashboard");
        
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
    <div className="al">
      {/* Header */}
      <header className="al-header">
        <div className="al-header-inner">
          <Link to="/" className="al-brand">
            <span className="al-brand-name">RemedyEase</span>
          </Link>
          <button
            onClick={() => navigate("/")}
            className="al-back-link"
            disabled={loading}
          >
            <FiArrowLeft size={15} />
            <span>Back to Home</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="al-main">
        <div className="al-card">
          {/* Card Header */}
          <div className="al-card-header">
            <div className="al-icon-wrap">
              <FiShield size={22} strokeWidth={1.8} />
            </div>
            <h1 className="al-title">Admin sign in</h1>
            <p className="al-subtitle">Access the RemedyEase administration dashboard.</p>
          </div>

          {/* Info Banner */}
          <div className="al-info-banner">
            <FiInfo size={14} className="al-info-banner-icon" />
            <span>Backend may take 30–60 seconds to wake after inactivity.</span>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="al-alert al-alert--error">
              <FiAlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {backendStatus === "waking" && (
            <div className="al-alert al-alert--warning">
              <FiLoader size={15} className="al-spin" />
              <span>Waking up backend server… This may take 30–60 seconds.</span>
            </div>
          )}

          {backendStatus === "online" && (
            <div className="al-alert al-alert--success">
              <FiCheckCircle size={15} />
              <span>Backend is online. You can now sign in.</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="al-form">
            <div className="al-field">
              <label htmlFor="email" className="al-label">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter admin email"
                disabled={loading}
                className="al-input"
                autoComplete="email"
              />
            </div>

            <div className="al-field">
              <label htmlFor="password" className="al-label">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter password"
                disabled={loading}
                className="al-input"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="al-submit"
              disabled={loading || wakingUp}
            >
              {loading ? (
                <>
                  <FiLoader size={16} className="al-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {/* Secondary Actions */}
          <div className="al-secondary">
            <p className="al-secondary-label">Backend unavailable?</p>
            <button
              onClick={wakeUpBackend}
              className="al-wake-btn"
              disabled={loading || wakingUp}
            >
              {wakingUp ? "Waking up…" : "Wake Up Backend"}
            </button>
          </div>
        </div>

        {/* Security Note */}
        <p className="al-security-note">
          <FiShield size={12} />
          Authorized access only
        </p>
      </main>
    </div>
  );
};

export default AdminLogin;
