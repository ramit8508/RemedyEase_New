import React, { useEffect, useState } from 'react';
import "../../Css_for_all/MeetDoctor.css";

export default function Meetdoctor() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState("");
  const [searchSpec, setSearchSpec] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  useEffect(() => {
    fetch("/api/v1/doctors/all")
      .then(res => res.json())
      .then(data => {
        setDoctors(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Filter doctors by name and specialization
  const filteredDoctors = doctors.filter(doc =>
    doc.fullname.toLowerCase().includes(searchName.toLowerCase()) &&
    doc.specialization.toLowerCase().includes(searchSpec.toLowerCase())
  );

  // Appointment form modal
  function AppointmentForm({ doctor, onClose }) {
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [message, setMessage] = useState("");
    const user = JSON.parse(localStorage.getItem("user"));

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const res = await fetch("/api/v1/appointments/book", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            doctorId: doctor._id,
            doctorName: doctor.fullname,
            userId: user?._id,
            userName: user?.fullname,
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
      <div className="appointment-modal">
        <div className="appointment-content">
          <button className="close-btn" onClick={onClose}>×</button>
          <h2>Book Appointment with {doctor.fullname}</h2>
          <form onSubmit={handleSubmit}>
            <label>
              Date:
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </label>
            <label>
              Time:
              <input type="time" value={time} onChange={e => setTime(e.target.value)} required />
            </label>
            <button type="submit">Book</button>
          </form>
          {message && <div style={{ marginTop: 10, color: "green" }}>{message}</div>}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="doctor-heading">
        <h1 className='doctor-title'>Find a Doctor</h1>
        <p className='doctor-description'>Select your preferred doctor from the list below.</p>
      </div>
      <div className="doctor-search-section">
        <input
          type="text"
          placeholder="Search by name"
          value={searchName}
          onChange={e => setSearchName(e.target.value)}
          className="doctor-search-input"
        />
        <input
          type="text"
          placeholder="Search by specialization"
          value={searchSpec}
          onChange={e => setSearchSpec(e.target.value)}
          className="doctor-search-input"
        />
      </div>
      {loading ? (
        <div>Loading doctors...</div>
      ) : (
        <div className="doctor-list">
          {filteredDoctors.length === 0 ? (
            <div>No doctors found.</div>
          ) : (
            filteredDoctors.map((doc) => (
              <div className="doctor-card" key={doc._id}>
                <div className="doctor-card-row">
                  <img src={doc.avatar || "/default-doctor.png"} alt={doc.fullname} className="doctor-avatar" />
                  <div className="doctor-info">
                    <h3>{doc.fullname}</h3>
                    <p><strong>Degree:</strong> {doc.degree}</p>
                    <p><strong>Experience:</strong> {doc.experience || "Not set"}</p>
                  </div>
                </div>
                <div className="doctor-details-below">
                  <p><strong>Specialization:</strong> {doc.specialization}</p>
                  <p><strong>Clinic:</strong> {doc.clinic || "Not set"}</p>
                  <p><strong>Email:</strong> {doc.email || "Not set"}</p>
                  <button className="book-btn" onClick={() => setSelectedDoctor(doc)}>
                    Book Appointment
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      {selectedDoctor && (
        <AppointmentForm doctor={selectedDoctor} onClose={() => setSelectedDoctor(null)} />
      )}
    </>
  );
}