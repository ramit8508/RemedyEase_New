import React, { useState, useEffect, useCallback, useRef } from "react";
import "../../Css_for_all/DoctorHistory.css";

export default function DoctorHistory() {
  const doctor = JSON.parse(localStorage.getItem("doctor"));
  const [consultationHistory, setConsultationHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [error, setError] = useState(null);

  const fetchConsultationHistory = useCallback(async () => {
    if (!doctor?.email) {
      setError("Doctor information not found. Please log in again.");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/appointments/doctor/${doctor.email}/history`);
      if (response.ok) {
        const data = await response.json();
        setConsultationHistory(data.data || []);
      } else {
        setError("Failed to fetch consultation history.");
      }
    } catch (err) {
      console.error("Error fetching consultation history:", err);
      setError("An error occurred while fetching data.");
    } finally {
      setLoading(false);
    }
  }, [doctor?.email]);

  useEffect(() => {
    fetchConsultationHistory();
  }, [fetchConsultationHistory]);

  const addTreatmentDetails = useCallback(async (appointmentId, treatment) => {
    try {
      const response = await fetch(
        `/api/v1/appointments/treatment/${appointmentId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            treatment: treatment,
            treatedBy: doctor.fullname,
            treatmentDate: new Date().toISOString()
          }),
        }
      );

      if (response.ok) {
        fetchConsultationHistory(); // Refresh the list
        setSelectedConsultation(null);
      } else {
        console.error("Failed to add treatment details");
      }
    } catch (error) {
      console.error("Error adding treatment:", error);
    }
  }, [doctor, fetchConsultationHistory]);
  
  const filteredHistory = consultationHistory
    .filter(consultation => {
      const matchesSearch = consultation.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            consultation.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || consultation.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortBy === "patient") {
        return a.userName.localeCompare(b.userName);
      }
      return 0;
    });

  const getStatusColor = useCallback((status) => {
    switch (status) {
      case "completed": return "#27ae60";
      case "confirmed": return "#3498db";
      case "pending": return "#f39c12";
      case "cancelled": return "#e74c3c";
      default: return "#95a5a6";
    }
  }, []);

  const formatDate = useCallback((dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }, []);

  if (loading) return <div>Loading history...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="doctor-history-container">
      <div className="history-header">
        <h1>Patient Consultation History</h1>
        <p>View and manage your patient consultations and treatments</p>
      </div>

      <div className="history-controls">
        <div className="search-section">
          <input
            type="text"
            placeholder="Search by patient name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-section">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
            <option value="date">Sort by Date</option>
            <option value="patient">Sort by Patient</option>
          </select>
        </div>
      </div>
      
      <div className="history-list">
        {filteredHistory.length === 0 ? (
          <div className="no-history">
            <h3>No Consultation History Found</h3>
            <p>Your patient consultations will appear here once they are completed.</p>
          </div>
        ) : (
          filteredHistory.map((consultation) => (
            <div key={consultation._id} className="consultation-card">
              <div className="consultation-header">
                <div className="patient-info">
                  <h3>{consultation.userName}</h3>
                  <p className="patient-email">{consultation.userEmail}</p>
                </div>
                <div className="consultation-meta">
                  <span className="status-badge" style={{ backgroundColor: getStatusColor(consultation.status) }}>
                    {consultation.status}
                  </span>
                  <p className="consultation-date">{formatDate(consultation.createdAt)}</p>
                </div>
              </div>

              <div className="consultation-details">
                <div className="detail-row">
                  <strong>Appointment Date:</strong> {consultation.date} at {consultation.time}
                </div>
                {consultation.symptoms && (
                  <div className="detail-row">
                    <strong>Symptoms Reported:</strong>
                    <p className="symptoms-text">{consultation.symptoms}</p>
                  </div>
                )}
                {consultation.treatment ? (
                  <div className="treatment-section">
                    <div className="detail-row">
                      <strong>Treatment Provided:</strong>
                      <p className="treatment-text">{consultation.treatment}</p>
                    </div>
                    {consultation.treatmentDate && (
                      <div className="detail-row">
                        <strong>Treatment Date:</strong> {formatDate(consultation.treatmentDate)}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="no-treatment">
                    <p>No treatment details recorded</p>
                    <button
                      className="add-treatment-btn"
                      onClick={() => setSelectedConsultation(consultation)}
                    >
                      Add Treatment Details
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {selectedConsultation && (
        <div className="modal-overlay">
          <div className="treatment-modal">
            <div className="modal-header">
              <h3>Add Treatment for {selectedConsultation.userName}</h3>
              <button className="close-modal" onClick={() => setSelectedConsultation(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="patient-summary">
                <p><strong>Patient:</strong> {selectedConsultation.userName}</p>
                <p><strong>Date:</strong> {selectedConsultation.date} at {selectedConsultation.time}</p>
                {selectedConsultation.symptoms && <p><strong>Symptoms:</strong> {selectedConsultation.symptoms}</p>}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const treatment = e.target.treatment.value.trim();
                  if (treatment) {
                    addTreatmentDetails(selectedConsultation._id, treatment);
                  }
                }}
              >
                <div className="form-group">
                  <label htmlFor="treatment">Treatment Details:</label>
                  <textarea
                    id="treatment"
                    name="treatment"
                    rows="6"
                    placeholder="Enter detailed treatment provided, medications prescribed, etc..."
                    required
                  ></textarea>
                </div>
                <div className="modal-actions">
                  <button type="button" className="cancel-btn" onClick={() => setSelectedConsultation(null)}>Cancel</button>
                  <button type="submit" className="save-treatment-btn">Save Treatment</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}