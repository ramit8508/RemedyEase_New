import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiLock,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiAlertCircle,
  FiShield,
} from "react-icons/fi";
import "../Css_for_all/AdminDashboard.css";

export default function ChangeAdminPassword() {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError("");
    setMessage("");
  };

  // Password Strength Checklist
  const passwordStrength = useMemo(() => {
    const pwd = formData.newPassword;
    return {
      hasLength: pwd.length >= 8,
      hasUpper: /[A-Z]/.test(pwd),
      hasLower: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecial: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd),
    };
  }, [formData.newPassword]);

  const strengthScore = Object.values(passwordStrength).filter(Boolean).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (strengthScore < 4) {
      setError("Please ensure your new password satisfies the security requirements below.");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    if (formData.newPassword === formData.currentPassword) {
      setError("New password must be different from your current password.");
      return;
    }

    setLoading(true);

    try {
      const adminEmail = localStorage.getItem("adminEmail");
      const token = localStorage.getItem("adminToken");

      if (!adminEmail || !token) {
        setError("Session expired. Please log in again.");
        setTimeout(() => navigate("/admin/login"), 2000);
        return;
      }

      const res = await fetch("/api/v1/admin/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: adminEmail,
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("✓ Password changed successfully! Please log in again with your new credentials.");
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

        setTimeout(() => {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminEmail");
          localStorage.removeItem("adminRole");
          navigate("/admin/login");
        }, 3000);
      } else {
        setError(data.message || "Failed to update password. Verify current password.");
      }
    } catch (err) {
      console.error("Password change error:", err);
      setError("Network error while changing password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "560px", margin: "0 auto", paddingTop: "10px" }}>
      {/* Header */}
      <div className="ap-page-header" style={{ justifyContent: "center", textAlign: "center" }}>
        <div>
          <h1 className="ap-page-title">Admin Security & Access</h1>
          <p className="ap-page-subtitle">
            Update your master administrative credentials and manage account security policies.
          </p>
        </div>
      </div>

      {message && (
        <div style={{ background: "#f0fdf4", border: "1px solid #dcfce7", padding: "14px 18px", borderRadius: "14px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", color: "#15803d", fontSize: "13.5px" }}>
          <FiCheckCircle size={16} /> {message}
        </div>
      )}

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "14px 18px", borderRadius: "14px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", color: "#b91c1c", fontSize: "13.5px" }}>
          <FiAlertCircle size={16} /> {error}
        </div>
      )}

      {/* Security Card */}
      <div className="ap-panel-card" style={{ padding: "28px" }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Current Password */}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#0f172a", marginBottom: "6px" }}>
              Current Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showCurrent ? "text" : "password"}
                name="currentPassword"
                required
                placeholder="Enter current password"
                value={formData.currentPassword}
                onChange={handleChange}
                className="ap-table-search"
                style={{ paddingRight: "36px" }}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748b", cursor: "pointer" }}
              >
                {showCurrent ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#0f172a", marginBottom: "6px" }}>
              New Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showNew ? "text" : "password"}
                name="newPassword"
                required
                placeholder="Enter strong new password"
                value={formData.newPassword}
                onChange={handleChange}
                className="ap-table-search"
                style={{ paddingRight: "36px" }}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748b", cursor: "pointer" }}
              >
                {showNew ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#0f172a", marginBottom: "6px" }}>
              Confirm New Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showConfirm ? "text" : "password"}
                name="confirmPassword"
                required
                placeholder="Re-enter new password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="ap-table-search"
                style={{ paddingRight: "36px" }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748b", cursor: "pointer" }}
              >
                {showConfirm ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          {/* Password Strength Checklist */}
          {formData.newPassword && (
            <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12.5px" }}>
              <span style={{ fontWeight: "700", color: "#0f172a", display: "block", marginBottom: "8px" }}>
                Security Requirements:
              </span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                <span style={{ color: passwordStrength.hasLength ? "#16a34a" : "#94a3b8", display: "flex", alignItems: "center", gap: "6px" }}>
                  {passwordStrength.hasLength ? "✓" : "○"} At least 8 characters
                </span>
                <span style={{ color: passwordStrength.hasUpper ? "#16a34a" : "#94a3b8", display: "flex", alignItems: "center", gap: "6px" }}>
                  {passwordStrength.hasUpper ? "✓" : "○"} Uppercase letter
                </span>
                <span style={{ color: passwordStrength.hasLower ? "#16a34a" : "#94a3b8", display: "flex", alignItems: "center", gap: "6px" }}>
                  {passwordStrength.hasLower ? "✓" : "○"} Lowercase letter
                </span>
                <span style={{ color: passwordStrength.hasNumber ? "#16a34a" : "#94a3b8", display: "flex", alignItems: "center", gap: "6px" }}>
                  {passwordStrength.hasNumber ? "✓" : "○"} Number (0-9)
                </span>
                <span style={{ color: passwordStrength.hasSpecial ? "#16a34a" : "#94a3b8", display: "flex", alignItems: "center", gap: "6px" }}>
                  {passwordStrength.hasSpecial ? "✓" : "○"} Special character
                </span>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="ap-btn-action ap-btn-action--approve"
            disabled={loading}
            style={{ padding: "12px", justifyContent: "center", fontSize: "14px", borderRadius: "12px", marginTop: "6px" }}
          >
            {loading ? "Updating Credentials..." : "Update Administrator Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
