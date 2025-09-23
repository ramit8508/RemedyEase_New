import React, { useState, useEffect } from 'react';
import LiveChat from '../../components/LiveChat';
import '../../Css_for_all/DoctorHome.css';
import { API_CONFIG } from '../../config/api';

export default function DoctorHome() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showLiveChat, setShowLiveChat] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [appointmentsByDate, setAppointmentsByDate] = useState({});

  const doctor = JSON.parse(localStorage.getItem("doctor"));
  const doctorEmail = doctor?.email;

  useEffect(() => {
    if (doctorEmail) {
      fetchAllAppointments();
    }
  }, [doctorEmail]);

  const fetchAllAppointments = async () => {
    try {
      const response = await fetch(`${API_CONFIG.ENDPOINTS.APPOINTMENTS}/doctor/${doctorEmail}`);
      const data = await response.json();
      
      if (data.success || data.data) {
        const appointmentData = data.data || data;
        setAppointments(appointmentData);
        
        // Group appointments by date
        const grouped = appointmentData.reduce((acc, appointment) => {
          const date = appointment.date;
          if (!acc[date]) {
            acc[date] = [];
          }
          acc[date].push(appointment);
          return acc;
        }, {});
        
        setAppointmentsByDate(grouped);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const fetchChatHistoryForDate = async (date) => {
    try {
      setLoading(true);
      const appointmentsForDate = appointmentsByDate[date] || [];
      const chatHistoryPromises = appointmentsForDate.map(async (appointment) => {
        try {
          const response = await fetch(`${API_CONFIG.ENDPOINTS.LIVE}/chat/history/${appointment._id}`);
          const data = await response.json();
          
          if (data.success && data.data.length > 0) {
            return {
              appointment,
              messages: data.data,
              hasChat: true
            };
          }
          return {
            appointment,
            messages: [],
            hasChat: false
          };
        } catch (error) {
          return {
            appointment,
            messages: [],
            hasChat: false
          };
        }
      });

      const chatResults = await Promise.all(chatHistoryPromises);
      setChatHistory(chatResults.filter(result => result.hasChat));
    } catch (error) {
      console.error('Error fetching chat history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (date) => {
    const dateString = formatDateForAPI(date);
    setSelectedDate(date);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) {
      // Past date - show chat history
      fetchChatHistoryForDate(dateString);
    }
  };

  const formatDateForAPI = (date) => {
    return date.toISOString().split('T')[0];
  };

  const formatDateDisplay = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const hasAppointmentsOnDate = (date) => {
    const dateString = formatDateForAPI(date);
    return appointmentsByDate[dateString] && appointmentsByDate[dateString].length > 0;
  };

  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const openChatForAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setShowLiveChat(true);
  };

  const closeLiveChat = () => {
    setShowLiveChat(false);
    setSelectedAppointment(null);
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
    setSelectedDate(null);
    setChatHistory([]);
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const today = new Date();
  const selectedDateString = selectedDate ? formatDateForAPI(selectedDate) : null;
  const appointmentsForSelectedDate = selectedDateString ? (appointmentsByDate[selectedDateString] || []) : [];

  return (
    <div className="doctor-home-container">
      {showLiveChat ? (
        <LiveChat
          appointmentId={selectedAppointment._id}
          currentUser={doctor}
          userType="doctor"
          onClose={closeLiveChat}
        />
      ) : (
        <>
          <div className="doctor-home-header">
            <h1>🏥 Doctor Dashboard</h1>
            <p>Welcome back, Dr. {doctor?.fullname}! Manage your appointments and patient communications.</p>
          </div>

          <div className="calendar-section">
            <div className="calendar-header">
              <button onClick={() => navigateMonth(-1)} className="nav-btn">‹</button>
              <h2>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h2>
              <button onClick={() => navigateMonth(1)} className="nav-btn">›</button>
            </div>

            <div className="calendar-grid">
              <div className="weekdays">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="weekday">{day}</div>
                ))}
              </div>
              
              <div className="days-grid">
                {getDaysInMonth(currentMonth).map((date, index) => (
                  <div
                    key={index}
                    className={`calendar-day ${!date ? 'empty' : ''} ${
                      date && isToday(date) ? 'today' : ''
                    } ${
                      date && hasAppointmentsOnDate(date) ? 'has-appointments' : ''
                    } ${
                      date && selectedDate && date.toDateString() === selectedDate.toDateString() ? 'selected' : ''
                    }`}
                    onClick={() => date && handleDateClick(date)}
                  >
                    {date && (
                      <>
                        <span className="day-number">{date.getDate()}</span>
                        {hasAppointmentsOnDate(date) && (
                          <div className="appointment-indicator">
                            {appointmentsByDate[formatDateForAPI(date)].length}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {selectedDate && (
            <div className="date-details">
              <h3>📅 {formatDateDisplay(selectedDateString)}</h3>
              
              {isPastDate(selectedDate) ? (
                // Show chat history for past dates
                <div className="chat-history-section">
                  <h4>💬 Chat History</h4>
                  {loading ? (
                    <div className="loading-spinner">Loading chat history...</div>
                  ) : chatHistory.length > 0 ? (
                    <div className="chat-history-list">
                      {chatHistory.map((item, index) => (
                        <div key={index} className="chat-history-card">
                          <div className="patient-info">
                            <h5>👤 {item.appointment.userName}</h5>
                            <p>📧 {item.appointment.userEmail}</p>
                            <p>🕐 {item.appointment.time}</p>
                          </div>
                          <div className="chat-summary">
                            <p>{item.messages.length} messages exchanged</p>
                            <button 
                              onClick={() => openChatForAppointment(item.appointment)}
                              className="view-chat-btn"
                            >
                              💬 View Chat
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-data">No chat history found for this date.</p>
                  )}
                </div>
              ) : (
                // Show appointments for current/future dates
                <div className="appointments-section">
                  <h4>📋 Appointments</h4>
                  {appointmentsForSelectedDate.length > 0 ? (
                    <div className="appointments-list">
                      {appointmentsForSelectedDate.map((appointment, index) => (
                        <div key={index} className="appointment-card">
                          <div className="patient-info">
                            <h5>👤 {appointment.userName}</h5>
                            <p>📧 {appointment.userEmail}</p>
                            <p>🕐 {appointment.time}</p>
                            <span className={`status ${appointment.status}`}>
                              {appointment.status}
                            </span>
                          </div>
                          {isToday(selectedDate) && (
                            <button 
                              onClick={() => openChatForAppointment(appointment)}
                              className="start-chat-btn"
                            >
                              💬 Start Chat
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-data">No appointments scheduled for this date.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

