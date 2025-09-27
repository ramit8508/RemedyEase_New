import React from "react";
import Logo from "../images/Logo.png";
import "../Css_for_all/LandingPage.css";
import user from "../images/user.png";
import UserLandingPage from "./UserLandingPage";
import { Link } from "react-router-dom";
import doctor from "../images/doctor.jpg";
function LandingPage() {
  return (
    <>
      <div className="landing-page">
        <img src={Logo} alt="Logo" className="image" />
        <div className="content">
          <h1 className="head0">Choose Your Role</h1>
          <h1 className="head1">How would you like to use RemedyEase?</h1>
          <div className="button-container">
            <div className="user-section">
              <img src={user} alt="user" className="User" />
              <Link to="/user" className="user-link">
                <button className="user-button">Continue as Patient</button>
              </Link>
              <p className="para0">Find doctor and have consultations</p>
            </div>
            <div className="user-section">
              <img src={doctor} alt="user" className="User" />
              <Link to="/doctor" className="user-link">
                <button className="doctor-button">Continue as Doctor</button>
              </Link>
              <p className="para2">Provides care to the patients</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default LandingPage;
