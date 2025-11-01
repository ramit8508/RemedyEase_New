import React, { useEffect, useState, useRef } from "react";
// Use the correct backend URL in production
const apiBase = import.meta.env.VITE_DOCTOR_BACKEND_URL || "";
import { useLocation, useNavigate } from "react-router-dom";
import "../../Css_for_all/Appointments.css";
import LiveChat from "../../components/LiveChat";
import VideoCall from "../../components/VideoCall";
import PrescriptionView from "../../components/PrescriptionView";


// Helper for time formatting
function pad(num) { return num.toString().padStart(2, '0'); }

export default function Appointments() {
  const location = useLocation();
  const navigate = useNavigate();
  const doctorFromState = location.state?.doctor;
  const user = JSON.parse(localStorage.getItem("user"));
  
  // Ref to track last booking time to prevent polling interference
  const lastBookingTimeRef = useRef(null);

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
  const [selectedAppointmentForLive, setSelectedAppointmentForLive] = useState(null);
  const [justConfirmedIds, setJustConfirmedIds] = useState(new Set());

  // Timeslot states
  const [availableTimeslots, setAvailableTimeslots] = useState([]);
  const [timeslotLoading, setTimeslotLoading] = useState(false);

  // Fetch available timeslots for selected doctor and date
  useEffect(() => {
    if (!selectedDoctor || !date) {
      setAvailableTimeslots([]);
      return;
    }
    setTimeslotLoading(true);
    fetch(`${apiBase}/api/v1/doctors/timeslots?doctorId=${selectedDoctor._id}&date=${date}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.length > 0) {
          setAvailableTimeslots(data.data[0].slots || []);
        } else {
          setAvailableTimeslots([]);
        }
      })
      .catch(() => setAvailableTimeslots([]))
      .finally(() => setTimeslotLoading(false));
  }, [selectedDoctor, date, apiBase]);

  const startLiveChat = async (appt) => {
    try {
      // Notify doctor that patient is starting live chat
      await fetch(`${apiBase}/api/v1/live/notify-doctor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: appt._id,
          doctorEmail: appt.doctorEmail,
          patientName: user.fullname || user.email,
          sessionType: "chat",
          timestamp: new Date().toISOString()
        }),
      });
    } catch (error) {
      console.error("Failed to notify doctor:", error);
    }
    setSelectedAppointmentForLive(appt);
    setShowLiveChat(true);
  };

  const startVideoCall = async (appt) => {
    try {
      await fetch(`${apiBase}/api/v1/live/status/${appt._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.email,
          userType: "patient",
          onlineStatus: true,
        }),
      });

      // Notify doctor that patient is starting video call
      await fetch(`${apiBase}/api/v1/live/notify-doctor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: appt._id,
          doctorEmail: appt.doctorEmail,
          patientName: user.fullname || user.email,
          sessionType: "video",
          timestamp: new Date().toISOString()
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

  const fetchHistoryAndDoctors = (silent = false) => {
    if (user?.email) {
      // Skip fetch if we just booked (within last 5 seconds)
      if (lastBookingTimeRef.current && Date.now() - lastBookingTimeRef.current < 5000) {
        console.log('[HISTORY] Skipping fetch - recent booking');
        return;
      }
      
      if (!silent) setLoadingHistory(true);
      console.log('[HISTORY] Fetching appointments for user:', user.email);
      console.log('[HISTORY] Full user object:', user);
      console.log('[HISTORY] API URL:', `${apiBase}/api/v1/appointments/user/${user.email}`);
  fetch(`${apiBase}/api/v1/appointments/user/${user.email}`)
        .then((res) => res.json())
        .then((data) => {
          console.log('[HISTORY] Response received:', data);
          if (data.success) {
            console.log('[HISTORY] Setting history with', data.data?.length || 0, 'appointments');
            
            // Don't clear history if backend returns empty but we have appointments in state
            setHistory(prevHistory => {
              if (data.data && data.data.length > 0) {
                return data.data;
              } else if (prevHistory.length > 0) {
                console.log('[HISTORY] Backend returned empty, keeping current state');
                return prevHistory;
              } else {
                return [];
              }
            });
          } else {
            console.error('[HISTORY] Response not successful:', data);
          }
        })
        .catch((err) => {
          console.error("[HISTORY] Failed to fetch history:", err);
          // Don't clear history on error
        })
        .finally(() => {
          if (!silent) setLoadingHistory(false);
        });
    }
    if (!doctorFromState) {
      setLoadingDoctors(true);
  fetch(`${apiBase}/api/v1/doctors/all`)
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
  }, [user?.email, doctorFromState]);

  // Separate effect for polling to avoid infinite loop
  useEffect(() => {
    if (!user?.email) return;

    // Set up polling to check for appointment updates every 10 seconds
    const pollingInterval = setInterval(() => {
      // Skip polling if we just booked an appointment (within last 5 seconds)
      if (lastBookingTimeRef.current && Date.now() - lastBookingTimeRef.current < 5000) {
        console.log('[POLLING] Skipping poll - recent booking');
        return;
      }
      
      // Silently fetch updates without showing loading state
      console.log('[POLLING] Checking for appointment updates...');
      fetch(`${apiBase}/api/v1/appointments/user/${user.email}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            const newHistory = data.data || [];
            
            setHistory((prevHistory) => {
              // If we have no previous history, just use new data
              if (prevHistory.length === 0) {
                return newHistory;
              }
              
              // Check for newly confirmed appointments
              newHistory.forEach((newAppt) => {
                const oldAppt = prevHistory.find((h) => h._id === newAppt._id);
                
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
              
              // Only update history if backend data has all our appointments
              // Check if all prevHistory appointments exist in newHistory
              const allExistInBackend = prevHistory.every(oldAppt => 
                newHistory.some(newAppt => newAppt._id === oldAppt._id)
              );
              
              if (allExistInBackend) {
                console.log('[POLLING] Backend has all appointments, updating history');
                return newHistory;
              } else {
                console.log('[POLLING] Backend missing some appointments, keeping current state');
                // Merge: keep existing appointments and add any new ones from backend
                const merged = [...prevHistory];
                newHistory.forEach(newAppt => {
                  if (!merged.find(m => m._id === newAppt._id)) {
                    merged.push(newAppt);
                  }
                });
                return merged;
              }
            });
          }
        })
        .catch((err) => console.error("Polling error:", err));
    }, 10000); // Poll every 10 seconds

    // Cleanup interval on unmount
    return () => clearInterval(pollingInterval);
  }, [user?.email, apiBase]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDoctor) {
      setMessage("Please select a doctor.");
      setMessageType("error");
      return;
    }
    
    // Check if selected timeslot is booked
    if (availableTimeslots.length > 0) {
      const selectedSlot = availableTimeslots.find(slot => slot.time === time);
      if (selectedSlot && selectedSlot.booked) {
        setMessage("⚠️ This time slot is already booked. Please select another time.");
        setMessageType("error");
        return;
      }
    }
    
    try {
      const bookingData = {
        doctorEmail: selectedDoctor.email,
        doctorName: selectedDoctor.fullname,
        doctorId: selectedDoctor._id,
        userEmail: user.email,
        userName: user.fullname,
        date,
        time,
        symptoms,
      };
      console.log('[BOOKING] Sending booking data:', bookingData);
      
      const res = await fetch(`${apiBase}/api/v1/appointments/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });
      const data = await res.json();
      console.log('[BOOKING] Response:', data);
      
      if (res.ok && data.success) {
        // Record booking time to prevent polling interference
        lastBookingTimeRef.current = Date.now();
        
        setMessage(
          `✅ Booking request sent to Dr. ${selectedDoctor.fullname}. Waiting for confirmation.`
        );
        setMessageType("pending");
        
        // Add the new appointment to history immediately for instant feedback
        if (data.data && data.data._id) {
          const newAppointment = {
            _id: data.data._id,
            doctorName: selectedDoctor.fullname,
            doctorEmail: selectedDoctor.email,
            userEmail: user.email,
            userName: user.fullname,
            date: data.data.date,
            time: data.data.time,
            symptoms: data.data.symptoms,
            status: data.data.status || "pending"
          };
          console.log('[BOOKING] Adding appointment to history:', newAppointment);
          setHistory(prev => [newAppointment, ...prev]);
        }
        
        // Clear form
        setDate("");
        setTime("");
        setSymptoms("");
        setAvailableTimeslots([]);
        
        // Refresh from backend after protection window expires
        setTimeout(() => {
          console.log('[BOOKING] Syncing with backend...');
          lastBookingTimeRef.current = null; // Clear protection
          fetchHistoryAndDoctors(true); // Silent refresh
        }, 5500); // After the 5 second protection window
      } else {
        setMessage(data.message || "Booking failed.");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Booking error:", error);
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
            
            {/* Timeslot availability indicator */}
            {date && availableTimeslots.length > 0 && (
              <div style={{
                padding: '12px',
                marginBottom: '16px',
                borderRadius: '8px',
                backgroundColor: '#e3f2fd',
                border: '1px solid #2196f3',
                fontSize: '14px'
              }}>
                <strong>📊 Timeslot Availability:</strong>
                <div style={{ marginTop: '8px', display: 'flex', gap: '16px' }}>
                  <span style={{ color: '#4caf50', fontWeight: '600' }}>
                    ✅ Available: {availableTimeslots.filter(s => !s.booked).length}
                  </span>
                  <span style={{ color: '#f44336', fontWeight: '600' }}>
                    ❌ Booked: {availableTimeslots.filter(s => s.booked).length}
                  </span>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="appointment-content">
              <label>
                Date:{" "}
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </label>
              <label>
                Time:{" "}
                {timeslotLoading ? (
                  <div style={{ padding: "10px", textAlign: "center" }}>
                    <span>⏳ Loading timeslots...</span>
                  </div>
                ) : availableTimeslots.length > 0 ? (
                  <select 
                    value={time} 
                    onChange={(e) => setTime(e.target.value)} 
                    required
                    style={{ width: "100%", padding: "10px", borderRadius: "7px", border: "1px solid #b2dfdb" }}
                  >
                    <option value="">Select a timeslot...</option>
                    {availableTimeslots.map((slot, idx) => (
                      <option 
                        key={idx} 
                        value={slot.time} 
                        disabled={slot.booked}
                        style={{
                          color: slot.booked ? '#999' : '#000',
                          backgroundColor: slot.booked ? '#f5f5f5' : '#fff'
                        }}
                      >
                        {slot.time} {slot.booked ? '❌ (Already Booked)' : '✅ (Available)'}
                      </option>
                    ))}
                  </select>
                ) : date ? (
                  <div style={{ padding: "10px", color: "#666" }}>
                    <span>⚠️ No timeslots available for this date. Please select another date or use custom time:</span>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      required
                      style={{ width: "100%", marginTop: "10px" }}
                    />
                  </div>
                ) : (
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  />
                )}
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
                      <button className="auto-update-button" disabled style={{
                        fontSize: '11px',
                        padding: '4px 10px',
                        backgroundColor: '#e3f2fd',
                        color: '#1976d2',
                        border: '1px solid #90caf9',
                        borderRadius: '12px',
                        cursor: 'default',
                        fontWeight: '500',
                        marginTop: '8px'
                      }}>
                        ✓ Auto-Update
                      </button>
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
