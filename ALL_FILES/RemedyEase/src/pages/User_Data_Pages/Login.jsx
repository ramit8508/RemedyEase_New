import React, { useState } from "react";
import "../../Css_for_all/AuthPages.css";
import { Link, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff, FiLock, FiShield, FiHeart, FiCheck, FiVideo, FiMessageCircle } from "react-icons/fi";

export default function Login() {
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
      setMessage(" Logging you in...");
      
      const res = await fetch(`/api/v1/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("user", JSON.stringify(data.data.user));
        localStorage.setItem("userEmail", email);
        setMessage("Login successful! Redirecting...");
        setTimeout(() => {
          navigate("/user/dashboard/Home");
        }, 1200);
      } else {
        setMessage(data.message || "Login failed.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setMessage("Cannot connect to servers. Please check your internet connection.");
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
      <div className="auth-layout">
        {/* LEFT COLUMN — Intro */}
        <div className="auth-intro">
          <span className="auth-intro-badge">RemedyEase Healthcare</span>
          <h2 className="auth-intro-heading">Healthcare made simpler.</h2>
          <p className="auth-intro-text">
            Connect with trusted doctors, manage your healthcare and access
            personalized support — all from one secure platform.
          </p>

          {/* Benefit items — clean vertical list */}
          <div className="auth-benefits">
            <div className="auth-benefit-item">
              <div className="auth-benefit-icon auth-benefit-icon--green">
                <FiVideo size={18} />
              </div>
              <div className="auth-benefit-text">
                <span className="auth-benefit-title">Video Consultations</span>
                <span className="auth-benefit-sub">Meet trusted doctors online</span>
              </div>
            </div>

            <div className="auth-benefit-item">
              <div className="auth-benefit-icon auth-benefit-icon--blue">
                <FiMessageCircle size={18} />
              </div>
              <div className="auth-benefit-text">
                <span className="auth-benefit-title">Real-time Doctor Chat</span>
                <span className="auth-benefit-sub">Get support when you need it</span>
              </div>
            </div>

            <div className="auth-benefit-item">
              <div className="auth-benefit-icon auth-benefit-icon--green">
                <FiShield size={18} />
              </div>
              <div className="auth-benefit-text">
                <span className="auth-benefit-title">Secure & Private</span>
                <span className="auth-benefit-sub">Your healthcare data stays protected</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN — Form */}
        <div className="auth-form-column">
          <Link to="/user/home" className="auth-brand">RemedyEase</Link>

          <div className="auth-card">
            <h1 className="auth-card-title">Welcome back</h1>
            <p className="auth-card-subtitle">Sign in to continue your healthcare journey.</p>

            <form onSubmit={handleSubmit}>
              {/* Email */}
              <div className="auth-field">
                <label htmlFor="login-email" className="auth-label">Email</label>
                <div className="auth-input-wrapper">
                  <input
                    id="login-email"
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
                <label htmlFor="login-password" className="auth-label">Password</label>
                <div className="auth-input-wrapper">
                  <input
                    id="login-password"
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
                <div className="auth-forgot-row">
                  <a href="#" className="auth-forgot-link" onClick={(e) => e.preventDefault()}>
                    Forgot password?
                  </a>
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

            {/* Divider */}
            <div className="auth-divider">
              <span className="auth-divider-text">or</span>
            </div>

            {/* Switch to Signup */}
            <p className="auth-footer-text">
              Don't have an account?{" "}
              <Link to="/user/signup" className="auth-footer-link">
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
              <span>Patient-first</span>
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