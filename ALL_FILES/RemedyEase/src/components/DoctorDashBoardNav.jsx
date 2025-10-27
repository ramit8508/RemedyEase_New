import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../Css_for_all/UserDashNav.css";

function DoctorDashBoardNav() {
  const user = JSON.parse(localStorage.getItem("user"));
  const doctor = JSON.parse(localStorage.getItem("doctor"));
  const avatar = user?.avatar;
  
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);

  useEffect(() => {
    const checkUpcomingAppointments = () => {
      if (!doctor?.email) return;

      fetch(`/api/v1/appointments/doctor/${doctor.email}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            const now = new Date();
            const currentTime = now.getHours() * 60 + now.getMinutes();
            const currentDate = now.toISOString().split('T')[0];

            const upcoming = data.data.filter((appt) => {
              if (!["confirmed", "approved", "accepted"].includes(appt.status?.toLowerCase())) {
                return false;
              }

              const appointmentDate = new Date(appt.date).toISOString().split('T')[0];
              if (appointmentDate !== currentDate) return false;

              const [hours, minutes] = appt.time.split(':').map(Number);
              const appointmentTimeInMinutes = hours * 60 + minutes;
              const timeDiff = appointmentTimeInMinutes - currentTime;

              return timeDiff <= 10 && timeDiff >= -5;
            });

            setUpcomingAppointments(upcoming);
            setUpcomingCount(upcoming.length);
          }
        })
        .catch((err) => console.error("Failed to fetch appointments", err));
    };

    checkUpcomingAppointments();
    const interval = setInterval(checkUpcomingAppointments, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [doctor?.email]);

  return (
    <div className="nav">
      <h1 className="nav-logo">☘RemedyEase</h1>
      <div className="nav-links">
        
          <Link className="nav-link" to="/doctor/dashboard/home">Home Page</Link>

          <Link className="nav-link" to="/doctor/dashboard/appointments">Appointments</Link>

          <Link className="nav-link" to="/doctor/dashboard/history">History</Link>

          <Link className="nav-link" to="/doctor/dashboard/ai">AI Recommendations</Link>

          <Link className="nav-link" to="/doctor/dashboard/profile">Profile</Link>

          {/* Notification Bell */}
          <div className="notification-bell-container">
            <button 
              className="notification-bell-btn"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              🔔
              {upcomingCount > 0 && (
                <span className="notification-badge">{upcomingCount}</span>
              )}
            </button>

            {showNotifications && upcomingAppointments.length > 0 && (
              <div className="notification-dropdown">
                <div className="notification-dropdown-header">
                  <h4>Upcoming Appointments</h4>
                  <button 
                    className="close-dropdown"
                    onClick={() => setShowNotifications(false)}
                  >
                    ×
                  </button>
                </div>
                <div className="notification-list">
                  {upcomingAppointments.map((appt) => (
                    <div key={appt._id} className="notification-item">
                      <div className="notification-time">
                        🕒 {appt.time}
                      </div>
                      <div className="notification-patient">
                        👤 {appt.userName}
                      </div>
                      <Link 
                        to="/doctor/dashboard/appointments"
                        className="notification-view-btn"
                        onClick={() => setShowNotifications(false)}
                      >
                        View Details
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showNotifications && upcomingAppointments.length === 0 && (
              <div className="notification-dropdown">
                <div className="notification-dropdown-header">
                  <h4>Notifications</h4>
                  <button 
                    className="close-dropdown"
                    onClick={() => setShowNotifications(false)}
                  >
                    ×
                  </button>
                </div>
                <div className="notification-empty">
                  No upcoming appointments
                </div>
              </div>
            )}
          </div>

          <img
            src={avatar}
            alt="User Avatar"
            className="nav-link"
            style={{ width: 40, height: 40, borderRadius: "50%" }}
          />
          </div>
        
      
    </div>
  );
}

export default DoctorDashBoardNav;
