import React, { useEffect, useState } from "react";
import "../Css_for_all/AdminAppointments.css";

const AdminAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        `${import.meta.env.VITE_DOCTOR_BACKEND_URL}/api/v1/admin/appointments`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      setAppointments(data.data || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      alert("Please provide a reason for cancellation");
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        `${import.meta.env.VITE_DOCTOR_BACKEND_URL}/api/v1/admin/appointments/${selectedAppointment._id}/cancel`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ cancelReason }),
        }
      );

      if (response.ok) {
        alert("Appointment cancelled successfully!");
        setSelectedAppointment(null);
        setCancelReason("");
        fetchAppointments();
      }
    } catch (error) {
      console.error("Error cancelling appointment:", error);
    }
  };

  if (loading) return <div className="admin-loading">Loading appointments...</div>;

  return (
    <div className="admin-appointments">
      <h1 className="page-title">Appointments Management</h1>
      <p className="page-subtitle">View and manage all appointments</p>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Doctor</th>
              <th>Patient</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((apt) => (
              <tr key={apt._id}>
                <td>{new Date(apt.appointmentDate).toLocaleDateString()}</td>
                <td>{apt.appointmentTime}</td>
                <td>{apt.doctorEmail}</td>
                <td>{apt.userEmail}</td>
                <td>
                  <span className={`status-badge status-${apt.status}`}>{apt.status}</span>
                </td>
                <td>
                  {apt.status !== "cancelled" && apt.status !== "completed" && (
                    <button
                      onClick={() => setSelectedAppointment(apt)}
                      className="btn-cancel"
                    >
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedAppointment && (
        <div className="modal-overlay" onClick={() => setSelectedAppointment(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Cancel Appointment</h2>
            <p>
              Appointment with <strong>{selectedAppointment.doctorEmail}</strong>
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation..."
              rows="4"
              className="cancel-textarea"
            />
            <div className="modal-actions">
              <button onClick={handleCancel} className="btn-confirm">
                Confirm Cancel
              </button>
              <button
                onClick={() => {
                  setSelectedAppointment(null);
                  setCancelReason("");
                }}
                className="btn-back"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAppointments;
