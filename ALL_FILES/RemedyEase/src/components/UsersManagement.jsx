import React, { useEffect, useState } from "react";
import "../Css_for_all/UsersManagement.css";

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // Auto-retry after 3 seconds if there was an error and retry count < 3
    if (error && retryCount < 3) {
      const timer = setTimeout(() => {
        console.log(`Retrying users fetch... (Attempt ${retryCount + 1}/3)`);
        setError(null);
        setLoading(true);
        setRetryCount(prev => prev + 1);
        fetchUsers();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [error, retryCount]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const userBackendUrl = import.meta.env.VITE_BACKEND_URL || '';
      
      const response = await fetch(
        userBackendUrl ? `${userBackendUrl}/api/v1/admin/users` : '/api/v1/admin/users',
        {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        }
      );
      
      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error('Backend returned non-JSON response. Backend may be sleeping.');
        throw new Error('Backend is waking up. Retrying automatically...');
      }
      
      const data = await response.json();
      setUsers(data.data || []);
      setError(null);
      setRetryCount(0);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleBlock = async (userId, currentStatus) => {
    try {
      const token = localStorage.getItem("adminToken");
      const userBackendUrl = import.meta.env.VITE_BACKEND_URL || '';
      
      const response = await fetch(
        userBackendUrl ? `${userBackendUrl}/api/v1/admin/users/${userId}/block` : `/api/v1/admin/users/${userId}/block`,
        {
          method: "PUT",
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: "include",
          body: JSON.stringify({ isBlocked: !currentStatus })
        }
      );

      if (response.ok) {
        alert(`User ${currentStatus ? "unblocked" : "blocked"} successfully!`);
        fetchUsers();
      }
    } catch (error) {
      console.error("Error toggling user block:", error);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading" style={{ textAlign: 'center', padding: '50px' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
        <h2>Loading users...</h2>
        {retryCount > 0 && <p>Retry attempt {retryCount}/3</p>}
        <p style={{ color: '#666', fontSize: '14px' }}>Backend is waking up, please wait...</p>
      </div>
    );
  }

  if (error && retryCount >= 3) {
    return (
      <div className="admin-error" style={{ textAlign: 'center', padding: '50px' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
        <h2>Unable to load users</h2>
        <p style={{ color: '#d32f2f', marginBottom: '20px' }}>{error}</p>
        <button 
          onClick={() => {
            setRetryCount(0);
            setError(null);
            setLoading(true);
            fetchUsers();
          }}
          style={{
            backgroundColor: '#388e3c',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="users-management">
      <h1 className="page-title">Users Management</h1>
      <p className="page-subtitle">Manage all registered users</p>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Avatar</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Blood Group</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>
                  <img
                    src={user.avatar || "/default-avatar.png"}
                    alt={user.fullname}
                    className="table-avatar"
                  />
                </td>
                <td>{user.fullname}</td>
                <td>{user.email}</td>
                <td>{user.bloodGroup || "N/A"}</td>
                <td>
                  <span className={`status-badge ${user.isBlocked ? "blocked" : "active"}`}>
                    {user.isBlocked ? "Blocked" : "Active"}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => toggleBlock(user._id, user.isBlocked)}
                    className={`btn-toggle ${user.isBlocked ? "btn-unblock" : "btn-block"}`}
                  >
                    {user.isBlocked ? "Unblock" : "Block"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersManagement;
