import React, { useEffect, useState } from "react";
import "../Css_for_all/AdminAppointments.css";

const AdminPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        `${import.meta.env.VITE_DOCTOR_BACKEND_URL}/api/v1/admin/prescriptions`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      setPrescriptions(data.data || []);
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="admin-loading">Loading prescriptions...</div>;

  return (
    <div className="admin-prescriptions">
      <h1 className="page-title">Prescriptions</h1>
      <p className="page-subtitle">View all uploaded prescriptions</p>

      {prescriptions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💊</div>
          <h3>No Prescriptions</h3>
          <p>No prescriptions have been uploaded yet</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date Uploaded</th>
                <th>Doctor</th>
                <th>Patient</th>
                <th>Appointment Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {prescriptions.map((apt) => (
                <tr key={apt._id}>
                  <td>{new Date(apt.prescriptionUploadedAt).toLocaleDateString()}</td>
                  <td>{apt.doctorEmail}</td>
                  <td>{apt.userEmail}</td>
                  <td>{new Date(apt.appointmentDate).toLocaleDateString()}</td>
                  <td>
                    <a
                      href={apt.prescriptionFile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-download"
                    >
                      View/Download
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminPrescriptions;
