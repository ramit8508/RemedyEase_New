import React, { useState } from "react";
import "../../Css_for_all/AuthPages.css";
import { Link, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff, FiLock, FiShield, FiHeart, FiCheck } from "react-icons/fi";

export default function DoctorLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch("/api/v1/doctors/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("doctorEmail", email);
        localStorage.setItem("doctor", JSON.stringify(data.data.doctor));
        // Store JWT access token for authenticated API calls
        if (data.data.accessToken) {
          localStorage.setItem("doctorAccessToken", data.data.accessToken);
        }
        if (data.data.refreshToken) {
          localStorage.setItem("doctorRefreshToken", data.data.refreshToken);
        }
        setMessage("Login successful! Redirecting...");
        setTimeout(() => {
          navigate("/doctor/dashboard/home");
        }, 1200);
      } else {
        // Show specific messages for different error types
        if (res.status === 403) {
          setMessage(data.message || "Your account access is restricted. Please contact support.");
        } else if (res.status === 401) {
          setMessage("Incorrect password. Please try again.");
        } else if (res.status === 404) {
          setMessage("No doctor account found with this email address.");
        } else {
          setMessage(data.message || "Login failed. Please try again.");
        }
      }
    } catch (err) {
      setMessage("Cannot connect to server. Please try again.");
    }
    setLoading(false);
  };

  const getMessageType = () => {
    if (message.includes("successful") || message.includes("Redirecting")) return "auth-message--success";
    if (message.includes("Logging")) return "auth-message--info";
    return "auth-message--error";
  };

  return (
    <div className="auth-page">
      <div className="auth-layout auth-layout--login">
        {/* CENTER — Form */}
        <div className="auth-form-column">
          <Link to="/doctor/home" className="auth-brand">RemedyEase</Link>

          <div className="auth-card">
            <h1 className="auth-card-title">Welcome back</h1>
            <p className="auth-card-subtitle">Sign in to your RemedyEase doctor account.</p>

            <form onSubmit={handleSubmit}>
              {/* Email */}
              <div className="auth-field">
                <label htmlFor="doc-login-email" className="auth-label">Email</label>
                <div className="auth-input-wrapper">
                  <input
                    id="doc-login-email"
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    required
                    className="auth-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="auth-field">
                <label htmlFor="doc-login-password" className="auth-label">Password</label>
                <div className="auth-input-wrapper">
                  <input
                    id="doc-login-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password"
                    required
                    className="auth-input auth-input--password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={0}
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? "Signing in..." : "Sign In →"}
              </button>

              {/* Message */}
              {message && (
                <div className={`auth-message ${getMessageType()}`}>
                  {message}
                </div>
              )}
            </form>

            {/* Switch to Signup */}
            <p className="auth-footer-text" style={{ marginTop: '20px' }}>
              Don't have an account?{" "}
              <Link to="/doctor/signup" className="auth-footer-link">
                Create one
              </Link>
            </p>

            {/* Security note */}
            <div className="auth-secure-note">
              <FiLock size={14} />
              <span>Your information is protected with secure authentication.</span>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="auth-trust-row">
            <div className="auth-trust-item">
              <FiShield size={14} />
              <span>Secure & private</span>
            </div>
            <div className="auth-trust-item">
              <FiHeart size={14} />
              <span>Doctor-first platform</span>
            </div>
            <div className="auth-trust-item">
              <FiCheck size={14} />
              <span>Trusted healthcare platform</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}