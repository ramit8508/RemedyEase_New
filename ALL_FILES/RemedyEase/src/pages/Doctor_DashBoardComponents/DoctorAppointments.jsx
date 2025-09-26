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
  const [selectedAppointmentForLive, setSelectedAppointmentForLive] = useState(null);

  const fetchAppointments = () => {
    if (doctor?.email) {
      setLoading(true);
      fetch(`/api/v1/appointments/doctor/${doctor.email}`)
        .then(res => res.json())
        .then(data => {
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
        body: JSON.stringify({ doctorEmail: doctor.email })
      });
      if(res.ok) {
        fetchAppointments();
      }
    } catch (error) {
      console.error("Failed to confirm appointment", error);
    }
  };
  
  const isAppointmentLive = (appt) => {
    if (!['confirmed', 'approved', 'accepted'].includes(appt.status?.toLowerCase())) {
      return false;
    }
    const now = new Date();
    const appointmentDateTime = new Date(`${appt.date}T${appt.time}`);
    const startTime = new Date(appointmentDateTime.getTime() - 15 * 60 * 1000);
    const endTime = new Date(appointmentDateTime.getTime() + 60 * 60 * 1000);
    return now >= startTime && now <= endTime;
  };

  const getTimeUntilLive = (appt) => {
    if (!['confirmed', 'approved', 'accepted'].includes(appt.status?.toLowerCase())) {
      return 'Waiting for confirmation';
    }
    
    const now = new Date();
    const appointmentDateTime = new Date(`${appt.date}T${appt.time}`);
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
  
  const startLiveChat = (appt) => {
    setSelectedAppointmentForLive(appt);
    setShowLiveChat(true);
  };
  
  const startVideoCall = async (appt) => {
    try {
      await fetch(`/api/v1/live/status/${appt._id}`, {
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
              
              {['confirmed', 'approved', 'accepted'].includes(appt.status?.toLowerCase()) && (
                <div style={{ marginTop: '15px', padding: '10px', backgroundColor: 'rgba(102, 126, 234, 0.1)', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#667eea' }}>Live Features</h4>
                  
                  {isAppointmentLive(appt) ? (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <button onClick={() => startLiveChat(appt)}>💬 Live Chat</button>
                      <button onClick={() => startVideoCall(appt)}>📹 Video Call</button>
                    </div>
                  ) : (
                    <div style={{ color: '#666', fontSize: '14px' }}>
                      🕒 {getTimeUntilLive(appt)}
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {showLiveChat && selectedAppointmentForLive && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '12px', width: '90%', maxWidth: '500px', maxHeight: '80%', overflow: 'hidden' }}>
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
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ width: '95%', height: '95%', maxWidth: '900px', maxHeight: '700px' }}>
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