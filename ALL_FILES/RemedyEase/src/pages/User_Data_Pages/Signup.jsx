import React, { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../Css_for_all/AuthPages.css";
import { FiEye, FiEyeOff, FiUser, FiUpload, FiShield, FiHeart, FiCheck, FiVideo, FiMessageCircle, FiLock } from "react-icons/fi";

export default function Signup() {
  const avatarRef = useRef();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agree: false,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatarName, setAvatarName] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");

    if (!form.agree) {
      setMessage("You must agree to the terms.");
      setMessageType("error");
      return;
    }
    if (!avatarRef.current.files[0]) {
      setMessage("Please upload your avatar.");
      setMessageType("error");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setMessage("Passwords do not match.");
      setMessageType("error");
      return;
    }
    if (form.password.length < 6) {
      setMessage("Password must be at least 6 characters long.");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("Creating your account...");

    try {
      const formData = new FormData();
      formData.append("fullname", form.fullName);
      formData.append("email", form.email);
      formData.append("password", form.password);
      formData.append("confirmPassword", form.confirmPassword);
      formData.append("avatar", avatarRef.current.files[0]);

      const res = await fetch(`/api/v1/users/register`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Account created successfully! Redirecting to login...");
        setMessageType("success");
        setForm({
            fullName: "",
            email: "",
            password: "",
            confirmPassword: "",
            agree: false,
        });
        avatarRef.current.value = "";
        setAvatarName("");
        setTimeout(() => {
          navigate("/user/login");
        }, 2000);
      } else {
        setMessage(data.message || `Error: ${res.statusText}`);
        setMessageType("error");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setMessage("Cannot connect to server. Please try again.");
      setMessageType("error");
    }
    setLoading(false);
  };

  const handleUploadClick = () => {
    avatarRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setAvatarName(file ? file.name : "");
  };

  const getMessageClass = () => {
    if (messageType === "success") return "auth-message auth-message--success";
    if (messageType === "error") return "auth-message auth-message--error";
    return "auth-message auth-message--info";
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
            <h1 className="auth-card-title">Create your account</h1>
            <p className="auth-card-subtitle">Join RemedyEase and take control of your healthcare.</p>

            <form onSubmit={handleSubmit} encType="multipart/form-data">
              {/* SECTION: Personal information */}
              <div className="auth-section">
                <span className="auth-section-label">Personal information</span>

                <div className="auth-field">
                  <label htmlFor="signup-fullname" className="auth-label">Full Name</label>
                  <div className="auth-input-wrapper">
                    <input
                      id="signup-fullname"
                      type="text"
                      name="fullName"
                      placeholder="Sam Goyal"
                      required
                      className="auth-input"
                      value={form.fullName}
                      onChange={handleChange}
                      autoComplete="name"
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <label htmlFor="signup-email" className="auth-label">Email</label>
                  <div className="auth-input-wrapper">
                    <input
                      id="signup-email"
                      type="email"
                      name="email"
                      placeholder="SAM@example.com"
                      required
                      className="auth-input"
                      value={form.email}
                      onChange={handleChange}
                      autoComplete="email"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION: Secure your account */}
              <div className="auth-section">
                <span className="auth-section-label">Secure your account</span>

                <div className="auth-field">
                  <label htmlFor="signup-password" className="auth-label">Password</label>
                  <div className="auth-input-wrapper">
                    <input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="At least 6 characters"
                      required
                      className="auth-input auth-input--password"
                      value={form.password}
                      onChange={handleChange}
                      autoComplete="new-password"
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

                <div className="auth-field">
                  <label htmlFor="signup-confirm-password" className="auth-label">Confirm Password</label>
                  <div className="auth-input-wrapper">
                    <input
                      id="signup-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Re-enter your password"
                      required
                      className="auth-input auth-input--password"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      tabIndex={0}
                    >
                      {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION: Profile */}
              <div className="auth-section">
                <span className="auth-section-label">Profile</span>

                <div className="auth-field">
                  <label className="auth-label">Profile Photo</label>
                  <div
                    className="auth-upload"
                    onClick={handleUploadClick}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleUploadClick(); } }}
                    role="button"
                    tabIndex={0}
                    aria-label="Upload profile photo"
                  >
                    <div className="auth-upload-icon">
                      {avatarName ? <FiUpload size={20} /> : <FiUser size={20} />}
                    </div>
                    <div className="auth-upload-text">
                      <span className="auth-upload-title">
                        {avatarName ? "Change photo" : "Upload profile photo"}
                      </span>
                      {avatarName ? (
                        <span className="auth-upload-filename">{avatarName}</span>
                      ) : (
                        <span className="auth-upload-hint">PNG, JPG up to 5 MB</span>
                      )}
                    </div>
                    <input
                      type="file"
                      name="avatar"
                      accept="image/*"
                      required
                      className="auth-upload-input"
                      ref={avatarRef}
                      onChange={handleFileChange}
                      tabIndex={-1}
                    />
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className="auth-checkbox-row">
                <input
                  type="checkbox"
                  id="agree"
                  name="agree"
                  checked={form.agree}
                  onChange={handleChange}
                  required
                />
                <label htmlFor="agree" className="auth-checkbox-label">
                  I agree to the terms and conditions
                </label>
              </div>

              {/* Submit */}
              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? "Creating Account..." : "Create Account →"}
              </button>

              {/* Message */}
              {message && (
                <div className={getMessageClass()}>
                  {message}
                </div>
              )}
            </form>

            {/* Switch to Login */}
            <p className="auth-footer-text" style={{ marginTop: '20px' }}>
              Already have an account?{" "}
              <Link to="/user/login" className="auth-footer-link">
                Sign in
              </Link>
            </p>
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