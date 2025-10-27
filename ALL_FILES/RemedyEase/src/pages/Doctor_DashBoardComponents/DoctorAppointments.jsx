import React, { useEffect, useState } from "react";
import "../../Css_for_all/Appointments.css";
import LiveChat from "../../components/LiveChat";
import VideoCall from "../../components/VideoCall";
import PrescriptionUpload from "../../components/PrescriptionUpload";

export default function DoctorAppointments() {
  const doctor = JSON.parse(localStorage.getItem("doctor"));
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showLiveChat, setShowLiveChat] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [selectedAppointmentForLive, setSelectedAppointmentForLive] =
    useState(null);
  
  // Notification states
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationData, setNotificationData] = useState(null);
  const [notifiedIds, setNotifiedIds] = useState(new Set());

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

  // Check for upcoming appointments every minute
  useEffect(() => {
    const checkAppointmentTime = () => {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes
      const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format

      appointments.forEach((appt) => {
        // Only check confirmed appointments
        if (!["confirmed", "approved", "accepted"].includes(appt.status?.toLowerCase())) {
          return;
        }

        // Skip if already notified
        if (notifiedIds.has(appt._id)) {
          return;
        }

        const appointmentDate = new Date(appt.date).toISOString().split('T')[0];
        
        // Only check appointments for today
        if (appointmentDate !== currentDate) {
          return;
        }

        // Parse appointment time (HH:MM format)
        const [hours, minutes] = appt.time.split(':').map(Number);
        const appointmentTimeInMinutes = hours * 60 + minutes;

        // Calculate time difference in minutes
        const timeDiff = appointmentTimeInMinutes - currentTime;

        // Notify if appointment is within 10 minutes or has started
        if (timeDiff <= 10 && timeDiff >= -5) { // 10 min before to 5 min after
          setNotifiedIds((prev) => new Set(prev).add(appt._id));
          setNotificationData(appt);
          setShowNotification(true);
          
          // Play notification sound (optional)
          try {
            const audio = new Audio('/notification.mp3');
            audio.play().catch(() => {}); // Ignore if no sound file
          } catch (e) {}

          // Auto-hide notification after 30 seconds
          setTimeout(() => {
            setShowNotification(false);
          }, 30000);
        }
      });
    };

    // Check immediately and then every minute
    checkAppointmentTime();
    const interval = setInterval(checkAppointmentTime, 60000); // Every 60 seconds

    return () => clearInterval(interval);
  }, [appointments, notifiedIds]);

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
    setShowNotification(false); // Hide notification when starting chat
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
      setShowNotification(false); // Hide notification when starting video
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
      {/* Appointment Time Notification */}
      {showNotification && notificationData && (
        <div className="appointment-notification-popup">
          <div className="notification-header">
            <div className="notification-icon">🔔</div>
            <h3>Appointment Time!</h3>
            <button 
              className="notification-close"
              onClick={() => setShowNotification(false)}
            >
              ×
            </button>
          </div>
          <div className="notification-body">
            <div className="notification-patient">
              <strong>Patient:</strong> {notificationData.userName}
            </div>
            <div className="notification-time">
              <strong>Time:</strong> {notificationData.time}
            </div>
            <div className="notification-actions">
              <button
                className="notification-btn video-btn-notif"
                onClick={() => startVideoCall(notificationData)}
              >
                📹 Start Video Call
              </button>
              <button
                className="notification-btn chat-btn-notif"
                onClick={() => startLiveChat(notificationData)}
              >
                💬 Start Chat
              </button>
            </div>
          </div>
        </div>
      )}

      <h2>Your Appointment Requests</h2>
      {appointments.length === 0 ? (
        <div>No appointments found.</div>
      ) : (
        <ul className="history-list">
          {appointments.map((appt) => {
            // Check if appointment is happening now or soon
            const now = new Date();
            const currentTime = now.getHours() * 60 + now.getMinutes();
            const currentDate = now.toISOString().split('T')[0];
            const appointmentDate = new Date(appt.date).toISOString().split('T')[0];
            const [hours, minutes] = appt.time.split(':').map(Number);
            const appointmentTimeInMinutes = hours * 60 + minutes;
            const timeDiff = appointmentTimeInMinutes - currentTime;
            const isNow = appointmentDate === currentDate && timeDiff <= 10 && timeDiff >= -30;

            return (
              <li
                key={appt._id}
                className={`history-item ${isNow ? 'appointment-now' : ''}`}
                style={{
                  backgroundColor: ["confirmed", "approved", "accepted"].includes(
                    appt.status?.toLowerCase()
                  )
                    ? isNow ? "#e3f2fd" : "#e8f5e8"
                    : "#fff3e0",
                  border: `2px solid ${
                    isNow ? "#2196f3" :
                    ["confirmed", "approved", "accepted"].includes(
                      appt.status?.toLowerCase()
                    )
                      ? "#4caf50"
                      : "#ff9800"
                  }`,
                }}
              >
                {isNow && (
                  <div className="appointment-now-badge">
                    🔴 LIVE - Appointment Time!
                  </div>
                )}
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
                    
                    {/* Prescription Upload Section */}
                    <PrescriptionUpload
                      appointmentId={appt._id}
                      doctorEmail={doctor.email}
                      onUploadSuccess={() => fetchAppointments()}
                    />
                  </div>
                )}
                
              </li>
            );
          })}
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
