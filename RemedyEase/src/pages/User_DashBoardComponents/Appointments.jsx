import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../Css_for_all/Appointments.css";

export default function Appointments() {
  const location = useLocation();
  const navigate = useNavigate();
  const doctor = location.state?.doctor;
  const user = JSON.parse(localStorage.getItem("user"));
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    // Fetch appointment history for the user
    if (user?.email) {
      fetch(`/api/v1/users/${user.email}/appointments`)
        .then(res => res.json())
        .then(data => {
          setHistory(data.data || []);
          setLoadingHistory(false);
        })
        .catch(() => setLoadingHistory(false));
    }
  }, [user?.email, message]); // refetch history after booking

  if (!doctor) {
    return <div>No doctor selected. <button onClick={() => navigate(-1)}>Go Back</button></div>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/v1/appointments/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorEmail: doctor.email,
          doctorName: doctor.fullname,
          userEmail: user.email,
          userName: user.fullname,
          date,
          time
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Appointment booked successfully!");
      } else {
        setMessage(data.message || "Booking failed.");
      }
    } catch {
      setMessage("Something went wrong.");
    }
  };

  return (
    <>
      <div className="appointment-page">
        <h1 className="appointment-title">Book a new Appointment and Lead a way to Wellness</h1>
        <h2>Book Appointment with {doctor.fullname}</h2>
        <form onSubmit={handleSubmit} className="appointment-content">
          <label>
            Date:
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </label>
          <label>
            Time:
            <input type="time" value={time} onChange={e => setTime(e.target.value)} required />
          </label>
          <button type="submit" className="book-btn">Book</button>
        </form>
        {message && <div style={{ marginTop: 10, color: "green" }}>{message}</div>}
        <button className="book-btn" style={{marginTop: 20}} onClick={() => navigate(-1)}>Back</button>
      </div>
      <div className="history">
        <h2 className="history-title">Your Appointment History</h2>
        {loadingHistory ? (
          <div>Loading history...</div>
        ) : history.length === 0 ? (
          <div>No appointments found.</div>
        ) : (
          <ul className="history-list">
            {history.map((appt) => (
              <li key={appt._id} className="history-item">
                <strong>Doctor:</strong> {appt.doctorName} <br />
                <strong>Date:</strong> {appt.date} <br />
                <strong>Time:</strong> {appt.time} <br />
                <strong>Status:</strong> {appt.status || "pending"}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}