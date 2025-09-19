import React, { useEffect, useState } from "react";
import "../../Css_for_all/Appointments.css";

export default function DoctorAppointments() {
  const doctor = JSON.parse(localStorage.getItem("doctor")); // Adjust if you store doctor info differently
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (doctor?._id) {
      fetch(`/api/v1/appointments/doctor/${doctor._id}`)
        .then(res => res.json())
        .then(data => {
          setAppointments(data.data || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [doctor?._id]);

  const handleConfirm = async (appointmentId) => {
    await fetch(`/api/v1/appointments/confirm/${appointmentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" }
    });
    // Refresh appointments after confirming
    setLoading(true);
    fetch(`/api/v1/appointments/doctor/${doctor._id}`)
      .then(res => res.json())
      .then(data => {
        setAppointments(data.data || []);
        setLoading(false);
      });
  };

  return (
    <div className="doctor-appointments-page">
      <h2>Your Appointment Requests</h2>
      {loading ? (
        <div>Loading...</div>
      ) : appointments.length === 0 ? (
        <div>No appointments found.</div>
      ) : (
        <ul className="history-list">
          {appointments.map(appt => (
            <li key={appt._id} className="history-item">
              <strong>Patient:</strong> {appt.userName}<br />
              <strong>Date:</strong> {appt.date}<br />
              <strong>Time:</strong> {appt.time}<br />
              <strong>Status:</strong> {appt.status}
              {appt.status === "pending" && (
                <button
                  className="book-btn"
                  style={{ marginTop: 10 }}
                  onClick={() => handleConfirm(appt._id)}
                >
                  Confirm Appointment
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}