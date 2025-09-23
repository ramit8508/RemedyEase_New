import React from "react";
import { Link } from "react-router-dom";
import "../Css_for_all/UserDashNav.css";

function DoctorDashBoardNav() {
  const user = JSON.parse(localStorage.getItem("user"));
  const avatar = user?.avatar;
  return (
    <div className="nav">
      <h1 className="nav-logo">☘RemedyEase</h1>
      <div className="nav-links">
        
          <Link className="nav-link" to="/doctor/dashboard/home">Home Page</Link>

          <Link className="nav-link" to="/doctor/dashboard/appointments">Appointments</Link>

          <Link className="nav-link" to="/doctor/dashboard/history">History</Link>

          <Link className="nav-link" to="/doctor/dashboard/ai">AI Recommendations</Link>

          <Link className="nav-link" to="/doctor/dashboard/profile">Profile</Link>

          <img
            src={avatar}
            alt="User Avatar"
            className="nav-link"
            style={{ width: 40, height: 40, borderRadius: "50%" }}
          />
          </div>
        
      
    </div>
  );
}

export default DoctorDashBoardNav;
