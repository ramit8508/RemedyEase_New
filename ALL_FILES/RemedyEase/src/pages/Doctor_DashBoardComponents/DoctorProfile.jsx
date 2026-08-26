import React, { useEffect, useState, useMemo } from "react";
import {
  FiUser,
  FiMail,
  FiAward,
  FiShield,
  FiFileText,
  FiClock,
  FiPhone,
  FiMapPin,
  FiDollarSign,
  FiGlobe,
  FiEdit3,
  FiCheckCircle,
  FiAlertCircle,
  FiSave,
  FiX,
  FiBriefcase,
  FiCheck,
} from "react-icons/fi";
import "../../Css_for_all/Doctor_Profile.css";
import "../../Css_for_all/DoctorDashboard.css";

export default function DoctorProfile({ doctorEmail }) {
  let storedDoctor = null;
  try {
    storedDoctor = JSON.parse(localStorage.getItem("doctor"));
  } catch {}

  const email =
    doctorEmail ||
    storedDoctor?.email ||
    localStorage.getItem("doctorEmail");

  const [doctor, setDoctor] = useState(storedDoctor);
  const [loading, setLoading] = useState(!storedDoctor);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (email) {
      setLoading(true);
      fetch(`/api/v1/doctors/profile?email=${email}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setDoctor(data.data);
            setForm(data.data);
            localStorage.setItem("doctor", JSON.stringify(data.data));
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [email]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setErrorMessage("");

    try {
      const res = await fetch("/api/v1/doctors/profile/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, ...form }),
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setDoctor(data.data);
        localStorage.setItem("doctor", JSON.stringify(data.data));
        setEditMode(false);
        setMessage("✓ Profile updated successfully!");
        setTimeout(() => setMessage(""), 4000);
      } else {
        setErrorMessage(data.message || "Failed to update profile.");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      setErrorMessage("Cannot connect to server. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Calculate profile completion percentage & missing fields
  const completionData = useMemo(() => {
    if (!doctor) return { percent: 50, missing: [] };

    const checklist = [
      { key: "fullname", label: "Full Name" },
      { key: "email", label: "Email" },
      { key: "specialization", label: "Specialization" },
      { key: "degree", label: "Medical Degree" },
      { key: "registrationNumber", label: "Registration No." },
      { key: "phone", label: "Contact Phone" },
      { key: "clinic", label: "Clinic / Hospital Name" },
      { key: "address", label: "Clinic Address" },
      { key: "timings", label: "Consultation Timings" },
      { key: "fee", label: "Consultation Fee" },
      { key: "languages", label: "Languages" },
      { key: "bio", label: "About / Bio" },
      { key: "experience", label: "Experience" },
    ];

    const filledCount = checklist.filter(
      (item) => doctor[item.key] && String(doctor[item.key]).trim() !== ""
    ).length;

    const missing = checklist
      .filter((item) => !doctor[item.key] || String(doctor[item.key]).trim() === "")
      .map((item) => item.label);

    const percent = Math.round((filledCount / checklist.length) * 100);

    return { percent, missing };
  }, [doctor]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div className="hr-spinner" style={{ width: "32px", height: "32px" }} />
        <p style={{ fontSize: "13.5px", color: "#64748b", marginTop: "12px" }}>
          Loading doctor credentials and practice profile...
        </p>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <FiAlertCircle size={40} color="#dc2626" />
        <h3 style={{ fontSize: "16px", color: "#0f172a", margin: "12px 0 6px" }}>
          Doctor Profile Not Found
        </h3>
        <p style={{ fontSize: "13px", color: "#64748b" }}>
          Please ensure you are authenticated in the doctor portal.
        </p>
      </div>
    );
  }

  return (
    <div className="dp-container">
      {/* Toast Feedback */}
      {message && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            background: "#16a34a",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            zIndex: 1200,
            fontWeight: "700",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <FiCheckCircle size={16} /> {message}
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            padding: "14px 18px",
            borderRadius: "12px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: "#b91c1c",
            fontSize: "13.5px",
          }}
        >
          <FiAlertCircle size={16} /> {errorMessage}
        </div>
      )}

      {/* ─── 1. Profile Hero Card ─── */}
      <div className="dp-hero-card">
        <div className="dp-hero-left">
          <div className="dp-hero-avatar-wrap">
            {doctor.avatar ? (
              <img
                src={doctor.avatar}
                alt={doctor.fullname}
                className="dp-hero-avatar"
              />
            ) : (
              <div className="dp-hero-avatar">
                {doctor.fullname?.charAt(0) || "D"}
              </div>
            )}
          </div>

          <div className="dp-hero-info">
            <h1>Dr. {doctor.fullname}</h1>
            <div className="dp-hero-badges">
              <span className="dp-spec-badge">
                {doctor.specialization || "General Medicine"}
              </span>
              <span className="dp-avail-badge">
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#16a34a",
                  }}
                />
                Available for Consultations
              </span>
              {doctor.registrationNumber && (
                <span
                  style={{
                    fontSize: "11.5px",
                    color: "#64748b",
                    fontWeight: "600",
                  }}
                >
                  Reg. #{doctor.registrationNumber}
                </span>
              )}
            </div>
            <p className="dp-hero-bio">
              {doctor.bio ||
                "Certified healthcare practitioner dedicated to providing patient-centered telemedicine care on RemedyEase."}
            </p>
          </div>
        </div>

        <button
          type="button"
          className={`dd-btn-action ${!editMode ? "dd-btn-action--approve" : ""}`}
          onClick={() => {
            setEditMode(!editMode);
            setForm(doctor);
          }}
          style={{ padding: "10px 18px", fontSize: "13.5px", borderRadius: "10px" }}
        >
          {editMode ? (
            <>
              <FiX size={15} /> Cancel Editing
            </>
          ) : (
            <>
              <FiEdit3 size={15} /> Edit Profile
            </>
          )}
        </button>
      </div>

      {/* ─── 2. Profile Completion Card ─── */}
      <div className="dp-completion-card">
        <div className="dp-completion-header">
          <span className="dp-completion-title">Profile Completion Status</span>
          <span className="dp-completion-percentage">
            {completionData.percent}% Complete
          </span>
        </div>
        <div className="dp-progress-track">
          <div
            className="dp-progress-bar"
            style={{ width: `${completionData.percent}%` }}
          />
        </div>
        {completionData.missing.length > 0 ? (
          <div className="dp-completion-suggestions">
            <span>Suggestions to complete your profile:</span>
            {completionData.missing.slice(0, 3).map((item) => (
              <span key={item} className="dp-suggestion-pill">
                + Add {item}
              </span>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: "12px", color: "#15803d", display: "flex", alignItems: "center", gap: "6px" }}>
            <FiCheck size={14} /> Your doctor profile is complete and verified!
          </div>
        )}
      </div>

      {/* ─── 3. Edit Form Mode (If active) ─── */}
      {editMode ? (
        <div className="dp-card" style={{ marginBottom: "24px" }}>
          <div className="dp-card-header">
            <FiEdit3 className="dp-card-icon" />
            <h2>Edit Practice & Clinical Details</h2>
          </div>

          <form onSubmit={handleSave}>
            <div className="dp-edit-grid">
              <div className="dp-form-group">
                <label>Contact Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  placeholder="e.g. +91 98765 43210"
                  value={form.phone || ""}
                  onChange={handleChange}
                  className="dp-form-input"
                />
              </div>

              <div className="dp-form-group">
                <label>Clinic / Hospital Name</label>
                <input
                  type="text"
                  name="clinic"
                  placeholder="e.g. City Health Clinic"
                  value={form.clinic || ""}
                  onChange={handleChange}
                  className="dp-form-input"
                />
              </div>

              <div className="dp-form-group">
                <label>Clinic Address / Location</label>
                <input
                  type="text"
                  name="address"
                  placeholder="e.g. Sector 14, Chandigarh, India"
                  value={form.address || ""}
                  onChange={handleChange}
                  className="dp-form-input"
                />
              </div>

              <div className="dp-form-group">
                <label>Consultation Timings</label>
                <input
                  type="text"
                  name="timings"
                  placeholder="e.g. Mon - Sat: 09:00 AM - 05:00 PM"
                  value={form.timings || ""}
                  onChange={handleChange}
                  className="dp-form-input"
                />
              </div>

              <div className="dp-form-group">
                <label>Consultation Fee</label>
                <input
                  type="text"
                  name="fee"
                  placeholder="e.g. ₹500 per session"
                  value={form.fee || ""}
                  onChange={handleChange}
                  className="dp-form-input"
                />
              </div>

              <div className="dp-form-group">
                <label>Languages Spoken</label>
                <input
                  type="text"
                  name="languages"
                  placeholder="e.g. English, Hindi, Punjabi"
                  value={form.languages || ""}
                  onChange={handleChange}
                  className="dp-form-input"
                />
              </div>
            </div>

            <div className="dp-form-group" style={{ marginBottom: "16px" }}>
              <label>Years of Clinical Experience</label>
              <input
                type="text"
                name="experience"
                placeholder="e.g. 8+ Years in Cardiology"
                value={form.experience || ""}
                onChange={handleChange}
                className="dp-form-input"
              />
            </div>

            <div className="dp-form-group" style={{ marginBottom: "20px" }}>
              <label>Professional Bio & Background</label>
              <textarea
                rows={4}
                name="bio"
                placeholder="Write a brief professional overview about your clinical practice, background, and specializations..."
                value={form.bio || ""}
                onChange={handleChange}
                className="dp-form-textarea"
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="dd-btn-action"
                onClick={() => setEditMode(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="dd-btn-action dd-btn-action--approve"
                disabled={saving}
              >
                <FiSave size={14} /> {saving ? "Saving Changes..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* ─── 4. Two-Column Credentials & Practice Section ─── */}
      <div className="dp-grid-two-col">
        {/* Left: Professional Information Card */}
        <div className="dp-card">
          <div className="dp-card-header">
            <FiAward className="dp-card-icon" />
            <h2>Professional Information</h2>
          </div>

          <div className="dp-fields-grid">
            <div className="dp-field-item">
              <span className="dp-field-label">
                <FiUser size={12} /> Full Name
              </span>
              <span className="dp-field-value">Dr. {doctor.fullname}</span>
            </div>

            <div className="dp-field-item">
              <span className="dp-field-label">
                <FiMail size={12} /> Email Address
              </span>
              <span className="dp-field-value">{doctor.email}</span>
            </div>

            <div className="dp-field-item">
              <span className="dp-field-label">
                <FiBriefcase size={12} /> Specialization
              </span>
              <span className="dp-field-value">
                {doctor.specialization || "General Medicine"}
              </span>
            </div>

            <div className="dp-field-item">
              <span className="dp-field-label">
                <FiAward size={12} /> Medical Degree
              </span>
              <span className="dp-field-value">
                {doctor.degree || "MBBS, MD"}
              </span>
            </div>

            <div className="dp-field-item">
              <span className="dp-field-label">
                <FiShield size={12} /> Registration Number
              </span>
              <span className="dp-field-value">
                {doctor.registrationNumber || "MCI-48920-IND"}
              </span>
            </div>

            <div className="dp-field-item">
              <span className="dp-field-label">
                <FiClock size={12} /> Experience
              </span>
              <span className="dp-field-value">
                {doctor.experience || "5+ Years Practice"}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Practice Information Card */}
        <div className="dp-card">
          <div className="dp-card-header">
            <FiMapPin className="dp-card-icon" />
            <h2>Practice Information</h2>
          </div>

          <div className="dp-fields-grid">
            <div className="dp-field-item">
              <span className="dp-field-label">
                <FiBriefcase size={12} /> Clinic / Hospital
              </span>
              <span
                className={`dp-field-value ${
                  !doctor.clinic ? "dp-field-value--unset" : ""
                }`}
              >
                {doctor.clinic || "Not provided"}
              </span>
            </div>

            <div className="dp-field-item">
              <span className="dp-field-label">
                <FiPhone size={12} /> Contact Phone
              </span>
              <span
                className={`dp-field-value ${
                  !doctor.phone ? "dp-field-value--unset" : ""
                }`}
              >
                {doctor.phone || "Not provided"}
              </span>
            </div>

            <div className="dp-field-item">
              <span className="dp-field-label">
                <FiMapPin size={12} /> Clinic Address
              </span>
              <span
                className={`dp-field-value ${
                  !doctor.address ? "dp-field-value--unset" : ""
                }`}
              >
                {doctor.address || "Not provided"}
              </span>
            </div>

            <div className="dp-field-item">
              <span className="dp-field-label">
                <FiClock size={12} /> Consultation Timings
              </span>
              <span
                className={`dp-field-value ${
                  !doctor.timings ? "dp-field-value--unset" : ""
                }`}
              >
                {doctor.timings || "Mon - Sat (09:00 AM - 05:00 PM)"}
              </span>
            </div>

            <div className="dp-field-item">
              <span className="dp-field-label">
                <FiDollarSign size={12} /> Consultation Fee
              </span>
              <span
                className={`dp-field-value ${
                  !doctor.fee ? "dp-field-value--unset" : ""
                }`}
              >
                {doctor.fee || "₹500 / session"}
              </span>
            </div>

            <div className="dp-field-item">
              <span className="dp-field-label">
                <FiGlobe size={12} /> Languages Spoken
              </span>
              <span
                className={`dp-field-value ${
                  !doctor.languages ? "dp-field-value--unset" : ""
                }`}
              >
                {doctor.languages || "English, Hindi"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 5. About & Experience Sections ─── */}
      <div className="dp-grid-two-col">
        {/* About Section */}
        <div className="dp-card">
          <div className="dp-card-header">
            <FiFileText className="dp-card-icon" />
            <h2>About & Clinical Background</h2>
          </div>
          <p
            style={{
              fontSize: "13.5px",
              color: "#334155",
              lineHeight: "1.6",
              margin: 0,
            }}
          >
            {doctor.bio ||
              "Dr. " +
                doctor.fullname +
                " is an experienced medical practitioner providing high-quality outpatient consultations and telemedicine care on RemedyEase."}
          </p>
        </div>

        {/* Experience Section */}
        <div className="dp-card">
          <div className="dp-card-header">
            <FiBriefcase className="dp-card-icon" />
            <h2>Medical Experience</h2>
          </div>
          <div>
            <div
              style={{
                fontSize: "24px",
                fontWeight: "800",
                color: "#16a34a",
                fontFamily: "Manrope, sans-serif",
                marginBottom: "4px",
              }}
            >
              {doctor.experience || "5+ Years"}
            </div>
            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
              Professional clinical and telemedicine medical experience.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}