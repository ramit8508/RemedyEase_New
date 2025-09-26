import React, { useEffect, useState } from "react";
import "../../Css_for_all/Appointments.css";
import LiveChat from "../../components/LiveChat";
import VideoCall from "../../components/VideoCall";

export default function DoctorAppointments() {
  const doctor = JSON.parse(localStorage.getItem("doctor"));
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showLiveChat, setShowLiveChat] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [selectedAppointmentForLive, setSelectedAppointmentForLive] =
    useState(null);

  const fetchAppointments = () => {
    if (doctor?.email) {
      setLoading(true);
      fetch(`/api/v1/appointments/doctor/${doctor.email}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setAppointments(data.data || []);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [doctor?.email]);

  const handleConfirm = async (appointmentId) => {
    try {
      const res = await fetch(`/api/v1/appointments/confirm/${appointmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorEmail: doctor.email }),
      });
      if (res.ok) {
        fetchAppointments();
      }
    } catch (error) {
      console.error("Failed to confirm appointment", error);
    }
  };

  const startLiveChat = (appt) => {
    setSelectedAppointmentForLive(appt);
    setShowLiveChat(true);
  };

  const startVideoCall = async (appt) => {
    try {
      await fetch(`/api/v1/live/status/${appt._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: doctor.email,
          userType: "doctor",
          onlineStatus: true,
        }),
      });
      setSelectedAppointmentForLive(appt);
      setShowVideoCall(true);
    } catch (error) {
      console.error("Error starting video call:", error);
    }
  };

  const closeLiveFeatures = () => {
    setShowLiveChat(false);
    setShowVideoCall(false);
    setSelectedAppointmentForLive(null);
  };

  if (loading) {
    return <div>Loading appointments...</div>;
  }

  if (!doctor || !doctor.email) {
    return <div>No doctor info found. Please log in as a doctor.</div>;
  }

  return (
    <div className="doctor-appointments-page">
      <h2>Your Appointment Requests</h2>
      {appointments.length === 0 ? (
        <div>No appointments found.</div>
      ) : (
        <ul className="history-list">
          {appointments.map((appt) => (
            <li
              key={appt._id}
              className="history-item"
              style={{
                backgroundColor: ["confirmed", "approved", "accepted"].includes(
                  appt.status?.toLowerCase()
                )
                  ? "#e8f5e8"
                  : "#fff3e0",
                border: `2px solid ${
                  ["confirmed", "approved", "accepted"].includes(
                    appt.status?.toLowerCase()
                  )
                    ? "#4caf50"
                    : "#ff9800"
                }`,
              }}
            >
              <div style={{ marginBottom: "8px" }}>
                <strong style={{ fontSize: "18px" }}>
                  Patient: {appt.userName}
                </strong>
              </div>
              <div style={{ marginBottom: "5px" }}>
                <strong>📅 Date:</strong>{" "}
                {new Date(appt.date).toLocaleDateString()}
              </div>
              <div style={{ marginBottom: "5px" }}>
                <strong>🕒 Time:</strong> {appt.time}
              </div>
              <div style={{ marginBottom: "10px" }}>
                <strong>Status:</strong>{" "}
                <span
                  style={{
                    color: ["confirmed", "approved", "accepted"].includes(
                      appt.status?.toLowerCase()
                    )
                      ? "#4caf50"
                      : "#ff9800",
                    fontWeight: "bold",
                  }}
                >
                  {["confirmed", "approved", "accepted"].includes(
                    appt.status?.toLowerCase()
                  )
                    ? "✅ Confirmed"
                    : "⏳ Pending"}
                </span>
              </div>

              {appt.status === "pending" && (
                <button
                  className="book-btn"
                  style={{ marginTop: 10 }}
                  onClick={() => handleConfirm(appt._id)}
                >
                  Confirm Appointment
                </button>
              )}

              {/* --- THIS IS THE UPDATED SECTION --- */}
              {/* It now directly shows the buttons for any confirmed appointment */}
              {["confirmed", "approved", "accepted"].includes(
                appt.status?.toLowerCase()
              ) && (
                <div className="live-features-section">
                  <h4>Live Features</h4>
                  <div className="live-buttons-container">
                    <button
                      className="live-feature-btn chat-btn"
                      onClick={() => startLiveChat(appt)}
                    >
                      💬 Live Chat
                    </button>
                    <button
                      className="live-feature-btn video-btn"
                      onClick={() => startVideoCall(appt)}
                    >
                      📹 Video Call
                    </button>
                  </div>
                </div>
              )}
              {/* --- END OF UPDATED SECTION --- */}
            </li>
          ))}
        </ul>
      )}

      {showLiveChat && selectedAppointmentForLive && (
        <div className="modal-overlay">
          <div className="modal-content">
            <LiveChat
              appointmentId={selectedAppointmentForLive._id}
              currentUser={{ id: doctor.email, name: doctor.fullname }}
              userType="doctor"
              onClose={closeLiveFeatures}
            />
          </div>
        </div>
      )}

      {showVideoCall && selectedAppointmentForLive && (
        <div className="modal-overlay video-overlay">
          <div className="modal-content video-modal">
            <VideoCall
              appointmentId={selectedAppointmentForLive._id}
              currentUser={{ id: doctor.email, name: doctor.fullname }}
              userType="doctor"
              onClose={closeLiveFeatures}
            />
          </div>
        </div>
      )}
    </div>
  );
}
