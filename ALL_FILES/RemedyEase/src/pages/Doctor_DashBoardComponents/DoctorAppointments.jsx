import React, { useEffect, useState } from "react";
import "../../Css_for_all/Appointments.css";
import LiveChat from "../../components/LiveChat";
import VideoCall from "../../components/VideoCall";
import PrescriptionUpload from "../../components/PrescriptionUpload";

const apiBase = import.meta.env.VITE_DOCTOR_BACKEND_URL || "";

// Helper for time formatting
function pad(num) { return num.toString().padStart(2, '0'); }

export default function DoctorAppointments() {
  const doctor = JSON.parse(localStorage.getItem("doctor"));
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Timeslot management states
  const [timeslotDate, setTimeslotDate] = useState("");
  const [customSlots, setCustomSlots] = useState([{ start: "", end: "" }]);
  const [savingSlots, setSavingSlots] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const [showLiveChat, setShowLiveChat] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [selectedAppointmentForLive, setSelectedAppointmentForLive] =
    useState(null);
  
  // Notification states
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationData, setNotificationData] = useState(null);
  const [notifiedIds, setNotifiedIds] = useState(new Set());

  // Patient-initiated session notifications
  const [patientNotifications, setPatientNotifications] = useState([]);
  const [showPatientNotification, setShowPatientNotification] = useState(false);
  const [currentPatientNotif, setCurrentPatientNotif] = useState(null);

  const fetchAppointments = () => {
    if (doctor?.email) {
      setLoading(true);
      fetch(`${apiBase}/api/v1/appointments/doctor/${doctor.email}`)
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

      console.log('🔍 Checking appointments at:', new Date().toLocaleTimeString());
      console.log('Current time in minutes:', currentTime);
      console.log('Current date:', currentDate);
      console.log('Total appointments:', appointments.length);

      appointments.forEach((appt) => {
        console.log('Checking appointment:', {
          id: appt._id,
          status: appt.status,
          date: appt.date,
          time: appt.time,
          patient: appt.userName
        });

        // Only check confirmed appointments
        if (!["confirmed", "approved", "accepted"].includes(appt.status?.toLowerCase())) {
          console.log('❌ Skipped - Status not confirmed:', appt.status);
          return;
        }

        // Skip if already notified
        if (notifiedIds.has(appt._id)) {
          console.log('❌ Skipped - Already notified');
          return;
        }

        const appointmentDate = new Date(appt.date).toISOString().split('T')[0];
        
        // Only check appointments for today
        if (appointmentDate !== currentDate) {
          console.log('❌ Skipped - Not today. Appointment date:', appointmentDate);
          return;
        }

        // Parse appointment time (HH:MM format)
        const [hours, minutes] = appt.time.split(':').map(Number);
        const appointmentTimeInMinutes = hours * 60 + minutes;

        // Calculate time difference in minutes
        const timeDiff = appointmentTimeInMinutes - currentTime;

        console.log('⏰ Time check:', {
          appointmentTime: appt.time,
          appointmentMinutes: appointmentTimeInMinutes,
          currentMinutes: currentTime,
          timeDiff: timeDiff,
          shouldNotify: timeDiff <= 10 && timeDiff >= -5
        });

        // Notify if appointment is within 10 minutes or has started
        if (timeDiff <= 10 && timeDiff >= -5) { // 10 min before to 5 min after
          console.log('✅ SHOWING NOTIFICATION for appointment:', appt.userName);
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

    // Check immediately and then every 30 seconds
    checkAppointmentTime();
    const interval = setInterval(checkAppointmentTime, 30000); // Every 30 seconds for faster response

    return () => clearInterval(interval);
  }, [appointments, notifiedIds]);

  // Poll for patient-initiated notifications (when patient starts live chat/video)
  useEffect(() => {
    if (!doctor?.email) return;

    const checkPatientNotifications = async () => {
      try {
        const res = await fetch(`${apiBase}/api/v1/live/notifications/${doctor.email}`);
        const data = await res.json();
        
        if (data.success && data.data.notifications.length > 0) {
          console.log('📢 Patient notifications received:', data.data.notifications);
          const latestNotif = data.data.notifications[0];
          
          // Show notification popup
          setCurrentPatientNotif(latestNotif);
          setShowPatientNotification(true);

          // Play notification sound
          try {
            const audio = new Audio('/notification.mp3');
            audio.play().catch(() => {});
          } catch (e) {}

          // Mark as read after showing
          await fetch(`${apiBase}/api/v1/live/notifications/read`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              doctorEmail: doctor.email,
              notificationId: latestNotif.id
            })
          });

          // Auto-hide after 30 seconds
          setTimeout(() => {
            setShowPatientNotification(false);
          }, 30000);
        }
      } catch (error) {
        console.error('Failed to fetch patient notifications:', error);
      }
    };

    // Check immediately and then every 10 seconds
    checkPatientNotifications();
    const interval = setInterval(checkPatientNotifications, 10000);

    return () => clearInterval(interval);
  }, [doctor?.email]);

  const handleConfirm = async (appointmentId) => {
    try {
      const res = await fetch(`${apiBase}/api/v1/appointments/confirm/${appointmentId}`, {
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

  const handleJoinPatientSession = (notif) => {
    // Find the appointment
    const appt = appointments.find(a => a._id === notif.appointmentId);
    if (!appt) return;

    if (notif.sessionType === 'chat') {
      startLiveChat(appt);
    } else if (notif.sessionType === 'video') {
      startVideoCall(appt);
    }
    
    setShowPatientNotification(false);
  };

  const startLiveChat = (appt) => {
    setSelectedAppointmentForLive(appt);
    setShowLiveChat(true);
    setShowNotification(false); // Hide notification when starting chat
  };

  const startVideoCall = async (appt) => {
    try {
      await fetch(`${apiBase}/api/v1/live/status/${appt._id}`, {
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

  // Add/remove custom slot fields
  const addSlotField = () => setCustomSlots([...customSlots, { start: "", end: "" }]);
  const removeSlotField = (idx) => setCustomSlots(customSlots.filter((_, i) => i !== idx));
  const updateSlotField = (idx, field, value) => {
    setCustomSlots(customSlots.map((slot, i) => i === idx ? { ...slot, [field]: value } : slot));
  };

  // Save timeslots to backend
  const saveTimeslots = async () => {
    if (!timeslotDate || customSlots.some(s => !s.start || !s.end)) {
      setSaveMsg("Please fill all slot fields and select a date.");
      return;
    }
    setSavingSlots(true);
    setSaveMsg("");
    try {
      const slots = customSlots.map(s => ({ time: `${s.start} - ${s.end}`, booked: false }));
      const res = await fetch(`${apiBase}/api/v1/doctors/timeslots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId: doctor._id, date: timeslotDate, slots }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveMsg("✅ Timeslots saved successfully!");
        setCustomSlots([{ start: "", end: "" }]);
        setTimeslotDate("");
      } else {
        setSaveMsg(data.message || "Failed to save timeslots.");
      }
    } catch (e) {
      console.error("Error saving timeslots:", e);
      setSaveMsg("Error saving timeslots.");
    }
    setSavingSlots(false);
  };

  if (loading) {
    return <div>Loading appointments...</div>;
  }

  if (!doctor || !doctor.email) {
    return <div>No doctor info found. Please log in as a doctor.</div>;
  }

  console.log('🎯 DoctorAppointments Component Rendered');
  console.log('📊 Doctor Info:', { email: doctor?.email, name: doctor?.fullname });
  console.log('⏰ Timeslot States:', { timeslotDate, customSlots, saveMsg });

  return (
    <div className="doctor-appointments-page" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Timeslot selection UI - DOCTOR CAN SET AVAILABLE TIME SLOTS HERE */}
      <div className="timeslot-section" style={{
        border: '3px solid #4caf50', 
        padding: '24px', 
        marginTop: '20px',
        marginBottom: '30px', 
        borderRadius: '12px',
        backgroundColor: '#f1f8f4',
        boxShadow: '0 6px 16px rgba(76, 175, 80, 0.2)',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: '-12px',
          left: '20px',
          backgroundColor: '#4caf50',
          color: 'white',
          padding: '4px 16px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          NEW FEATURE
        </div>
        <h3 style={{
          color: '#2e7d32', 
          marginBottom: '20px', 
          fontSize: '24px',
          fontWeight: '700',
          borderBottom: '2px solid #4caf50',
          paddingBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          🕒 Set Your Available Timeslots
          <span style={{fontSize: '14px', color: '#666', fontWeight: '400', marginLeft: 'auto'}}>
            (Patients will see and book these times)
          </span>
        </h3>
        <div style={{marginBottom: '16px'}}>
          <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>
            📅 Date: 
            <input 
              type="date" 
              value={timeslotDate} 
              onChange={e => setTimeslotDate(e.target.value)}
              style={{
                marginLeft: '10px',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #4caf50',
                fontSize: '14px'
              }}
            />
          </label>
        </div>
        <div style={{marginBottom: '12px'}}>
          <strong style={{display: 'block', marginBottom: '8px'}}>Time Slots:</strong>
          {customSlots.map((slot, idx) => (
            <div key={idx} style={{
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '10px',
              padding: '8px',
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #e0e0e0'
            }}>
              <span style={{marginRight: '8px', fontWeight: '600'}}>Slot {idx + 1}:</span>
              <input 
                type="time" 
                value={slot.start} 
                onChange={e => updateSlotField(idx, 'start', e.target.value)} 
                style={{
                  marginRight: '8px',
                  padding: '6px',
                  borderRadius: '4px',
                  border: '1px solid #ccc'
                }} 
              />
              <span style={{margin: '0 8px', fontWeight: 'bold'}}>to</span>
              <input 
                type="time" 
                value={slot.end} 
                onChange={e => updateSlotField(idx, 'end', e.target.value)} 
                style={{
                  marginRight: '12px',
                  padding: '6px',
                  borderRadius: '4px',
                  border: '1px solid #ccc'
                }} 
              />
              {customSlots.length > 1 && (
                <button 
                  onClick={() => removeSlotField(idx)} 
                  style={{
                    color: 'white',
                    backgroundColor: '#f44336',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  ❌ Remove
                </button>
              )}
            </div>
          ))}
        </div>
        <div style={{display: 'flex', gap: '10px', marginTop: '16px'}}>
          <button 
            onClick={addSlotField}
            style={{
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
          >
            ➕ Add Slot
          </button>
          <button 
            onClick={saveTimeslots} 
            disabled={savingSlots}
            style={{
              backgroundColor: savingSlots ? '#ccc' : '#4caf50',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: savingSlots ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
          >
            {savingSlots ? '⏳ Saving...' : '💾 Save Timeslots'}
          </button>
        </div>
        {saveMsg && (
          <div style={{
            marginTop: '12px', 
            padding: '10px', 
            borderRadius: '6px',
            backgroundColor: saveMsg.includes('✅') ? '#e8f5e9' : '#ffebee',
            color: saveMsg.includes('✅') ? '#2e7d32' : '#c62828',
            fontWeight: '600',
            border: `1px solid ${saveMsg.includes('✅') ? '#4caf50' : '#f44336'}`
          }}>
            {saveMsg}
          </div>
        )}
      </div>
      {/* Appointment Time Notification - Hidden during active call/chat */}
      {showNotification && notificationData && !showVideoCall && !showLiveChat && (
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

      {/* Patient-Initiated Session Notification - Hidden during active call/chat */}
      {showPatientNotification && currentPatientNotif && !showVideoCall && !showLiveChat && (
        <div className="patient-waiting-notification-popup">
          <div className="notification-header">
            <div className="notification-icon">👤</div>
            <h3>Patient Waiting!</h3>
            <button 
              className="notification-close"
              onClick={() => setShowPatientNotification(false)}
            >
              ×
            </button>
          </div>
          <div className="notification-body">
            <div className="notification-patient">
              <strong>Patient:</strong> {currentPatientNotif.patientName}
            </div>
            <div className="notification-time">
              <strong>Started:</strong> {new Date(currentPatientNotif.timestamp).toLocaleTimeString()}
            </div>
            <div className="notification-message">
              {currentPatientNotif.sessionType === 'video' 
                ? '📹 Patient is waiting in video call' 
                : '💬 Patient started live chat'}
            </div>
            <div className="notification-actions">
              <button
                className="notification-btn join-btn-notif"
                onClick={() => handleJoinPatientSession(currentPatientNotif)}
              >
                🚀 Join Now
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
