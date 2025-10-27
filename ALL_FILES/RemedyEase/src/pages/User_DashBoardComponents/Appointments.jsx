import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../Css_for_all/Appointments.css";
import LiveChat from "../../components/LiveChat";
import VideoCall from "../../components/VideoCall";
import PrescriptionView from "../../components/PrescriptionView";

export default function Appointments() {
  const location = useLocation();
  const navigate = useNavigate();
  const doctorFromState = location.state?.doctor;
  const user = JSON.parse(localStorage.getItem("user"));

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(doctorFromState || null);
  const [loadingDoctors, setLoadingDoctors] = useState(!doctorFromState);

  const [showLiveChat, setShowLiveChat] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [selectedAppointmentForLive, setSelectedAppointmentForLive] =
    useState(null);
  const [justConfirmedIds, setJustConfirmedIds] = useState(new Set());

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
          userId: user.email,
          userType: "patient",
          onlineStatus: true,
        }),
      });
      setSelectedAppointmentForLive(appt);
      setShowVideoCall(true);
    } catch (error) {
      console.error("Error starting video call:", error);
      setMessage("Failed to start video call.");
      setMessageType("error");
    }
  };

  const closeLiveFeatures = () => {
    setShowLiveChat(false);
    setShowVideoCall(false);
    setSelectedAppointmentForLive(null);
  };

  const fetchHistoryAndDoctors = () => {
    if (user?.email) {
      setLoadingHistory(true);
      fetch(`/api/v1/appointments/user/${user.email}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setHistory(data.data || []);
          }
        })
        .catch((err) => console.error("Failed to fetch history:", err))
        .finally(() => setLoadingHistory(false));
    }
    if (!doctorFromState) {
      setLoadingDoctors(true);
      fetch("/api/v1/doctors/all")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setAvailableDoctors(data.data || []);
          }
        })
        .catch((err) => console.error("Failed to fetch doctors:", err))
        .finally(() => setLoadingDoctors(false));
    }
  };

  useEffect(() => {
    fetchHistoryAndDoctors();

    // Set up polling to check for appointment updates every 5 seconds
    const pollingInterval = setInterval(() => {
      if (user?.email) {
        // Silently fetch updates without showing loading state
        fetch(`/api/v1/appointments/user/${user.email}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              const newHistory = data.data || [];
              
              // Check for newly confirmed appointments
              newHistory.forEach((newAppt) => {
                const oldAppt = history.find((h) => h._id === newAppt._id);
                
                // If appointment was pending and is now confirmed
                if (
                  oldAppt &&
                  oldAppt.status?.toLowerCase() === "pending" &&
                  ["confirmed", "approved", "accepted"].includes(
                    newAppt.status?.toLowerCase()
                  )
                ) {
                  // Mark this appointment as just confirmed
                  setJustConfirmedIds((prev) => new Set(prev).add(newAppt._id));
                  
                  // Show success message
                  setMessage(
                    `✅ Dr. ${newAppt.doctorName} confirmed your appointment! Live features are now available.`
                  );
                  setMessageType("success");
                  
                  // Auto-hide message after 5 seconds
                  setTimeout(() => {
                    setMessage("");
                  }, 5000);
                  
                  // Remove the highlight after 10 seconds
                  setTimeout(() => {
                    setJustConfirmedIds((prev) => {
                      const newSet = new Set(prev);
                      newSet.delete(newAppt._id);
                      return newSet;
                    });
                  }, 10000);
                }
              });
              
              setHistory(newHistory);
            }
          })
          .catch((err) => console.error("Polling error:", err));
      }
    }, 5000); // Poll every 5 seconds

    // Cleanup interval on unmount
    return () => clearInterval(pollingInterval);
  }, [user?.email, doctorFromState, history]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDoctor) {
      setMessage("Please select a doctor.");
      setMessageType("error");
      return;
    }
    try {
      const res = await fetch("/api/v1/appointments/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorEmail: selectedDoctor.email,
          doctorName: selectedDoctor.fullname,
          userEmail: user.email,
          userName: user.fullname,
          date,
          time,
          symptoms,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(
          `Booking request sent to Dr. ${selectedDoctor.fullname}. Waiting for confirmation.`
        );
        setMessageType("pending");
        setDate("");
        setTime("");
        setSymptoms("");
        fetchHistoryAndDoctors(); // Refresh history after booking
      } else {
        setMessage(data.message || "Booking failed.");
        setMessageType("error");
      }
    } catch {
      setMessage("Something went wrong.");
      setMessageType("error");
    }
  };

  if (!doctorFromState && loadingDoctors) {
    return <div>Loading doctors...</div>;
  }

  return (
    <>
      <div className="appointment-page">
        <h1 className="appointment-title">Book a New Appointment</h1>

        {!doctorFromState && (
          <div
            style={{
              marginBottom: "20px",
              padding: "15px",
              backgroundColor: "#f9f9f9",
              borderRadius: "8px",
            }}
          >
            <h3>Select a Doctor</h3>
            <select
              value={selectedDoctor?.email || ""}
              onChange={(e) => {
                const doc = availableDoctors.find(
                  (d) => d.email === e.target.value
                );
                setSelectedDoctor(doc);
              }}
              style={{ width: "100%", padding: "10px", borderRadius: "5px" }}
            >
              <option value="">Choose a doctor...</option>
              {availableDoctors.map((doc) => (
                <option key={doc._id} value={doc.email}>
                  Dr. {doc.fullname} - {doc.specialization}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedDoctor ? (
          <>
            <h2>Book Appointment with Dr. {selectedDoctor.fullname}</h2>
            <form onSubmit={handleSubmit} className="appointment-content">
              <label>
                Date:{" "}
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </label>
              <label>
                Time:{" "}
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </label>
              <label>
                Symptoms/Reason for visit:{" "}
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Describe your symptoms..."
                  required
                />
              </label>
              <button type="submit" className="book-btn">
                Book Appointment
              </button>
            </form>
          </>
        ) : (
          <p style={{ textAlign: "center", padding: "20px" }}>
            Please select a doctor to book an appointment.
          </p>
        )}
        {message && <div className={`message ${messageType}`}>{message}</div>}
      </div>

      <div className="history">
        <h2 className="history-title">Your Appointments History</h2>
        {loadingHistory ? (
          <div>Loading your appointments...</div>
        ) : history.length === 0 ? (
          <div>No appointments found.</div>
        ) : (
          <ul className="history-list">
            {history.map((appt) => (
              <li 
                key={appt._id} 
                className={`history-item ${
                  justConfirmedIds.has(appt._id) ? 'just-confirmed' : ''
                }`}
              >
                <div style={{ marginBottom: "8px" }}>
                  <strong>Dr. {appt.doctorName}</strong>
                </div>
                <div>
                  <strong>Date:</strong>{" "}
                  {new Date(appt.date).toLocaleDateString()} at {appt.time}
                </div>

                {/* --- THIS IS THE UPDATED SECTION --- */}
                {appt.status?.toLowerCase() === "pending" ? (
                  <div className="pending-confirmation-card">
                    <div className="pending-icon">⏳</div>
                    <div className="pending-text">
                      <strong>Waiting for Confirmation</strong>
                      <span>The doctor will review your request shortly.</span>
                      <span className="auto-update-badge">🔄 Auto-updating...</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <strong>Status:</strong>{" "}
                      <span className="status-confirmed">
                        {justConfirmedIds.has(appt._id) && "🎉 "}
                        {appt.status}
                        {justConfirmedIds.has(appt._id) && " (Just Confirmed!)"}
                      </span>
                    </div>
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
                        
                        {/* Prescription View Section */}
                        <PrescriptionView appointmentId={appt._id} />
                      </div>
                    )}
                  </>
                )}
                {/* --- END OF UPDATED SECTION --- */}
              </li>
            ))}
          </ul>
        )}
      </div>

      {showLiveChat && selectedAppointmentForLive && (
        <div className="modal-overlay">
          <div className="modal-content">
            <LiveChat
              appointmentId={selectedAppointmentForLive._id}
              currentUser={{ id: user.email, name: user.fullname }}
              userType="patient"
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
              currentUser={{ id: user.email, name: user.fullname }}
              userType="patient"
              onClose={closeLiveFeatures}
            />
          </div>
        </div>
      )}
    </>
  );
}
