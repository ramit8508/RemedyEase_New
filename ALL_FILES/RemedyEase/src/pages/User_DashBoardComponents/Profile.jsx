import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiEdit2, FiCamera, FiPhone, FiUser, FiCalendar, FiMapPin,
  FiDroplet, FiAlertCircle, FiHeart, FiShield, FiCheck,
  FiX, FiSave, FiUsers, FiCpu, FiMessageCircle, FiActivity,
  FiLogOut,
} from "react-icons/fi";
import "../../Css_for_all/UserProfile.css";

/* ─── Constants ─── */
const BLOOD_GROUPS = ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS = ["", "Male", "Female", "Other", "Prefer not to say"];

const PROFILE_FIELDS = [
  "phone", "gender", "dob", "address",
  "bloodGroup", "emergencyContact", "allergies", "medications",
];

function calcCompleteness(user) {
  if (!user) return 0;
  let filled = 0;
  let total = PROFILE_FIELDS.length;
  for (const f of PROFILE_FIELDS) {
    if (user[f] && user[f].trim()) filled++;
  }
  return Math.round((filled / total) * 100);
}

/* ─── Toast component ─── */
function Toast({ type, message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`up-toast up-toast--${type}`}>
      {type === "success" ? <FiCheck size={16} /> : <FiAlertCircle size={16} />}
      {message}
    </div>
  );
}

/* ─── Main Component ─── */
export default function Profile() {
  const navigate = useNavigate();

  // Get cached user from localStorage immediately
  const cachedUser = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  }, []);

  const [user, setUser] = useState(cachedUser);
  const [loading, setLoading] = useState(!cachedUser);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileRef = useRef(null);
  const isMountedRef = useRef(true);
  const savingRef = useRef(false);

  const email = cachedUser?.email || localStorage.getItem("userEmail");

  const handleLogout = useCallback(() => {
    if (window.confirm("Are you sure you want to log out of RemedyEase?")) {
      localStorage.removeItem("user");
      localStorage.removeItem("userEmail");
      sessionStorage.clear();
      navigate("/user/login");
    }
  }, [navigate]);

  // Fetch profile once on mount (to get latest data)
  useEffect(() => {
    isMountedRef.current = true;
    const token = localStorage.getItem("accessToken") || localStorage.getItem("userAccessToken") || "";
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    fetch(`/api/v1/users/profile?email=${email}`, { headers })
      .then((r) => r.json())
      .then((data) => {
        if (!isMountedRef.current) return;
        if (data.success && data.data) {
          setUser(data.data);
          // Update localStorage with latest
          const stored = JSON.parse(localStorage.getItem("user") || "{}");
          localStorage.setItem("user", JSON.stringify({ ...stored, ...data.data }));
        }
        setLoading(false);
      })
      .catch(() => {
        if (isMountedRef.current) setLoading(false);
      });

    return () => { isMountedRef.current = false; };
  }, [email]);

  // Enter edit mode
  const enterEdit = useCallback(() => {
    setForm({
      phone: user?.phone || "",
      gender: user?.gender || "",
      dob: user?.dob || "",
      address: user?.address || "",
      bloodGroup: user?.bloodGroup || "",
      emergencyContact: user?.emergencyContact || "",
      allergies: user?.allergies || "",
      medications: user?.medications || "",
    });
    setErrors({});
    setEditMode(true);
  }, [user]);

  const cancelEdit = useCallback(() => {
    setEditMode(false);
    setErrors({});
  }, []);

  // Validate
  const validate = useCallback(() => {
    const e = {};
    if (form.phone && !/^[+\d\s()-]{7,20}$/.test(form.phone)) {
      e.phone = "Enter a valid phone number";
    }
    if (form.emergencyContact && !/^[+\d\s()-]{7,20}$/.test(form.emergencyContact)) {
      e.emergencyContact = "Enter a valid contact number";
    }
    if (form.dob) {
      const d = new Date(form.dob);
      if (isNaN(d.getTime()) || d > new Date()) {
        e.dob = "Enter a valid date of birth";
      }
    }
    return e;
  }, [form]);

  // Save — optimistic
  const handleSave = useCallback(async () => {
    if (savingRef.current) return;
    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    savingRef.current = true;
    setSaving(true);
    setErrors({});

    // Optimistically update UI
    const previousUser = { ...user };
    const updatedUser = { ...user, ...form };
    setUser(updatedUser);
    setEditMode(false);

    // Update localStorage
    const stored = JSON.parse(localStorage.getItem("user") || "{}");
    localStorage.setItem("user", JSON.stringify({ ...stored, ...form }));

    const token = localStorage.getItem("accessToken") || localStorage.getItem("userAccessToken") || "";
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    try {
      const res = await fetch("/api/v1/users/profile/update", {
        method: "PUT",
        headers,
        body: JSON.stringify({ email, ...form }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Update failed");
      }

      if (data.data) {
        setUser(data.data);
        localStorage.setItem("user", JSON.stringify({ ...stored, ...data.data }));
      }
      setToast({ type: "success", message: "Profile updated successfully" });
    } catch (err) {
      // Rollback
      setUser(previousUser);
      localStorage.setItem("user", JSON.stringify({ ...stored, ...previousUser }));
      setToast({ type: "error", message: err.message || "Unable to save changes. Please try again." });
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  }, [user, form, email, validate]);

  // Avatar upload
  const handleAvatarChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview immediately
    const previewUrl = URL.createObjectURL(file);
    const previousAvatar = user?.avatar;
    setUser((prev) => ({ ...prev, avatar: previewUrl }));
    setAvatarUploading(true);

    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("userAccessToken") || "";
      const formData = new FormData();
      formData.append("avatar", file);
      formData.append("email", email);

      const res = await fetch("/api/v1/users/profile/avatar", {
        method: "PUT",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();

      URL.revokeObjectURL(previewUrl);

      if (res.ok && data.data?.avatar) {
        setUser((prev) => ({ ...prev, avatar: data.data.avatar }));
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem("user", JSON.stringify({ ...stored, avatar: data.data.avatar }));
        setToast({ type: "success", message: "Photo updated" });
      } else {
        throw new Error("Upload failed");
      }
    } catch (err) {
      URL.revokeObjectURL(previewUrl);
      setUser((prev) => ({ ...prev, avatar: previousAvatar }));
      setToast({ type: "error", message: "Unable to update photo. Please try again." });
    } finally {
      setAvatarUploading(false);
    }
  }, [user, email]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }, []);

  const completeness = useMemo(() => calcCompleteness(user), [user]);

  // ─── Render ───
  if (loading) {
    return (
      <div className="up">
        <div className="up-main">
          <div className="up-header-card">
            <div className="up-skeleton-avatar" />
            <div className="up-header-info" style={{ flex: 1 }}>
              <div className="up-skeleton-line up-skeleton-line--med" />
              <div className="up-skeleton-line up-skeleton-line--short" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="up">
        <div className="up-main">
          <div className="up-header-card">
            <p style={{ color: "#6b7280", textAlign: "center", width: "100%", padding: "20px 0" }}>
              Unable to load profile. Please try again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="up">
      <div className="up-main">

        {/* ── PROFILE HEADER ── */}
        <div className="up-header-card">
          <div className="up-avatar-wrap">
            <img
              src={user.avatar || "/default-user.png"}
              alt={user.fullname || "Profile photo"}
              className="up-avatar"
              loading="lazy"
            />
            <button
              className="up-avatar-edit"
              onClick={() => fileRef.current?.click()}
              disabled={avatarUploading}
              aria-label="Change profile photo"
              type="button"
            >
              <FiCamera size={14} />
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
              />
            </button>
          </div>

          <div className="up-header-info">
            <h1 className="up-name">{user.fullname || "Patient"}</h1>
            <p className="up-email">{user.email}</p>
            <span className="up-badge"><FiUser size={11} /> Patient</span>
            <p className="up-header-subtitle">Manage your personal health information securely.</p>
          </div>

          <div className="up-header-action">
            <div className="up-header-action-group">
              {!editMode && (
                <button className="up-edit-btn" onClick={enterEdit} type="button">
                  <FiEdit2 size={15} /> Edit Profile
                </button>
              )}
              <button
                className="up-logout-btn"
                onClick={handleLogout}
                type="button"
                title="Sign out of your account"
              >
                <FiLogOut size={15} /> Log Out
              </button>
            </div>
          </div>
        </div>

        {/* ── COMPLETENESS ── */}
        {completeness < 100 && (
          <div className="up-completeness">
            <div className="up-completeness-header">
              <h3 className="up-completeness-title">Profile completeness</h3>
              <span className="up-completeness-pct">{completeness}%</span>
            </div>
            <div className="up-completeness-bar">
              <div className="up-completeness-fill" style={{ width: `${completeness}%` }} />
            </div>
            <p className="up-completeness-hint">
              Complete your profile to help doctors understand your health better.
            </p>
          </div>
        )}

        {/* ── EDIT MODE ── */}
        {editMode ? (
          <div className="up-edit-card">
            <h2 className="up-edit-section-title">Edit Profile Information</h2>

            <div className="up-form-grid">
              {/* Phone */}
              <div className="up-form-group">
                <label className="up-form-label" htmlFor="up-phone">Phone</label>
                <input
                  id="up-phone"
                  className="up-form-input"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="e.g. +91 98765 43210"
                />
                {errors.phone && <span className="up-form-error">{errors.phone}</span>}
              </div>

              {/* Gender */}
              <div className="up-form-group">
                <label className="up-form-label" htmlFor="up-gender">Gender</label>
                <select
                  id="up-gender"
                  className="up-form-select"
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                >
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>{g || "Select gender"}</option>
                  ))}
                </select>
              </div>

              {/* DOB */}
              <div className="up-form-group">
                <label className="up-form-label" htmlFor="up-dob">Date of Birth</label>
                <input
                  id="up-dob"
                  className="up-form-input"
                  name="dob"
                  type="date"
                  value={form.dob}
                  onChange={handleChange}
                  max={new Date().toISOString().split("T")[0]}
                />
                {errors.dob && <span className="up-form-error">{errors.dob}</span>}
              </div>

              {/* Blood Group */}
              <div className="up-form-group">
                <label className="up-form-label" htmlFor="up-blood">Blood Group</label>
                <select
                  id="up-blood"
                  className="up-form-select"
                  name="bloodGroup"
                  value={form.bloodGroup}
                  onChange={handleChange}
                >
                  {BLOOD_GROUPS.map((b) => (
                    <option key={b} value={b}>{b || "Select blood group"}</option>
                  ))}
                </select>
              </div>

              {/* Emergency Contact */}
              <div className="up-form-group">
                <label className="up-form-label" htmlFor="up-emergency">Emergency Contact</label>
                <input
                  id="up-emergency"
                  className="up-form-input"
                  name="emergencyContact"
                  type="tel"
                  value={form.emergencyContact}
                  onChange={handleChange}
                  placeholder="e.g. +91 98765 43210"
                />
                {errors.emergencyContact && <span className="up-form-error">{errors.emergencyContact}</span>}
              </div>

              {/* Address */}
              <div className="up-form-group up-form-group--full">
                <label className="up-form-label" htmlFor="up-address">Address</label>
                <textarea
                  id="up-address"
                  className="up-form-textarea"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Your full address"
                  rows={2}
                />
              </div>

              {/* Allergies */}
              <div className="up-form-group up-form-group--full">
                <label className="up-form-label" htmlFor="up-allergies">Allergies</label>
                <textarea
                  id="up-allergies"
                  className="up-form-textarea"
                  name="allergies"
                  value={form.allergies}
                  onChange={handleChange}
                  placeholder="e.g. Penicillin, Peanuts, Dust"
                  rows={2}
                />
              </div>

              {/* Medications */}
              <div className="up-form-group up-form-group--full">
                <label className="up-form-label" htmlFor="up-meds">Current Medications</label>
                <textarea
                  id="up-meds"
                  className="up-form-textarea"
                  name="medications"
                  value={form.medications}
                  onChange={handleChange}
                  placeholder="e.g. Metformin 500mg, Aspirin 75mg"
                  rows={2}
                />
              </div>
            </div>

            <div className="up-edit-actions">
              <button className="up-cancel-btn" onClick={cancelEdit} disabled={saving} type="button">
                <FiX size={16} /> Cancel
              </button>
              <button className="up-save-btn" onClick={handleSave} disabled={saving} type="button">
                {saving ? (
                  <>
                    <span className="up-saving-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <FiSave size={16} /> Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* ── VIEW MODE ── */
          <div className="up-sections">
            {/* Personal Information */}
            <div className="up-section-card">
              <h3 className="up-section-title"><FiUser size={18} /> Personal Information</h3>

              <FieldRow icon={<FiPhone size={16} />} label="Phone" value={user.phone} />
              <FieldRow icon={<FiUser size={16} />} label="Gender" value={user.gender} />
              <FieldRow icon={<FiCalendar size={16} />} label="Date of Birth" value={user.dob} />
              <FieldRow icon={<FiMapPin size={16} />} label="Address" value={user.address} />
            </div>

            {/* Health Information */}
            <div className="up-section-card">
              <h3 className="up-section-title"><FiHeart size={18} /> Health Information</h3>

              <FieldRow icon={<FiDroplet size={16} />} label="Blood Group" value={user.bloodGroup} />
              <FieldRow icon={<FiAlertCircle size={16} />} label="Allergies" value={user.allergies} />
              <FieldRow icon={<FiActivity size={16} />} label="Medications" value={user.medications} />
              <FieldRow icon={<FiPhone size={16} />} label="Emergency Contact" value={user.emergencyContact} />
            </div>
          </div>
        )}

        {/* ── QUICK ACTIONS ── */}
        <div className="up-quick-actions">
          <h3 className="up-quick-title">Quick Actions</h3>
          <div className="up-quick-grid">
            <Link to="/user/dashboard/Meetdoctor" className="up-quick-item">
              <span className="up-quick-icon up-quick-icon--blue"><FiUsers size={20} /></span>
              <span className="up-quick-label">Find a Doctor</span>
            </Link>
            <Link to="/user/dashboard/Appointments" className="up-quick-item">
              <span className="up-quick-icon up-quick-icon--green"><FiCalendar size={20} /></span>
              <span className="up-quick-label">Book Appointment</span>
            </Link>
            <Link to="/user/dashboard/SymptomChecker" className="up-quick-item">
              <span className="up-quick-icon up-quick-icon--purple"><FiCpu size={20} /></span>
              <span className="up-quick-label">AI Health Check</span>
            </Link>
            <Link to="/user/dashboard/Chat" className="up-quick-item">
              <span className="up-quick-icon up-quick-icon--amber"><FiMessageCircle size={20} /></span>
              <span className="up-quick-label">Chat with Doctor</span>
            </Link>
          </div>
        </div>

        {/* ── SECURITY ── */}
        <div className="up-security">
          <FiShield size={22} className="up-security-icon" />
          <div className="up-security-text">
            <strong>🔒 Your health information is private</strong>
            <p>Your personal and health information is securely stored and only used to provide better healthcare experiences.</p>
          </div>
        </div>

        {/* ── ACCOUNT & SESSION ── */}
        <div className="up-account-session">
          <div className="up-session-text">
            <h4>Account & Session</h4>
            <p>Signed in as <strong>{user.email}</strong>. Ready to end your session on this device?</p>
          </div>
          <button className="up-logout-btn up-logout-btn--large" onClick={handleLogout} type="button">
            <FiLogOut size={16} /> Sign Out of RemedyEase
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

/* ─── Field Row (view mode) ─── */
function FieldRow({ icon, label, value }) {
  const hasValue = value && value.trim();
  return (
    <div className="up-field">
      <div className="up-field-icon">{icon}</div>
      <div className="up-field-content">
        <p className="up-field-label">{label}</p>
        <p className={`up-field-value ${!hasValue ? "up-field-value--empty" : ""}`}>
          {hasValue ? value : "Not added yet"}
        </p>
      </div>
    </div>
  );
}