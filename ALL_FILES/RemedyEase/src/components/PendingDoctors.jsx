import React, { useEffect, useState } from "react";
import { toast } from 'react-toastify';
import "../Css_for_all/PendingDoctors.css";

const PendingDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPendingDoctors();
  }, []);

  const fetchPendingDoctors = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const doctorBackendUrl = import.meta.env.VITE_DOCTOR_BACKEND_URL || '';
      
      const response = await fetch(
        doctorBackendUrl ? `${doctorBackendUrl}/api/v1/admin/doctors/pending` : '/api/v1/admin/doctors/pending',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      setDoctors(data.data || []);
    } catch (error) {
      console.error("Error fetching pending doctors:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (doctorId) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const doctorBackendUrl = import.meta.env.VITE_DOCTOR_BACKEND_URL || '';
      
      console.log('Approving doctor...', doctorId);
      
      const response = await fetch(
        doctorBackendUrl ? `${doctorBackendUrl}/api/v1/admin/doctors/${doctorId}/approval` : `/api/v1/admin/doctors/${doctorId}/approval`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ approvalStatus: "approved" }),
        }
      );

      const result = await response.json();
      console.log('Approval response:', result);

      if (response.ok) {
        toast.success(result.message || "Doctor approved successfully! Email notification sent to doctor.");
        fetchPendingDoctors();
      } else {
        toast.error(result.message || "Failed to approve doctor. Please try again.");
        console.error('Approval error:', result);
      }
    } catch (error) {
      console.error("Error approving doctor:", error);
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.warning("Please provide a reason for rejection");
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const doctorBackendUrl = import.meta.env.VITE_DOCTOR_BACKEND_URL || '';
      
      console.log('Rejecting doctor...', selectedDoctor._id);
      
      const response = await fetch(
        doctorBackendUrl ? `${doctorBackendUrl}/api/v1/admin/doctors/${selectedDoctor._id}/approval` : `/api/v1/admin/doctors/${selectedDoctor._id}/approval`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            approvalStatus: "rejected",
            rejectionReason: rejectionReason,
          }),
        }
      );

      const result = await response.json();
      console.log('Rejection response:', result);

      if (response.ok) {
        toast.success(result.message || "Doctor rejected successfully! Email notification sent to doctor.");
        setSelectedDoctor(null);
        setRejectionReason("");
        fetchPendingDoctors();
      } else {
        toast.error(result.message || "Failed to reject doctor. Please try again.");
        console.error('Rejection error:', result);
      }
    } catch (error) {
      console.error("Error rejecting doctor:", error);
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="admin-loading">Loading pending doctors...</div>;
  }

  return (
    <div className="pending-doctors">
      <h1 className="page-title">Pending Doctor Approvals</h1>
      <p className="page-subtitle">
        Review and approve doctor registration requests
      </p>

      {doctors.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <h3>No Pending Approvals</h3>
          <p>All doctor registrations have been reviewed</p>
        </div>
      ) : (
        <div className="doctors-grid">
          {doctors.map((doctor) => (
            <div key={doctor._id} className="doctor-card">
              <div className="doctor-avatar">
                <img
                  src={doctor.avatar || "/default-doctor.png"}
                  alt={doctor.fullname}
                  onError={(e) => {
                    e.target.src = "/default-doctor.png";
                  }}
                />
              </div>
              <div className="doctor-info">
                <h3>{doctor.fullname}</h3>
                <p className="doctor-email">{doctor.email}</p>
                <p className="doctor-specialization">{doctor.specialization}</p>
                <div className="doctor-credentials">
                  <span>
                    <strong>Reg No:</strong> {doctor.registrationNumber}
                  </span>
                  <span>
                    <strong>Degree:</strong> {doctor.degree}
                  </span>
                </div>
              </div>
              <div className="doctor-actions">
                <button
                  onClick={() => handleApprove(doctor._id)}
                  className="btn-approve"
                  disabled={actionLoading}
                >
                  {actionLoading ? "Processing..." : "✓ Approve"}
                </button>
                <button
                  onClick={() => setSelectedDoctor(doctor)}
                  className="btn-reject"
                  disabled={actionLoading}
                >
                  ✗ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedDoctor && (
        <div className="modal-overlay" onClick={() => setSelectedDoctor(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Reject Doctor Application</h2>
            <p>
              You are about to reject <strong>{selectedDoctor.fullname}</strong>
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Please provide a reason for rejection..."
              rows="4"
              className="rejection-textarea"
            />
            <div className="modal-actions">
              <button
                onClick={handleReject}
                className="btn-confirm-reject"
                disabled={actionLoading}
              >
                {actionLoading ? "Rejecting..." : "Confirm Rejection"}
              </button>
              <button
                onClick={() => {
                  setSelectedDoctor(null);
                  setRejectionReason("");
                }}
                className="btn-cancel"
                disabled={actionLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingDoctors;
