import React, { useEffect, useState } from "react";
import "../Css_for_all/DoctorsManagement.css";

const DoctorsManagement = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        `${import.meta.env.VITE_DOCTOR_BACKEND_URL}/api/v1/admin/doctors`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      setDoctors(data.data || []);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBlock = async (doctorId, currentStatus) => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        `${import.meta.env.VITE_DOCTOR_BACKEND_URL}/api/v1/admin/doctors/${doctorId}/block`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        alert(`Doctor ${currentStatus ? "unblocked" : "blocked"} successfully!`);
        fetchDoctors();
      }
    } catch (error) {
      console.error("Error toggling doctor block:", error);
    }
  };

  const filteredDoctors = doctors.filter((doc) => {
    if (filter === "all") return true;
    return doc.approvalStatus === filter;
  });

  if (loading) return <div className="admin-loading">Loading doctors...</div>;

  return (
    <div className="doctors-management">
      <h1 className="page-title">Doctors Management</h1>
      <p className="page-subtitle">Manage all registered doctors</p>

      <div className="filter-buttons">
        <button
          onClick={() => setFilter("all")}
          className={`filter-btn ${filter === "all" ? "active" : ""}`}
        >
          All ({doctors.length})
        </button>
        <button
          onClick={() => setFilter("approved")}
          className={`filter-btn ${filter === "approved" ? "active" : ""}`}
        >
          Approved ({doctors.filter((d) => d.approvalStatus === "approved").length})
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`filter-btn ${filter === "pending" ? "active" : ""}`}
        >
          Pending ({doctors.filter((d) => d.approvalStatus === "pending").length})
        </button>
        <button
          onClick={() => setFilter("rejected")}
          className={`filter-btn ${filter === "rejected" ? "active" : ""}`}
        >
          Rejected ({doctors.filter((d) => d.approvalStatus === "rejected").length})
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Avatar</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Specialization</th>
              <th>Approval Status</th>
              <th>Block Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDoctors.map((doctor) => (
              <tr key={doctor._id}>
                <td>
                  <img
                    src={doctor.avatar || "/default-doctor.png"}
                    alt={doctor.fullname}
                    className="table-avatar"
                  />
                </td>
                <td>{doctor.fullname}</td>
                <td>{doctor.email}</td>
                <td>{doctor.specialization}</td>
                <td>
                  <span className={`status-badge approval-${doctor.approvalStatus}`}>
                    {doctor.approvalStatus}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${doctor.isBlocked ? "blocked" : "active"}`}>
                    {doctor.isBlocked ? "Blocked" : "Active"}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => toggleBlock(doctor._id, doctor.isBlocked)}
                    className={`btn-toggle ${doctor.isBlocked ? "btn-unblock" : "btn-block"}`}
                  >
                    {doctor.isBlocked ? "Unblock" : "Block"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DoctorsManagement;
