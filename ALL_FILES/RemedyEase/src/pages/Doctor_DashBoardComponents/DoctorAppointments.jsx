import React, { useEffect, useState } from "react";
import "../../Css_for_all/Appointments.css";
import LiveChat from "../../components/LiveChat";
import VideoCall from "../../components/VideoCall";
import { getApiUrl, API_CONFIG } from "../../config/api";

export default function DoctorAppointments() {
  const doctor = JSON.parse(localStorage.getItem("doctor")); // doctor.email must exist
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Live features states
  const [showLiveChat, setShowLiveChat] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [selectedAppointmentForLive, setSelectedAppointmentForLive] = useState(null);

  // Helper function to check if appointment is in live time window
  const isAppointmentLive = (appt) => {
    if (!['confirmed', 'approved', 'accepted'].includes(appt.status?.toLowerCase())) {
      return false;
    }

    const now = new Date();
    console.log('🕒 Doctor checking live status for appointment:', {
      appointmentDate: appt.date,
      appointmentTime: appt.time,
      currentTime: now.toISOString(),
      status: appt.status
    });

    // Production time-based logic: Live features available 15 minutes before appointment
    const appointmentDateTime = new Date(`${appt.date} ${appt.time}`);
    console.log('📅 Parsed appointment datetime:', appointmentDateTime);
    
    const startTime = new Date(appointmentDateTime.getTime() - 15 * 60 * 1000); // 15 min before
    const endTime = new Date(appointmentDateTime.getTime() + 60 * 60 * 1000); // 60 min after
    const isInTimeWindow = now >= startTime && now <= endTime;
    
    console.log('⏰ Time window check:', {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      isInWindow: isInTimeWindow
    });
    
    return isInTimeWindow;
  };

  // Format time remaining for live features
  const getTimeUntilLive = (appt) => {
    if (!['confirmed', 'approved', 'accepted'].includes(appt.status?.toLowerCase())) {
      return 'Waiting for confirmation';
    }
    
    const now = new Date();
    const appointmentDateTime = new Date(`${appt.date} ${appt.time}`);
    const startTime = new Date(appointmentDateTime.getTime() - 15 * 60 * 1000);
    
    if (now < startTime) {
      const diff = startTime - now;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0) {
        return `Available in ${hours}h ${minutes}m`;
      } else {
        return `Available in ${minutes}m`;
      }
    }
    
    return 'Available Now';
  };

  // Start live chat
  const startLiveChat = (appt) => {
    setSelectedAppointmentForLive(appt);
    setShowLiveChat(true);
  };

  // Start video call
  const startVideoCall = async (appt) => {
    try {
      // Update appointment status to indicate call starting
      await fetch(getApiUrl(`${API_CONFIG.ENDPOINTS.LIVE}/status/${appt._id}`, 'DOCTOR'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: doctor.email,
          userType: 'doctor',
          onlineStatus: true
        })
      });

      setSelectedAppointmentForLive(appt);
      setShowVideoCall(true);
    } catch (error) {
      console.error('Error starting video call:', error);
    }
  };

  // Close live features
  const closeLiveFeatures = () => {
    setShowLiveChat(false);
    setShowVideoCall(false);
    setSelectedAppointmentForLive(null);
  };

  useEffect(() => {
    if (doctor?.email) {
      fetch(`/api/v1/appointments/doctor/${doctor.email}`)
        .then(res => res.json())
        .then(data => {
          setAppointments(data.data || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [doctor?.email]);

  const handleConfirm = async (appointmentId) => {
    await fetch(`/api/v1/appointments/confirm/${appointmentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doctorEmail: doctor.email })
    });
    // Refresh appointments after confirming
    setLoading(true);
    fetch(`/api/v1/appointments/doctor/${doctor.email}`)
      .then(res => res.json())
      .then(data => {
        setAppointments(data.data || []);
        setLoading(false);
      });
  };

  if (!doctor || !doctor.email) {
    return <div>No doctor info found. Please log in as a doctor.</div>;
  }

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
            <li key={appt._id} className="history-item" style={{
              backgroundColor: ['confirmed', 'approved', 'accepted'].includes(appt.status?.toLowerCase()) ? '#e8f5e8' : '#fff3e0',
              border: `2px solid ${['confirmed', 'approved', 'accepted'].includes(appt.status?.toLowerCase()) ? '#4caf50' : '#ff9800'}`,
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '10px'
            }}>
              <div style={{ marginBottom: '8px' }}>
                <strong style={{ fontSize: '18px' }}>Patient: {appt.userName}</strong>
              </div>
              <div style={{ marginBottom: '5px' }}>
                <strong>📅 Date:</strong> {appt.date}
              </div>
              <div style={{ marginBottom: '5px' }}>
                <strong>🕒 Time:</strong> {appt.time}
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Status:</strong> <span style={{
                  color: ['confirmed', 'approved', 'accepted'].includes(appt.status?.toLowerCase()) ? '#4caf50' : '#ff9800',
                  fontWeight: 'bold'
                }}>
                  {['confirmed', 'approved', 'accepted'].includes(appt.status?.toLowerCase()) ? '✅ Confirmed' : '⏳ Pending'}
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
              
              {/* Live Features for Confirmed Appointments */}
              {['confirmed', 'approved', 'accepted'].includes(appt.status?.toLowerCase()) && (
                <div style={{ marginTop: '15px', padding: '10px', backgroundColor: 'rgba(102, 126, 234, 0.1)', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#667eea' }}>Live Features</h4>
                  
                  {isAppointmentLive(appt) ? (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => startLiveChat(appt)}
                        style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        💬 Live Chat
                      </button>
                      
                      <button
                        onClick={() => startVideoCall(appt)}
                        style={{
                          background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        📹 Video Call
                      </button>
                    </div>
                  ) : (
                    <div style={{ 
                      color: '#666', 
                      fontSize: '14px',
                      fontStyle: 'italic',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      🕒 {getTimeUntilLive(appt)}
                      <small>(Available 15 min before appointment)</small>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Live Chat Modal */}
      {showLiveChat && selectedAppointmentForLive && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '80%',
            overflow: 'hidden'
          }}>
            <LiveChat
              appointmentId={selectedAppointmentForLive._id}
              currentUser={{
                id: doctor.email,
                name: doctor.name || doctor.email
              }}
              userType="doctor"
              onClose={closeLiveFeatures}
            />
          </div>
        </div>
      )}

      {/* Video Call Modal */}
      {showVideoCall && selectedAppointmentForLive && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            width: '95%',
            height: '95%',
            maxWidth: '900px',
            maxHeight: '700px'
          }}>
            <VideoCall
              appointmentId={selectedAppointmentForLive._id}
              currentUser={{
                id: doctor.email,
                name: doctor.name || doctor.email
              }}
              userType="doctor"
              onClose={closeLiveFeatures}
            />
          </div>
        </div>
      )}
    </div>
  );
}