import React, { useEffect, useState } from "react";
import "../../Css_for_all/Doctor_Profile.css"; 

export default function UserProfile({ userEmail }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [message, setMessage] = useState("");

  const email = userEmail || localStorage.getItem("userEmail");

  useEffect(() => {
    if (email) {
      setLoading(true);
      fetch(`/api/v1/users/profile?email=${email}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setUser(data.data);
            setForm(data.data);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
        setLoading(false);
    }
  }, [email, editMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setMessage("");
    try {
        const res = await fetch("/api/v1/users/profile/update", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, ...form }),
        });
        const data = await res.json();
        if (res.ok) {
            setUser(data.data);
            setEditMode(false);
            setMessage("Profile updated successfully!");
        } else {
            setMessage(data.message || "Update failed.");
        }
    } catch (error) {
        setMessage("Cannot connect to server. Please try again.");
    }
  };

  if (loading) return <div>Loading profile...</div>;
  if (!user) return <div>No profile found.</div>;

  return (
    <div className="profile-container">
      <h2 className="profile-title">User Profile</h2>
      <h2 className="profile-description">
        Manage your personal profile
      </h2>
      <div className="profile-card">
        <img
          src={user.avatar || "/default-user.png"}
          alt="User"
          className="profile-photo"
        />
        <div className="profile-details">
          <p><strong>Name:</strong> {user.fullname}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Phone:</strong> {user.phone || "Not set"}</p>
          <p><strong>Gender:</strong> {user.gender || "Not set"}</p>
          <p><strong>Date of Birth:</strong> {user.dob || "Not set"}</p>
          <p><strong>Address:</strong> {user.address || "Not set"}</p>
          <p><strong>Blood Group:</strong> {user.bloodGroup || "Not set"}</p>
          <p><strong>Emergency Contact:</strong> {user.emergencyContact || "Not set"}</p>
          <p><strong>Allergies:</strong> {user.allergies || "Not set"}</p>
          <p><strong>Medications:</strong> {user.medications || "Not set"}</p>
        </div>
      </div>

      <div className="edit-profile-box">
        <h3>Edit Profile Info</h3>
        {editMode ? (
          <div className="edit-form">
            <label>Phone: <input name="phone" value={form.phone || ""} onChange={handleChange} /></label>
            <label>Gender: <input name="gender" value={form.gender || ""} onChange={handleChange} /></label>
            <label>Date of Birth: <input name="dob" value={form.dob || ""} onChange={handleChange} /></label>
            <label>Address: <input name="address" value={form.address || ""} onChange={handleChange} /></label>
            <label>Blood Group: <input name="bloodGroup" value={form.bloodGroup || ""} onChange={handleChange} /></label>
            <label>Emergency Contact: <input name="emergencyContact" value={form.emergencyContact || ""} onChange={handleChange} /></label>
            <label>Allergies: <input name="allergies" value={form.allergies || ""} onChange={handleChange} /></label>
            <label>Medications: <input name="medications" value={form.medications || ""} onChange={handleChange} /></label>
            <button onClick={handleSave}>Save Changes</button>
            <button onClick={() => setEditMode(false)}>Cancel</button>
            {message && <div style={{ color: message.includes("success") ? "green" : "red", marginTop: 10 }}>{message}</div>}
          </div>
        ) : (
          <button onClick={() => setEditMode(true)}>Edit Profile</button>
        )}
      </div>
    </div>
  );
}