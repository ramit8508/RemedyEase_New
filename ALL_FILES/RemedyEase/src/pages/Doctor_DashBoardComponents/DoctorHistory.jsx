import React, { useState, useEffect, useCallback, useRef } from "react";
import "../../Css_for_all/DoctorHistory.css";
import { getApiUrl, API_CONFIG } from "../../config/api";

export default function DoctorHistory() {
  const doctor = JSON.parse(localStorage.getItem("doctor"));
  const [consultationHistory, setConsultationHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [error, setError] = useState(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const mountedRef = useRef(true);
  const loadingTimeoutRef = useRef(null);

  // Memoize doctor to prevent unnecessary re-renders
  const memoizedDoctor = React.useMemo(() => doctor, []);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    console.log('👨‍⚕️ Doctor data from localStorage:', memoizedDoctor);
    if (memoizedDoctor?.email && !initialLoadComplete) {
      fetchConsultationHistory();
    } else if (!memoizedDoctor?.email) {
      console.error('❌ No doctor found in localStorage');
      setError('Doctor information not found. Please log in again.');
      setLoading(false);
    }
  }, [memoizedDoctor, initialLoadComplete]);

  const fetchConsultationHistory = useCallback(async () => {
    if (!mountedRef.current) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Fetching consultation history for doctor:', memoizedDoctor?.email);
      
      // Add minimum loading time to prevent flickering
      const minLoadingTime = 800; // 800ms minimum
      const startTime = Date.now();
      
      const url = getApiUrl(`${API_CONFIG.ENDPOINTS.APPOINTMENTS}/doctor/${memoizedDoctor.email}/history`, 'DOCTOR');
      console.log('📡 API URL:', url);
      
      const response = await fetch(url);
      console.log('📡 Response status:', response.status);
      
      if (!mountedRef.current) return;
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Consultation history data:', data);
        
        // Ensure minimum loading time has passed
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
        
        loadingTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            setConsultationHistory(data.data || []);
            setLoading(false);
            setInitialLoadComplete(true);
          }
        }, remainingTime);
      } else {
        const errorData = await response.text();
        console.error("❌ Failed to fetch consultation history:", response.status, errorData);
        
        // Ensure minimum loading time
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
        
        loadingTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            setConsultationHistory([]);
            setLoading(false);
            setInitialLoadComplete(true);
          }
        }, remainingTime);
      }
    } catch (error) {
      console.error("❌ Error fetching consultation history:", error);
      if (mountedRef.current) {
        setConsultationHistory([]);
        setLoading(false);
        setInitialLoadComplete(true);
      }
    }
  }, [memoizedDoctor]);

  const addTreatmentDetails = useCallback(async (appointmentId, treatment) => {
    try {
      const response = await fetch(
        getApiUrl(`${API_CONFIG.ENDPOINTS.APPOINTMENTS}/treatment/${appointmentId}`, 'DOCTOR'),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            treatment: treatment,
            treatedBy: memoizedDoctor.fullname,
            treatmentDate: new Date().toISOString()
          }),
        }
      );

      if (response.ok && mountedRef.current) {
        fetchConsultationHistory(); // Refresh the list
        setSelectedConsultation(null);
      } else {
        console.error("Failed to add treatment details");
      }
    } catch (error) {
      console.error("Error adding treatment:", error);
    }
  }, [memoizedDoctor, fetchConsultationHistory]);

  const filteredHistory = React.useMemo(() => {
    return consultationHistory
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
  }, [consultationHistory, searchTerm, filterStatus, sortBy]);

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

  if (loading) {
    return (
      <div className="history-loading">
        <div className="loading-content">
          <div className="loading-spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
          <h3>Loading Consultation History...</h3>
          <p>Please wait while we fetch your patient consultation data</p>
          <div className="loading-progress">
            <div className="progress-bar"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="history-error">
        <div className="error-content">
          <h2>⚠️ Error</h2>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="retry-btn"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="doctor-history-container">
      <div className="history-header">
        <h1>Patient Consultation History</h1>
        <p>View and manage your patient consultations and treatments</p>
        {/* Debug info - can be toggled or removed in production */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.2)', 
            padding: '8px 15px', 
            borderRadius: '10px', 
            fontSize: '14px',
            marginTop: '15px',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            <strong>Debug:</strong> Dr. {memoizedDoctor?.fullname} ({memoizedDoctor?.email}) | 
            Records: {consultationHistory.length} | 
            Load Status: {initialLoadComplete ? 'Complete' : 'Loading'}
          </div>
        )}
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
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="date">Sort by Date</option>
            <option value="patient">Sort by Patient</option>
          </select>
        </div>
      </div>

      <div className="history-stats">
        <div className="stat-card">
          <h3>{consultationHistory.length}</h3>
          <p>Total Consultations</p>
        </div>
        <div className="stat-card">
          <h3>{consultationHistory.filter(c => c.status === "completed").length}</h3>
          <p>Completed</p>
        </div>
        <div className="stat-card">
          <h3>{consultationHistory.filter(c => c.treatment).length}</h3>
          <p>With Treatment</p>
        </div>
      </div>

      <div className="history-list">
        {filteredHistory.length === 0 ? (
          <div className="no-history">
            {consultationHistory.length === 0 ? (
              <>
                <h3>📋 No Consultation History Yet</h3>
                <p>Your patient consultation history will appear here once you start seeing patients.</p>
                <p>To get started:</p>
                <ul style={{ textAlign: 'left', maxWidth: '400px', margin: '20px auto' }}>
                  <li>✅ Patients book appointments with you</li>
                  <li>✅ Confirm appointments through your dashboard</li>
                  <li>✅ Conduct consultations</li>
                  <li>✅ Add treatment details here for future reference</li>
                </ul>
              </>
            ) : (
              <p>No consultations match your current search criteria.</p>
            )}
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
                  <span 
                    className="status-badge" 
                    style={{ backgroundColor: getStatusColor(consultation.status) }}
                  >
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

      {/* Treatment Modal */}
      {selectedConsultation && (
        <div className="modal-overlay">
          <div className="treatment-modal">
            <div className="modal-header">
              <h3>Add Treatment for {selectedConsultation.userName}</h3>
              <button 
                className="close-modal"
                onClick={() => setSelectedConsultation(null)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="patient-summary">
                <p><strong>Patient:</strong> {selectedConsultation.userName}</p>
                <p><strong>Date:</strong> {selectedConsultation.date} at {selectedConsultation.time}</p>
                {selectedConsultation.symptoms && (
                  <p><strong>Symptoms:</strong> {selectedConsultation.symptoms}</p>
                )}
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
                    placeholder="Enter detailed treatment provided, medications prescribed, recommendations, etc..."
                    required
                  ></textarea>
                </div>

                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={() => setSelectedConsultation(null)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="save-treatment-btn">
                    Save Treatment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}