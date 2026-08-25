import React from "react";
import "../Css_for_all/LandingPage.css";
import { Link } from "react-router-dom";
import { FiUser, FiShield } from "react-icons/fi";
import { LuStethoscope } from "react-icons/lu";

function LandingPage() {
  return (
    <div className="lp">
      {/* Header */}
      <header className="lp-header">
        <div className="lp-header-inner">
          <Link to="/" className="lp-brand">
            <span className="lp-brand-name">RemedyEase</span>
          </Link>
          <Link to="/admin/login" className="lp-admin-btn">
            <FiShield size={15} />
            <span>Admin Access</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="lp-main">
        {/* Hero */}
        <section className="lp-hero">
          <h1 className="lp-headline">Healthcare made simpler.</h1>
          <p className="lp-subtext">Choose how you'd like to continue.</p>
        </section>

        {/* Role Cards */}
        <section className="lp-cards">
          <Link to="/user" className="lp-card">
            <div className="lp-card-icon lp-card-icon--patient">
              <FiUser size={28} strokeWidth={1.8} />
            </div>
            <h2 className="lp-card-title">Patient</h2>
            <p className="lp-card-desc">
              Manage your healthcare, medicines, appointments and more.
            </p>
            <span className="lp-card-cta">
              Continue as Patient
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </Link>

          <Link to="/doctor" className="lp-card">
            <div className="lp-card-icon lp-card-icon--doctor">
              <LuStethoscope size={28} strokeWidth={1.8} />
            </div>
            <h2 className="lp-card-title">Doctor</h2>
            <p className="lp-card-desc">
              Manage patients, prescriptions, consultations and treatment.
            </p>
            <span className="lp-card-cta">
              Continue as Doctor
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="lp-footer">
        <p>&copy; {new Date().getFullYear()} RemedyEase. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default LandingPage;
