import React from "react";
import { Link } from "react-router-dom";
import "../Css_for_all/UserDashNav.css";

function UserDashBoardNav() {
  const user = JSON.parse(localStorage.getItem("user"));
  const avatar = user?.avatar;
  return (
    <div className="nav">
      <h1 className="nav-logo">☘RemedyEase</h1>
      <div className="nav-links">
        
          <Link className="nav-link" to="/User/dashboard/Meetdoctor">Meet Doctor</Link>

          <Link className="nav-link" to="/User/dashboard/Appointments">Appointments</Link>

          <Link className="nav-link" to="/User/dashboard/Chat">Chat</Link>

          <Link className="nav-link" to="/User/dashboard/AIRecommanded">AI Recommendations</Link>

          <Link className="nav-link" to="/User/dashboard/Profile">Profile</Link>

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

export default UserDashBoardNav;
