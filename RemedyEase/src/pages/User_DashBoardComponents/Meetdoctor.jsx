import React, { useEffect, useState } from 'react';
import "../../Css_for_all/MeetDoctor.css";
import { useNavigate } from 'react-router-dom';

export default function Meetdoctor() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState("");
  const [searchSpec, setSearchSpec] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/v1/doctors/all")
      .then(res => res.json())
      .then(data => {
        setDoctors(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredDoctors = doctors.filter(doc =>
    doc.fullname.toLowerCase().includes(searchName.toLowerCase()) &&
    doc.specialization.toLowerCase().includes(searchSpec.toLowerCase())
  );

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
                  <button
                    className="book-btn"
                    onClick={() => navigate("/user/dashboard/Appointments", { state: { doctor: doc } })}
                  >
                    Book Appointment
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </>
  );
}