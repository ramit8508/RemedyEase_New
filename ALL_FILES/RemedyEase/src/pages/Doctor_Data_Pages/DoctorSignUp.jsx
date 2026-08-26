import React, { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../Css_for_all/AuthPages.css";
import { FiEye, FiEyeOff, FiUser, FiUpload, FiShield, FiHeart, FiCheck, FiVideo, FiMessageCircle, FiTool } from "react-icons/fi";

export default function DoctorSignUp() {
  const avatarRef = useRef();
  const [form, setForm] = useState({
    fullname: "",
    degree: "",
    specialization: "",
    registrationNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
    bio: "",
    experience: "",
    agree: false,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
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
    if (!form.agree) {
      setMessage("You must agree to the terms.");
      return;
    }
    if (!avatarRef.current.files[0]) {
      setMessage("Please upload your avatar.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("fullname", form.fullname);
      formData.append("degree", form.degree);
      formData.append("specialization", form.specialization);
      formData.append("registrationNumber", form.registrationNumber);
      formData.append("email", form.email);
      formData.append("password", form.password);
      formData.append("confirmPassword", form.confirmPassword);
      formData.append("avatar", avatarRef.current.files[0]);
      formData.append("bio", form.bio);
      formData.append("experience", form.experience);

      const res = await fetch("/api/v1/doctors/register", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Registration successful! Redirecting...");
        setTimeout(() => {
          navigate("/doctor/login");
        }, 2000);
      } else {
        setMessage(data.message || data.error || "Registration failed.");
      }
    } catch (err) {
      setMessage("Cannot connect to server. Please try again.");
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
    if (message.includes("successful") || message.includes("Redirecting")) return "auth-message auth-message--success";
    if (message.includes("Creating")) return "auth-message auth-message--info";
    return "auth-message auth-message--error";
  };

  return (
    <div className="auth-page">
      <div className="auth-layout">
        {/* LEFT COLUMN — Doctor Intro */}
        <div className="auth-intro">
          <span className="auth-intro-badge">RemedyEase for Doctors</span>
          <h2 className="auth-intro-heading">Healthcare, connected.</h2>
          <p className="auth-intro-text">
            Manage consultations, connect with patients and deliver better care
            through one secure platform.
          </p>

          {/* Benefit items — clean vertical list */}
          <div className="auth-benefits">
            <div className="auth-benefit-item">
              <div className="auth-benefit-icon auth-benefit-icon--green">
                <FiVideo size={18} />
              </div>
              <div className="auth-benefit-text">
                <span className="auth-benefit-title">Patient Consultations</span>
                <span className="auth-benefit-sub">Connect with patients online</span>
              </div>
            </div>

            <div className="auth-benefit-item">
              <div className="auth-benefit-icon auth-benefit-icon--blue">
                <FiTool size={18} />
              </div>
              <div className="auth-benefit-text">
                <span className="auth-benefit-title">Clinical Tools</span>
                <span className="auth-benefit-sub">Tools to support better care</span>
              </div>
            </div>

            <div className="auth-benefit-item">
              <div className="auth-benefit-icon auth-benefit-icon--green">
                <FiShield size={18} />
              </div>
              <div className="auth-benefit-text">
                <span className="auth-benefit-title">Secure Platform</span>
                <span className="auth-benefit-sub">Your professional data stays protected</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN — Form */}
        <div className="auth-form-column">
          <Link to="/doctor/home" className="auth-brand">RemedyEase</Link>

          <div className="auth-card">
            <h1 className="auth-card-title">Create your account</h1>
            <p className="auth-card-subtitle">Join RemedyEase and take control of your practice.</p>

            <form onSubmit={handleSubmit} encType="multipart/form-data">
              {/* SECTION: Personal information */}
              <div className="auth-section">
                <span className="auth-section-label">Personal information</span>

                <div className="auth-field">
                  <label htmlFor="doc-fullname" className="auth-label">Full Name</label>
                  <div className="auth-input-wrapper">
                    <input
                      id="doc-fullname"
                      type="text"
                      name="fullname"
                      placeholder="Dr. John Smith"
                      required
                      className="auth-input"
                      value={form.fullname}
                      onChange={handleChange}
                      autoComplete="name"
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <label htmlFor="doc-degree" className="auth-label">Your Degree</label>
                  <div className="auth-input-wrapper">
                    <input
                      id="doc-degree"
                      type="text"
                      name="degree"
                      placeholder="MD-MEDICINE"
                      required
                      className="auth-input"
                      value={form.degree}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <label htmlFor="doc-specialization" className="auth-label">Specialization</label>
                  <div className="auth-input-wrapper">
                    <input
                      id="doc-specialization"
                      type="text"
                      name="specialization"
                      placeholder="Cardiology"
                      required
                      className="auth-input"
                      value={form.specialization}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <label htmlFor="doc-registration" className="auth-label">Registration Number</label>
                  <div className="auth-input-wrapper">
                    <input
                      id="doc-registration"
                      type="text"
                      name="registrationNumber"
                      placeholder="PMC/2023/12345"
                      required
                      className="auth-input"
                      value={form.registrationNumber}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <label htmlFor="doc-email" className="auth-label">Email</label>
                  <div className="auth-input-wrapper">
                    <input
                      id="doc-email"
                      type="email"
                      name="email"
                      placeholder="doctor@example.com"
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
                  <label htmlFor="doc-password" className="auth-label">Password</label>
                  <div className="auth-input-wrapper">
                    <input
                      id="doc-password"
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
                  <label htmlFor="doc-confirm-password" className="auth-label">Confirm Password</label>
                  <div className="auth-input-wrapper">
                    <input
                      id="doc-confirm-password"
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

              {/* SECTION: Professional Profile */}
              <div className="auth-section">
                <span className="auth-section-label">Professional profile</span>

                <div className="auth-field">
                  <label htmlFor="doc-bio" className="auth-label">About You (Bio)</label>
                  <div className="auth-input-wrapper">
                    <textarea
                      id="doc-bio"
                      name="bio"
                      placeholder="Tell us about yourself and your practice..."
                      required
                      className="auth-input auth-input--textarea"
                      value={form.bio}
                      onChange={handleChange}
                      rows={3}
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <label htmlFor="doc-experience" className="auth-label">Experience</label>
                  <div className="auth-input-wrapper">
                    <input
                      id="doc-experience"
                      type="text"
                      name="experience"
                      placeholder="e.g. 5 years in cardiology"
                      required
                      className="auth-input"
                      value={form.experience}
                      onChange={handleChange}
                    />
                  </div>
                </div>

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
              <Link to="/doctor/login" className="auth-footer-link">
                Log in here
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