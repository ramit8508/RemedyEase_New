import React, { useEffect, useState } from "react";
import "../Css_for_all/UsersManagement.css";

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/admin/users`,
        {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        }
      );
      
      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error('Backend returned non-JSON response. Backend may be sleeping.');
        alert('Backend is waking up. Please refresh the page in 30 seconds.');
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      setUsers(data.data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      alert('Error loading users. Backend may be sleeping. Please refresh the page in 30 seconds.');
    } finally {
      setLoading(false);
    }
  };

  const toggleBlock = async (userId, currentStatus) => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/admin/users/${userId}/block`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
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

  if (loading) return <div className="admin-loading">Loading users...</div>;

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
