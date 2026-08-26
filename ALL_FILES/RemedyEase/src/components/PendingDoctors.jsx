import React, { useEffect, useState, useCallback } from "react";
import {
  FiCheck,
  FiX,
  FiEye,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiShield,
  FiAward,
} from "react-icons/fi";
import "../Css_for_all/AdminDashboard.css";

export default function PendingDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals state
  const [selectedDoctorDetail, setSelectedDoctorDetail] = useState(null);
  const [doctorToReject, setDoctorToReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [successToast, setSuccessToast] = useState("");

  const token = localStorage.getItem("adminToken");

  const fetchPendingDoctors = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/v1/admin/doctors/pending", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setDoctors(Array.isArray(data.data) ? data.data : []);
      } else {
        setError(data.message || "Failed to fetch pending doctor applications");
      }
    } catch (err) {
      console.error("Pending doctors fetch error:", err);
      setError("Unable to connect to doctor service. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPendingDoctors();
  }, [fetchPendingDoctors]);

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 3500);
  };

  // Approve Doctor
  const handleApprove = async (doctor) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/doctors/${doctor._id}/approval`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ approvalStatus: "approved" }),
      });

      const data = await res.json();
      if (res.ok) {
        setDoctors((prev) => prev.filter((d) => d._id !== doctor._id));
        if (selectedDoctorDetail?._id === doctor._id) {
          setSelectedDoctorDetail(null);
        }
        showToast(`✓ Dr. ${doctor.fullname} approved successfully!`);
      } else {
        alert(data.message || "Failed to approve doctor");
      }
    } catch (err) {
      console.error("Approval error:", err);
      alert("Network error while approving doctor.");
    } finally {
      setActionLoading(false);
    }
  };

  // Reject Doctor
  const handleReject = async () => {
    if (!doctorToReject) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/v1/admin/doctors/${doctorToReject._id}/approval`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          approvalStatus: "rejected",
          rejectionReason: rejectionReason || "Application credentials could not be verified",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setDoctors((prev) => prev.filter((d) => d._id !== doctorToReject._id));
        setDoctorToReject(null);
        setRejectionReason("");
        showToast(`Dr. ${doctorToReject.fullname} application was rejected.`);
      } else {
        alert(data.message || "Failed to reject doctor");
      }
    } catch (err) {
      console.error("Rejection error:", err);
      alert("Network error while rejecting doctor.");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div>
      {/* Toast */}
      {successToast && (
        <div style={{ position: "fixed", top: "24px", right: "24px", background: "#16a34a", color: "#ffffff", padding: "12px 20px", borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 1200, fontWeight: "700", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <FiCheckCircle size={16} /> {successToast}
        </div>
      )}

      {/* Page Header */}
      <div className="ap-page-header">
        <div>
          <h1 className="ap-page-title">Pending Doctor Approvals</h1>
          <p className="ap-page-subtitle">
            Review medical licenses, state council registrations, and qualifications for onboarding.
          </p>
        </div>

        <button
          type="button"
          className="ap-btn-action"
          onClick={() => fetchPendingDoctors()}
          disabled={loading}
        >
          <FiRefreshCw size={13} className={loading ? "hr-spin" : ""} /> Refresh
        </button>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "14px 18px", borderRadius: "12px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", color: "#b91c1c", fontSize: "13.5px" }}>
          <FiAlertCircle size={16} /> {error}
        </div>
      )}

      {/* Main Review Card */}
      <div className="ap-table-card">
        <div className="ap-toolbar">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>
              Pending Applications
            </span>
            <span className="ap-badge ap-badge--pending">{doctors.length} Awaiting Review</span>
          </div>
        </div>

        <div className="ap-table-responsive">
          <table className="ap-table">
            <thead>
              <tr>
                <th>Doctor Candidate</th>
                <th>Email</th>
                <th>Specialization</th>
                <th>Registration / License #</th>
                <th>Submitted</th>
                <th style={{ textAlign: "right" }}>Review Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "40px" }}>
                    <div className="hr-spinner" style={{ width: "28px", height: "28px" }} />
                    <p style={{ fontSize: "13px", color: "#64748b", marginTop: "10px" }}>Fetching applications...</p>
                  </td>
                </tr>
              ) : doctors.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "50px 20px" }}>
                    <div style={{ fontSize: "36px", marginBottom: "10px" }}>🎉</div>
                    <strong style={{ fontSize: "15px", color: "#0f172a", display: "block", marginBottom: "4px" }}>
                      No Pending Applications
                    </strong>
                    <p style={{ fontSize: "13.5px", color: "#64748b", margin: 0 }}>
                      All medical practitioner registrations have been reviewed and processed.
                    </p>
                  </td>
                </tr>
              ) : (
                doctors.map((doc) => (
                  <tr key={doc._id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        {doc.avatar ? (
                          <img
                            src={doc.avatar}
                            alt={doc.fullname}
                            style={{ width: "36px", height: "36px", borderRadius: "10px", objectFit: "cover" }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "10px",
                              background: "#dcfce7",
                              color: "#15803d",
                              fontWeight: "800",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "13px",
                            }}
                          >
                            {doc.fullname?.charAt(0) || "D"}
                          </div>
                        )}
                        <div>
                          <strong style={{ display: "block" }}>Dr. {doc.fullname}</strong>
                          <span style={{ fontSize: "11.5px", color: "#64748b" }}>{doc.degree}</span>
                        </div>
                      </div>
                    </td>
                    <td>{doc.email}</td>
                    <td>
                      <span style={{ color: "#16a34a", fontWeight: "600" }}>{doc.specialization}</span>
                    </td>
                    <td>
                      <strong style={{ fontFamily: "monospace", fontSize: "13px" }}>
                        {doc.registrationNumber || "Not provided"}
                      </strong>
                    </td>
                    <td>{formatDate(doc.createdAt)}</td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button
                          type="button"
                          className="ap-btn-action"
                          onClick={() => setSelectedDoctorDetail(doc)}
                          title="View application details"
                        >
                          <FiEye size={13} /> View
                        </button>
                        <button
                          type="button"
                          className="ap-btn-action ap-btn-action--approve"
                          onClick={() => handleApprove(doc)}
                          disabled={actionLoading}
                          title="Approve doctor"
                        >
                          <FiCheck size={13} /> Approve
                        </button>
                        <button
                          type="button"
                          className="ap-btn-action ap-btn-action--reject"
                          onClick={() => setDoctorToReject(doc)}
                          disabled={actionLoading}
                          title="Reject doctor"
                        >
                          <FiX size={13} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Doctor Details Modal ─── */}
      {selectedDoctorDetail && (
        <div className="ap-modal-backdrop" onClick={() => setSelectedDoctorDetail(null)}>
          <div className="ap-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setSelectedDoctorDetail(null)}
              style={{ position: "absolute", top: "18px", right: "18px", background: "#f1f5f9", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <FiX size={16} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "18px" }}>
              {selectedDoctorDetail.avatar ? (
                <img
                  src={selectedDoctorDetail.avatar}
                  alt={selectedDoctorDetail.fullname}
                  style={{ width: "56px", height: "56px", borderRadius: "16px", objectFit: "cover" }}
                />
              ) : (
                <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "#dcfce7", color: "#15803d", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: "800" }}>
                  {selectedDoctorDetail.fullname?.charAt(0) || "D"}
                </div>
              )}
              <div>
                <h3 className="ap-modal-title" style={{ margin: "0 0 2px" }}>
                  Dr. {selectedDoctorDetail.fullname}
                </h3>
                <span style={{ fontSize: "13px", color: "#16a34a", fontWeight: "700" }}>
                  {selectedDoctorDetail.specialization} • {selectedDoctorDetail.degree}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13.5px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: "#64748b" }}>Registration Number:</span>
                <strong style={{ fontFamily: "monospace" }}>{selectedDoctorDetail.registrationNumber || "N/A"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: "#64748b" }}>Email:</span>
                <strong>{selectedDoctorDetail.email}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: "#64748b" }}>Clinic / Hospital:</span>
                <strong>{selectedDoctorDetail.clinic || "Private Practice"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: "#64748b" }}>Experience:</span>
                <strong>{selectedDoctorDetail.experience || "Not stated"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                <span style={{ color: "#64748b" }}>Submission Date:</span>
                <strong>{formatDate(selectedDoctorDetail.createdAt)}</strong>
              </div>
              {selectedDoctorDetail.bio && (
                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "4px" }}>
                    Doctor Bio:
                  </span>
                  <p style={{ margin: 0, color: "#334155" }}>{selectedDoctorDetail.bio}</p>
                </div>
              )}
            </div>

            <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="ap-btn-action ap-btn-action--reject"
                onClick={() => {
                  setDoctorToReject(selectedDoctorDetail);
                  setSelectedDoctorDetail(null);
                }}
              >
                <FiX size={13} /> Reject
              </button>
              <button
                type="button"
                className="ap-btn-action ap-btn-action--approve"
                onClick={() => handleApprove(selectedDoctorDetail)}
              >
                <FiCheck size={13} /> Approve Doctor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Rejection Reason Modal ─── */}
      {doctorToReject && (
        <div className="ap-modal-backdrop" onClick={() => setDoctorToReject(null)}>
          <div className="ap-modal-card" style={{ maxWidth: "460px" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="ap-modal-title">Reject Doctor Registration</h3>
            <p style={{ fontSize: "13.5px", color: "#64748b", margin: "0 0 16px" }}>
              Specify the reason for rejecting Dr. {doctorToReject.fullname}'s registration.
            </p>

            <textarea
              className="ap-table-search"
              rows={4}
              placeholder="e.g. Registration number verification failed with the state medical register..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", resize: "vertical" }}
            />

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "18px" }}>
              <button
                type="button"
                className="ap-btn-action"
                onClick={() => setDoctorToReject(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ap-btn-action ap-btn-action--reject"
                onClick={handleReject}
                disabled={actionLoading}
              >
                {actionLoading ? "Processing..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
