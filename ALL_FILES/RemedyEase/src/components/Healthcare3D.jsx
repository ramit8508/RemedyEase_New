import React from "react";
import doctorHero from "../images/doctor_3d_hero.jpg";
import { FiCalendar, FiShield } from "react-icons/fi";
import "../Css_for_all/UserHome.css";

/* ============================================================
   Healthcare3D — Static Doctor 3D Hero Model for Patients
   Exact visual match to Doctor Landing Page hero model
   Completely static: no hover tilt, no transforms, no mouse tracking
   Patient USPs: Flexible Consultations, Real-time Chat, AI Health Insights
   ============================================================ */

export default function Healthcare3D() {
  return (
    <div className="uh-hero-visual">
      <div className="uh-hero-img-wrap">
        <img
          src={doctorHero}
          alt="RemedyEase 3D Doctor"
          className="uh-hero-img"
          draggable="false"
        />
        <div className="uh-hero-img-overlay" />
      </div>

      {/* Floating Card Top-Left: Patient Consultations Schedule */}
      <div className="uh-float-card uh-float-card--appt">
        <div className="uh-float-head">
          <FiCalendar size={14} className="uh-float-ico" />
          <span>Upcoming Consultations</span>
        </div>
        <ul className="uh-float-list">
          <li><span className="uh-time">09:30</span> Dr. Sarah — Video Call</li>
          <li><span className="uh-time">10:15</span> Dr. Ben — Live Chat</li>
          <li><span className="uh-time">11:00</span> Dr. Emily — Health Review</li>
        </ul>
      </div>

      {/* Floating Card Bottom-Right: Verified Doctors Available */}
      <div className="uh-float-card uh-float-card--patients">
        <div className="uh-float-head">
          <FiShield size={14} className="uh-float-ico" />
          <span>Verified Doctors</span>
        </div>
        <p className="uh-float-big">150+</p>
        <span className="uh-float-badge-up">Available 24/7</span>
      </div>
    </div>
  );
}
