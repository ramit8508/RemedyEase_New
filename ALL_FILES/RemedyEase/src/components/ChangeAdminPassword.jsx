import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Css_for_all/ChangeAdminPassword.css";

const ChangeAdminPassword = () => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    // Validation
    if (formData.newPassword.length < 8) {
      setError("New password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("New password and confirm password do not match");
      setLoading(false);
      return;
    }

    if (formData.newPassword === formData.currentPassword) {
      setError("New password must be different from current password");
      setLoading(false);
      return;
    }

    try {
      const adminEmail = localStorage.getItem("adminEmail");
      
      if (!adminEmail) {
        setError("Session expired. Please login again.");
        setTimeout(() => navigate("/admin/login"), 2000);
        setLoading(false);
        return;
      }

      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      const apiUrl = backendUrl 
        ? `${backendUrl}/api/v1/admin/change-password` 
        : '/api/v1/admin/change-password';

      console.log("🔐 Attempting to change password...");

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: adminEmail,
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("✅ Password changed successfully! Please login again with your new password.");
        console.log("✅ Password changed successfully");
        
        // Clear form
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

        // Logout and redirect to login after 3 seconds
        setTimeout(() => {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminEmail");
          localStorage.removeItem("adminRole");
          navigate("/admin/login");
        }, 3000);
      } else {
        setError(data.message || "Failed to change password");
        console.error("❌ Password change failed:", data.message);
      }
    } catch (err) {
      console.error("❌ Error changing password:", err);
      setError("Failed to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-container">
      <div className="change-password-box">
        <h2 className="change-password-title">🔐 Change Admin Password</h2>
        <p className="change-password-subtitle">
          For security, please use a strong password with at least 8 characters
        </p>

        {error && <div className="password-error-message">{error}</div>}
        {message && <div className="password-success-message">{message}</div>}

        <form onSubmit={handleSubmit} className="change-password-form">
          <div className="password-form-group">
            <label htmlFor="currentPassword">Current Password</label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              required
              placeholder="Enter current password"
              disabled={loading}
            />
          </div>

          <div className="password-form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              required
              placeholder="Enter new password (min 8 characters)"
              disabled={loading}
              minLength={8}
            />
          </div>

          <div className="password-form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Re-enter new password"
              disabled={loading}
              minLength={8}
            />
          </div>

          <button
            type="submit"
            className="password-change-button"
            disabled={loading}
          >
            {loading ? "Changing Password..." : "Change Password"}
          </button>
        </form>

        <div className="password-tips">
          <h4>🛡️ Password Security Tips:</h4>
          <ul>
            <li>Use at least 8 characters (longer is better)</li>
            <li>Mix uppercase and lowercase letters</li>
            <li>Include numbers and special characters</li>
            <li>Don't use common words or personal information</li>
            <li>Don't share your password with anyone</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ChangeAdminPassword;
