import React, { useEffect, useState } from "react";
import "../../Css_for_all/Doctor_Profile.css";

export default function DoctorProfile({ doctorEmail }) {
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [message, setMessage] = useState("");

  const email = doctorEmail || localStorage.getItem("doctorEmail");

  useEffect(() => {
    fetch(`/api/v1/doctors/profile?email=${email}`)
      .then((res) => res.json())
      .then((data) => {
        setDoctor(data.data);
        setForm(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [doctorEmail, editMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setMessage("");
    const res = await fetch("/api/v1/doctors/profile/update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, ...form }),
    });
    const data = await res.json();
    if (res.ok) {
      setDoctor(data.data);
      setEditMode(false);
      setMessage("Profile updated!");
    } else {
      setMessage(data.message || "Update failed.");
    }
  };

  if (loading) return <div>Loading profile...</div>;
  if (!doctor) return <div>No profile found.</div>;

  return (
    <div className="profile-container">
      <h2 className="profile-title">Doctor Profile</h2>
      <h2 className="profile-description">
        Manage your professional profile to meet patients
      </h2>
      <div className="profile-card">
        <img
          src={doctor.avatar || "/default-doctor.png"}
          alt="Doctor"
          className="profile-photo"
        />
        <div className="profile-details">
          <div className="profile-details">
  <p><strong>Name:</strong> {doctor.fullname}</p>
  <p><strong>Email:</strong> {doctor.email}</p>
  <p><strong>Specialization:</strong> {doctor.specialization}</p>
  <p><strong>Degree:</strong> {doctor.degree}</p>
  <p><strong>Registration No:</strong> {doctor.registrationNumber}</p>
  <p><strong>Phone:</strong> {doctor.phone || "Not set"}</p>
  <p><strong>Clinic:</strong> {doctor.clinic || "Not set"}</p>
  <p><strong>Address:</strong> {doctor.address || "Not set"}</p>
  <p><strong>Timings:</strong> {doctor.timings || "Not set"}</p>
  <p><strong>Fee:</strong> {doctor.fee || "Not set"}</p>
  <p><strong>Languages:</strong> {doctor.languages || "Not set"}</p>
</div>
        </div>
      </div>
      <div className="about">
        <h3 className="about-title">About</h3>
        <div className="bio-container">
          <p className="bio">Your Brief Bio you added on signup</p>
          <p className="profile-description">
            {doctor.bio || "No bio available."}
          </p>
        </div>
      </div>
      <div className="experience">
        <h3 className="experience-title">Experience</h3>
        <div className="bio-container">
          <p className="bio">Your Experience you added on signup</p>
          <p className="profile-description">
            {doctor.experience || "No experience available."}
          </p>
        </div>
      </div>

      {/* Editable Section */}
      <div className="edit-profile-box">
        <h3>Edit Profile Info</h3>
        {editMode ? (
          <div className="edit-form">
            <label>
              Phone:
              <input name="phone" value={form.phone || ""} onChange={handleChange} />
            </label>
            <label>
              Clinic:
              <input name="clinic" value={form.clinic || ""} onChange={handleChange} />
            </label>
            <label>
              Address:
              <input name="address" value={form.address || ""} onChange={handleChange} />
            </label>
            <label>
              Timings:
              <input name="timings" value={form.timings || ""} onChange={handleChange} />
            </label>
            <label>
              Fee:
              <input name="fee" value={form.fee || ""} onChange={handleChange} />
            </label>
            <label>
              Languages:
              <input name="languages" value={form.languages || ""} onChange={handleChange} />
            </label>
            <label>
              Bio:
              <textarea name="bio" value={form.bio || ""} onChange={handleChange} />
            </label>
            <label>
              Experience:
              <textarea name="experience" value={form.experience || ""} onChange={handleChange} />
            </label>
            <button onClick={handleSave}>Save Changes</button>
            <button onClick={() => setEditMode(false)}>Cancel</button>
            {message && <div style={{ color: "green", marginTop: 10 }}>{message}</div>}
          </div>
        ) : (
          <button onClick={() => setEditMode(true)}>Edit Profile</button>
        )}
      </div>
    </div>
  );
}