import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../Css_for_all/Appointments.css";
import LiveChat from "../../components/LiveChat";
import VideoCall from "../../components/VideoCall";
import { getApiUrl, API_CONFIG } from "../../config/api";

export default function Appointments() {
  const location = useLocation();
  const navigate = useNavigate();
  const doctor = location.state?.doctor;
  const user = JSON.parse(localStorage.getItem("user"));
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); 
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(doctor || null);
  const [loadingDoctors, setLoadingDoctors] = useState(!doctor);
  const [pendingConfirmations, setPendingConfirmations] = useState([]);
  const [lastBookedAppointment, setLastBookedAppointment] = useState(null);
  
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
    console.log('🕒 Checking live status for appointment:', {
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
      await fetch(getApiUrl(`${API_CONFIG.ENDPOINTS.LIVE}/status/${appt._id}`, 'USER'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.email,
          userType: 'patient',
          onlineStatus: true
        })
      });

      setSelectedAppointmentForLive(appt);
      setShowVideoCall(true);
    } catch (error) {
      console.error('Error starting video call:', error);
      setMessage('Failed to start video call. Please try again.');
      setMessageType('error');
    }
  };

  // Close live features
  const closeLiveFeatures = () => {
    setShowLiveChat(false);
    setShowVideoCall(false);
    setSelectedAppointmentForLive(null);
  };

  // Force check for confirmations
  const forceCheckConfirmations = async () => {
    if (!user?.email) return;
    
    console.log('🔄 Force checking confirmations for user:', user.email);
    try {
      const res = await fetch(`/api/v1/users/${user.email}/appointments`);
      const data = await res.json();
      const appointments = data.data || [];
      
      console.log('📋 Current appointments from API:', appointments);
      console.log('📋 Response status:', res.status);
      console.log('📋 Full response:', data);
      
      const savedPending = JSON.parse(localStorage.getItem(`pendingConfirmations_${user.email}`) || '[]');
      console.log('⏳ Saved pending confirmations:', savedPending);
      
      let foundConfirmation = false;
      const updatedPending = savedPending.filter(pending => {
        const matchingAppt = appointments.find(appt => {
          const emailMatch = appt.doctorEmail === pending.doctorEmail || appt.doctorName === pending.doctorName;
          const dateMatch = appt.date === pending.date;
          const timeMatch = appt.time === pending.time;
          
          console.log('🔍 Matching check:', {
            pendingDoctor: pending.doctorName,
            appointmentDoctor: appt.doctorName,
            emailMatch,
            dateMatch,
            timeMatch,
            appointmentStatus: appt.status
          });
          
          return emailMatch && dateMatch && timeMatch;
        });
        
        if (matchingAppt) {
          console.log('🎯 Found matching appointment:', matchingAppt);
          if (['confirmed', 'approved', 'accepted'].includes(matchingAppt.status?.toLowerCase())) {
            console.log('✅ Found confirmed appointment:', matchingAppt);
            setLastBookedAppointment({ ...matchingAppt, justConfirmed: true });
            foundConfirmation = true;
            return false; // Remove from pending
          } else {
            console.log('⏳ Appointment found but still pending, status:', matchingAppt.status);
          }
        } else {
          console.log('❌ No matching appointment found for:', pending);
        }
        return true; // Keep in pending
      });
      
      if (foundConfirmation) {
        localStorage.setItem(`pendingConfirmations_${user.email}`, JSON.stringify(updatedPending));
        setPendingConfirmations(updatedPending);
        setMessage("Doctor has confirmed your appointment!");
        setMessageType("success");
      } else {
        console.log('📝 No confirmations found, keeping existing pending list');
      }
      
      setHistory(appointments);
    } catch (error) {
      console.error('❌ Error checking confirmations:', error);
    }
  };

  useEffect(() => {
    
    if (user?.email) {
      fetch(`/api/v1/users/${user.email}/appointments`)
        .then(res => res.json())
        .then(data => {
          const appointments = data.data || [];
          console.log('Fetched appointments:', appointments); // Debug
          setHistory(appointments);
          setLoadingHistory(false);
          
          
          const savedPending = JSON.parse(localStorage.getItem(`pendingConfirmations_${user.email}`) || '[]');
          console.log('Saved pending confirmations:', savedPending); // Debug log
          const currentPending = [...savedPending];
          
          // Check if any pending appointments got confirmed
          savedPending.forEach(pending => {
            const foundAppt = appointments.find(appt => {
              // More flexible matching - check multiple fields
              const emailMatch = appt.doctorEmail === pending.doctorEmail || appt.doctorName === pending.doctorName;
              const dateMatch = appt.date === pending.date;
              const timeMatch = appt.time === pending.time;
              
              console.log('Matching attempt:', {
                pending: pending,
                appointment: appt,
                emailMatch,
                dateMatch,
                timeMatch
              });
              
              return emailMatch && dateMatch && timeMatch;
            });
            
            console.log('Checking pending:', pending, 'Found appointment:', foundAppt); // Debug log
            
            if (foundAppt) {
              console.log('Appointment status:', foundAppt.status); // Debug log
              // Check for various confirmation status values (case-insensitive)
              const status = foundAppt.status?.toLowerCase();
              if (status === 'confirmed' || 
                  status === 'approved' ||
                  status === 'accepted' ||
                  status === 'confirm') {
                
                console.log('🎉 Appointment confirmed! Removing from pending...'); // Debug log
                
                // Remove from pending and set as last confirmed
                setLastBookedAppointment({
                  ...foundAppt,
                  justConfirmed: true
                });
                
                // Remove this specific pending appointment
                const updatedPending = pendingConfirmations.filter(p => 
                  !(p.doctorEmail === pending.doctorEmail && p.date === pending.date && p.time === pending.time) &&
                  !(p.doctorName === pending.doctorName && p.date === pending.date && p.time === pending.time)
                );
                
                localStorage.setItem(`pendingConfirmations_${user.email}`, JSON.stringify(updatedPending));
                setPendingConfirmations(updatedPending);
                console.log('Appointment confirmed! Updated pending list:', updatedPending); // Debug log
              } else {
                console.log('Appointment found but status is:', status, '- keeping in pending'); // Debug log
              }
            } else {
              console.log('No matching appointment found for pending:', pending); // Debug log
            }
          });
          
          if (currentPending.length === savedPending.length) {
            setPendingConfirmations(savedPending);
          }
        })
        .catch(() => setLoadingHistory(false));
    }
  }, [user?.email, message]); // refetch history after booking

  useEffect(() => {
    // Fetch available doctors if no doctor was selected
    if (!doctor) {
      fetch("/api/v1/doctors/all")
        .then(res => res.json())
        .then(data => {
          setAvailableDoctors(data.data || []);
          setLoadingDoctors(false);
        })
        .catch(() => setLoadingDoctors(false));
    }
  }, [doctor]);

  // Clear confirmation message after 10 seconds
  useEffect(() => {
    if (lastBookedAppointment?.justConfirmed) {
      const timer = setTimeout(() => {
        setLastBookedAppointment(null);
      }, 10000); // 10 seconds
      
      return () => clearTimeout(timer);
    }
  }, [lastBookedAppointment]);

  if (!doctor && loadingDoctors) {
    return <div>Loading doctors...</div>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🚀 Starting appointment booking...');
    console.log('📋 Booking data:', {
      doctorEmail: selectedDoctor.email,
      doctorName: selectedDoctor.fullname,
      userEmail: user.email,
      userName: user.fullname,
      date,
      time,
      symptoms
    });
    
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
          symptoms
        }),
      });
      
      console.log('📡 Booking response status:', res.status);
      const data = await res.json();
      console.log('📡 Booking response data:', data);
      
      if (res.ok) {
        console.log('✅ Booking successful! Appointment data:', data.data);
        
        const newPending = {
          doctorEmail: selectedDoctor.email,
          doctorName: selectedDoctor.fullname,
          userEmail: user.email, 
          date,
          time,
          symptoms,
          timestamp: new Date().toISOString()
        };
        
        
        const existingPending = JSON.parse(localStorage.getItem(`pendingConfirmations_${user.email}`) || '[]');
        const updatedPending = [...existingPending, newPending];
        localStorage.setItem(`pendingConfirmations_${user.email}`, JSON.stringify(updatedPending));
        setPendingConfirmations(updatedPending);
        
        console.log('💾 Saved to pending confirmations:', updatedPending);
        
        setMessage(`Your booking request has been sent to Dr. ${selectedDoctor.fullname}. Please wait for confirmation!`);
        setMessageType("pending");
        // Clear form
        setDate("");
        setTime("");
        setSymptoms("");
        // Clear any previous confirmation message
        setLastBookedAppointment(null);
        
        // Immediately check if appointment appears in the database
        setTimeout(() => {
          console.log('🔄 Checking if appointment was saved to database...');
          forceCheckConfirmations();
        }, 1000);
        
      } else {
        setMessage(data.message || "Booking failed.");
        setMessageType("error");
      }
    } catch {
      setMessage("Something went wrong.");
      setMessageType("error");
    }
  };

  return (
    <>
      <div className="appointment-page">
        <h1 className="appointment-title">Book a new Appointment and Lead a way to Wellness</h1>
        
        {/* Doctor Selection Section */}
        {!doctor && (
          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
            <h3>Select a Doctor</h3>
            {availableDoctors.length === 0 ? (
              <p>No doctors available. Please try again later.</p>
            ) : (
              <select 
                value={selectedDoctor?.email || ''} 
                onChange={(e) => {
                  const selected = availableDoctors.find(doc => doc.email === e.target.value);
                  setSelectedDoctor(selected);
                }}
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '16px',
                  borderRadius: '5px',
                  border: '1px solid #ddd'
                }}
              >
                <option value="">Choose a doctor...</option>
                {availableDoctors.map(doc => (
                  <option key={doc.email} value={doc.email}>
                    Dr. {doc.fullname} - {doc.specialization}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {selectedDoctor ? (
          <>
            <h2>Book Appointment with Dr. {selectedDoctor.fullname}</h2>
            <form onSubmit={handleSubmit} className="appointment-content">
              <label>
                Date:
                <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
              </label>
              <label>
                Time:
                <input type="time" value={time} onChange={e => setTime(e.target.value)} required />
              </label>
              <label>
                Symptoms/Reason for visit:
                <textarea 
                  value={symptoms} 
                  onChange={e => setSymptoms(e.target.value)} 
                  placeholder="Please describe your symptoms or reason for consultation..."
                  rows="4"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                  required
                />
              </label>
              <button type="submit" className="book-btn">Book Appointment</button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>Please select a doctor from the dropdown above to book an appointment.</p>
            <p>Or <button onClick={() => navigate('/user/dashboard/meet-doctor')} className="book-btn">Browse Doctors</button></p>
          </div>
        )}

        {message && (
          <div 
            style={{ 
              marginTop: 15, 
              color: messageType === "error" ? "red" : messageType === "pending" ? "#ff9800" : "green",
              fontWeight: "bold",
              padding: "15px",
              borderRadius: "8px",
              backgroundColor: messageType === "error" ? "#ffebee" : messageType === "pending" ? "#fff3e0" : "#e8f5e8",
              border: `2px solid ${messageType === "error" ? "red" : messageType === "pending" ? "#ff9800" : "green"}`,
              textAlign: "center",
              fontSize: "16px"
            }}
          >
            {messageType === "pending" && "⏳ "}{message}
          </div>
        )}
        <button className="book-btn" style={{marginTop: 20}} onClick={() => navigate(-1)}>Back</button>
      </div>
      
      {/* Confirmation Status Section */}
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, color: '#333' }}>📋 Confirmation Status</h3>
          <button 
            onClick={forceCheckConfirmations} 
            style={{
              padding: '8px 15px',
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔄 Check Confirmations
          </button>
        </div>
        
        {/* Debug info - you can remove this later */}
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
          <details>
            <summary style={{ cursor: 'pointer' }}>Debug Info (Click to expand)</summary>
            <div style={{ marginTop: '5px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
              <p><strong>Pending Confirmations:</strong> {pendingConfirmations.length}</p>
              <p><strong>Last Confirmed:</strong> {lastBookedAppointment ? 'Yes' : 'No'}</p>
              <p><strong>Total Appointments:</strong> {history.length}</p>
              {history.length > 0 && (
                <div>
                  <strong>Recent appointment statuses:</strong>
                  <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                    {history.slice(0, 3).map((appt, i) => (
                      <li key={i}>{appt.doctorName}: "{appt.status || 'no status'}"</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </details>
        </div>
        
        {/* Show doctor confirmation message */}
        {lastBookedAppointment?.justConfirmed && (
          <div style={{
            padding: '15px',
            backgroundColor: '#e8f5e8',
            border: '2px solid #4caf50',
            borderRadius: '8px',
            marginBottom: '10px',
            color: '#2e7d32',
            fontWeight: 'bold'
          }}>
            ✅ Doctor has confirmed your request! Your appointment with Dr. {lastBookedAppointment.doctorName} is confirmed for {lastBookedAppointment.date} at {lastBookedAppointment.time}.
          </div>
        )}
        
        {/* Show pending confirmations */}
        {pendingConfirmations.length > 0 ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <p style={{ fontWeight: 'bold', color: '#ff9800', margin: 0 }}>
                ⏳ Waiting for doctor confirmation:
              </p>
              <button 
                onClick={() => {
                  localStorage.removeItem(`pendingConfirmations_${user.email}`);
                  setPendingConfirmations([]);
                }} 
                style={{
                  padding: '5px 10px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Clear All
              </button>
            </div>
            {pendingConfirmations.map((pending, index) => (
              <div key={index} style={{
                padding: '12px',
                backgroundColor: '#fff3e0',
                border: '2px solid #ff9800',
                borderRadius: '6px',
                marginBottom: '8px',
                color: '#e65100'
              }}>
                <strong>Dr. {pending.doctorName}</strong> - {pending.date} at {pending.time}
                <br />
                <small>Confirmation is pending...</small>
                <button 
                  onClick={() => {
                    const updated = pendingConfirmations.filter((_, i) => i !== index);
                    localStorage.setItem(`pendingConfirmations_${user.email}`, JSON.stringify(updated));
                    setPendingConfirmations(updated);
                  }}
                  style={{
                    marginLeft: '10px',
                    padding: '2px 8px',
                    backgroundColor: '#ff9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '11px'
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : !lastBookedAppointment?.justConfirmed && (
          <p style={{ color: '#666', fontStyle: 'italic' }}>
            No pending confirmations at the moment.
          </p>
        )}
      </div>
      
      <div className="history">
        <h2 className="history-title">📋 Your Appointments History</h2>
        {loadingHistory ? (
          <div>Loading your appointments...</div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            No appointments found. Book your first appointment above!
          </div>
        ) : (
          <ul className="history-list">
            {history.map((appt) => {
              const getStatusMessage = (status) => {
                switch(status?.toLowerCase()) {
                  case 'confirmed':
                  case 'approved':
                    return `✅ Appointment Confirmed for ${appt.date} at ${appt.time}`;
                  case 'pending':
                  default:
                    return `⏳ Booking request sent to Dr. ${appt.doctorName} - Waiting for confirmation`;
                }
              };
              
              const getStatusColor = (status) => {
                switch(status?.toLowerCase()) {
                  case 'confirmed':
                  case 'approved':
                    return '#4caf50'; // green
                  case 'pending':
                  default:
                    return '#ff9800'; // orange
                }
              };

              const getStatusBackground = (status) => {
                switch(status?.toLowerCase()) {
                  case 'confirmed':
                  case 'approved':
                    return '#e8f5e8'; // light green
                  case 'pending':
                  default:
                    return '#fff3e0'; // light orange
                }
              };

              return (
                <li 
                  key={appt._id} 
                  className="history-item"
                  style={{
                    backgroundColor: getStatusBackground(appt.status),
                    border: `2px solid ${getStatusColor(appt.status)}`,
                    borderRadius: '8px',
                    padding: '15px',
                    marginBottom: '10px'
                  }}
                >
                  <div style={{ marginBottom: '8px' }}>
                    <strong style={{ fontSize: '18px', color: '#333' }}>Dr. {appt.doctorName}</strong>
                  </div>
                  <div style={{ marginBottom: '5px' }}>
                    <strong>📅 Date:</strong> {appt.date}
                  </div>
                  <div style={{ marginBottom: '5px' }}>
                    <strong>🕒 Time:</strong> {appt.time}
                  </div>
                  <div style={{ 
                    color: getStatusColor(appt.status),
                    fontWeight: 'bold',
                    fontSize: '16px',
                    marginTop: '10px'
                  }}>
                    {getStatusMessage(appt.status)}
                  </div>
                  
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
              );
            })}
          </ul>
        )}
      </div>

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
                id: user.email,
                name: user.name || user.email
              }}
              userType="patient"
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
                id: user.email,
                name: user.name || user.email
              }}
              userType="patient"
              onClose={closeLiveFeatures}
            />
          </div>
        </div>
      )}
    </>
  );
}