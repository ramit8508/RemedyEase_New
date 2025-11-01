import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Css_for_all/PrescriptionView.css';

// Get the backend URL from environment variables
const API_BASE = import.meta.env.VITE_DOCTOR_BACKEND_URL || "";

export default function PrescriptionView({ appointmentId }) {
  const navigate = useNavigate();
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPrescription();
  }, [appointmentId]);

  const fetchPrescription = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/appointments/prescription/${appointmentId}`);
      const data = await response.json();

      if (response.ok) {
        setPrescription(data.data);
      } else {
        // No prescription found is not an error, just don't show anything
        if (response.status === 404) {
          setPrescription(null);
        } else {
          setError(data.message || 'Failed to load prescription');
        }
      }
    } catch (err) {
      console.error('Error fetching prescription:', err);
      setError('Failed to load prescription');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (prescription && prescription.prescriptionFile) {
      window.open(prescription.prescriptionFile, '_blank');
    }
  };

  const handleGoToStore = () => {
    navigate('/user/dashboard/medical-store');
  };

  const handleView = () => {
    if (prescription && prescription.prescriptionFile) {
      window.open(prescription.prescriptionFile, '_blank');
    }
  };

  if (loading) {
    return <div className="prescription-loading">Loading prescription...</div>;
  }

  if (error) {
    return <div className="prescription-error">{error}</div>;
  }

  if (!prescription) {
    return null; // Don't show anything if no prescription
  }

  return (
    <div className="prescription-view-container">
      <div className="prescription-header">
        <h4>📋 Prescription Available</h4>
        <span className="upload-date">
          Uploaded: {new Date(prescription.uploadedAt).toLocaleDateString()}
        </span>
      </div>
      
      <div className="prescription-actions">
        <button onClick={handleGoToStore} className="store-btn">
          🏥 Go to Medical Store
        </button>
        <button onClick={handleDownload} className="download-btn">
          📥 Download
        </button>
      </div>
    </div>
  );
}
