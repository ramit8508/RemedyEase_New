import React from "react";
import { Link } from "react-router-dom";
import "../../Css_for_all/UserDashHome.css";
import doctor1 from "../../images/doctor1.png";
import doctor2 from "../../images/doctor2.png";
import doctor3 from "../../images/doctor3.png";
import heroVisual from "../../images/healthcare_dashboard_hero.jpg";
import {
  FiCpu,
  FiUsers,
  FiCalendar,
  FiMessageCircle,
  FiArrowRight,
  FiShield,
  FiHeart,
  FiLock,
  FiShoppingBag,
  FiActivity,
  FiCheckCircle,
  FiClock,
  FiStar,
  FiAlertCircle,
} from "react-icons/fi";

function Home() {
  return (
    <div className="pdh">
      {/* ====== SECTION 1: HERO ====== */}
      <section className="pdh-hero">
        <div className="pdh-hero-inner">
          {/* Left — Text */}
          <div className="pdh-hero-text">
            <span className="pdh-hero-eyebrow">REMEDYEASE HEALTHCARE</span>
            <h1 className="pdh-hero-h1">
              Your health,<br />made simpler.
            </h1>
            <p className="pdh-hero-sub">
              Access trusted doctors, personalized health guidance and essential
              healthcare services — all in one place.
            </p>
            <div className="pdh-hero-actions">
              <Link to="/User/dashboard/SymptomChecker" className="pdh-btn-primary">
                Start AI Health Check
                <FiArrowRight size={16} />
              </Link>
              <Link to="/User/dashboard/Meetdoctor" className="pdh-btn-outline">
                Find a Doctor
              </Link>
            </div>
            <div className="pdh-hero-trust">
              <FiLock size={13} />
              <span>Secure</span>
              <span className="pdh-trust-dot">•</span>
              <FiHeart size={13} />
              <span>Patient-first</span>
              <span className="pdh-trust-dot">•</span>
              <FiShield size={13} />
              <span>Trusted healthcare platform</span>
            </div>
          </div>

          {/* Right — Visual */}
          <div className="pdh-hero-visual">
            <img
              src={heroVisual}
              alt="RemedyEase Healthcare Dashboard"
              className="pdh-hero-img"
              draggable="false"
            />
          </div>
        </div>
      </section>

      {/* ====== SECTION 2: QUICK ACTIONS ====== */}
      <section className="pdh-section">
        <div className="pdh-section-inner">
          <div className="pdh-section-header">
            <h2 className="pdh-section-title">How can we help today?</h2>
          </div>

          <div className="pdh-quick-grid">
            <Link to="/User/dashboard/SymptomChecker" className="pdh-quick-card">
              <div className="pdh-quick-icon pdh-quick-icon--green">
                <FiCpu size={22} strokeWidth={1.8} />
              </div>
              <h3 className="pdh-quick-title">AI Health Check</h3>
              <p className="pdh-quick-desc">
                Understand your symptoms with AI-powered guidance.
              </p>
              <span className="pdh-quick-cta">
                Check symptoms <FiArrowRight size={14} />
              </span>
            </Link>

            <Link to="/User/dashboard/Meetdoctor" className="pdh-quick-card">
              <div className="pdh-quick-icon pdh-quick-icon--blue">
                <FiUsers size={22} strokeWidth={1.8} />
              </div>
              <h3 className="pdh-quick-title">Meet a Doctor</h3>
              <p className="pdh-quick-desc">
                Find trusted doctors and explore their profiles.
              </p>
              <span className="pdh-quick-cta">
                Find a doctor <FiArrowRight size={14} />
              </span>
            </Link>

            <Link to="/User/dashboard/Appointments" className="pdh-quick-card">
              <div className="pdh-quick-icon pdh-quick-icon--purple">
                <FiCalendar size={22} strokeWidth={1.8} />
              </div>
              <h3 className="pdh-quick-title">Book Appointment</h3>
              <p className="pdh-quick-desc">
                Schedule a consultation at your convenience.
              </p>
              <span className="pdh-quick-cta">
                Book appointment <FiArrowRight size={14} />
              </span>
            </Link>

            <Link to="/User/dashboard/Chat" className="pdh-quick-card">
              <div className="pdh-quick-icon pdh-quick-icon--teal">
                <FiMessageCircle size={22} strokeWidth={1.8} />
              </div>
              <h3 className="pdh-quick-title">Chat with Doctor</h3>
              <p className="pdh-quick-desc">
                Get answers through secure real-time chat.
              </p>
              <span className="pdh-quick-cta">
                Start chat <FiArrowRight size={14} />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ====== SECTION 3: FEATURED DOCTORS ====== */}
      <section className="pdh-section pdh-section--muted">
        <div className="pdh-section-inner">
          <div className="pdh-section-header pdh-section-header--row">
            <div>
              <h2 className="pdh-section-title">Meet our doctors</h2>
              <p className="pdh-section-sub">
                Connect with trusted healthcare professionals.
              </p>
            </div>
            <Link to="/User/dashboard/Meetdoctor" className="pdh-section-link">
              View all doctors <FiArrowRight size={14} />
            </Link>
          </div>

          <div className="pdh-doctors-grid">
            {/* Doctor 1 */}
            <div className="pdh-doctor-card">
              <div className="pdh-doctor-photo-wrap">
                <img src={doctor1} alt="Dr Prachi Singh" className="pdh-doctor-photo" />
              </div>
              <div className="pdh-doctor-body">
                <div className="pdh-doctor-avail">
                  <span className="pdh-avail-dot" />
                  Available today
                </div>
                <h3 className="pdh-doctor-name">Dr Prachi Singh</h3>
                <p className="pdh-doctor-spec">Internal Medicine</p>
                <p className="pdh-doctor-qual">MBBS / MD Medicine</p>
                <div className="pdh-doctor-rating">
                  <FiStar size={14} className="pdh-star-icon" />
                  <span>4.8</span>
                </div>
                <div className="pdh-doctor-actions">
                  <Link to="/User/dashboard/Meetdoctor" className="pdh-btn-sm-primary">
                    View Profile
                  </Link>
                  <Link
                    to="/User/dashboard/Appointments"
                    className="pdh-btn-sm-outline"
                  >
                    Book Appointment
                  </Link>
                </div>
              </div>
            </div>

            {/* Doctor 2 */}
            <div className="pdh-doctor-card">
              <div className="pdh-doctor-photo-wrap">
                <img src={doctor2} alt="Dr Adward Prist" className="pdh-doctor-photo" />
              </div>
              <div className="pdh-doctor-body">
                <div className="pdh-doctor-avail">
                  <span className="pdh-avail-dot" />
                  Available today
                </div>
                <h3 className="pdh-doctor-name">Dr Adward Prist</h3>
                <p className="pdh-doctor-spec">Orthopedist</p>
                <p className="pdh-doctor-qual">MBBS / MS Orthopedics</p>
                <div className="pdh-doctor-rating">
                  <FiStar size={14} className="pdh-star-icon" />
                  <span>4.9</span>
                </div>
                <div className="pdh-doctor-actions">
                  <Link to="/User/dashboard/Meetdoctor" className="pdh-btn-sm-primary">
                    View Profile
                  </Link>
                  <Link
                    to="/User/dashboard/Appointments"
                    className="pdh-btn-sm-outline"
                  >
                    Book Appointment
                  </Link>
                </div>
              </div>
            </div>

            {/* Doctor 3 */}
            <div className="pdh-doctor-card">
              <div className="pdh-doctor-photo-wrap">
                <img src={doctor3} alt="Dr Ethan" className="pdh-doctor-photo" />
              </div>
              <div className="pdh-doctor-body">
                <div className="pdh-doctor-avail">
                  <span className="pdh-avail-dot" />
                  Available today
                </div>
                <h3 className="pdh-doctor-name">Dr Ethan</h3>
                <p className="pdh-doctor-spec">Cardiologist</p>
                <p className="pdh-doctor-qual">MBBS / DM Cardiology</p>
                <div className="pdh-doctor-rating">
                  <FiStar size={14} className="pdh-star-icon" />
                  <span>4.7</span>
                </div>
                <div className="pdh-doctor-actions">
                  <Link to="/User/dashboard/Meetdoctor" className="pdh-btn-sm-primary">
                    View Profile
                  </Link>
                  <Link
                    to="/User/dashboard/Appointments"
                    className="pdh-btn-sm-outline"
                  >
                    Book Appointment
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== SECTION 4: HEALTHCARE SERVICES ====== */}
      <section className="pdh-section">
        <div className="pdh-section-inner">
          <div className="pdh-section-header">
            <h2 className="pdh-section-title">
              Everything you need for better healthcare
            </h2>
            <p className="pdh-section-sub">
              Simple tools designed to make your healthcare journey easier.
            </p>
          </div>

          <div className="pdh-services-grid">
            <div className="pdh-service-card">
              <div className="pdh-service-icon pdh-service-icon--green">
                <FiCpu size={22} strokeWidth={1.8} />
              </div>
              <h3 className="pdh-service-title">AI Health Check</h3>
              <p className="pdh-service-desc">
                Personalized symptom analysis and health guidance.
              </p>
            </div>

            <div className="pdh-service-card">
              <div className="pdh-service-icon pdh-service-icon--blue">
                <FiUsers size={22} strokeWidth={1.8} />
              </div>
              <h3 className="pdh-service-title">Doctor Consultations</h3>
              <p className="pdh-service-desc">
                Connect with trusted healthcare professionals.
              </p>
            </div>

            <div className="pdh-service-card">
              <div className="pdh-service-icon pdh-service-icon--purple">
                <FiCalendar size={22} strokeWidth={1.8} />
              </div>
              <h3 className="pdh-service-title">Appointments</h3>
              <p className="pdh-service-desc">
                Manage upcoming and past consultations.
              </p>
            </div>

            <div className="pdh-service-card">
              <div className="pdh-service-icon pdh-service-icon--teal">
                <FiShoppingBag size={22} strokeWidth={1.8} />
              </div>
              <h3 className="pdh-service-title">Medical Store</h3>
              <p className="pdh-service-desc">
                Browse and access medicines conveniently.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ====== SECTION 5: PERSONALIZED HEALTH ====== */}
      <section className="pdh-section pdh-section--muted">
        <div className="pdh-section-inner">
          <div className="pdh-section-header">
            <h2 className="pdh-section-title">Your healthcare, in one place</h2>
            <p className="pdh-section-sub">
              Stay on top of your health with personalized insights.
            </p>
          </div>

          <div className="pdh-personal-grid">
            <div className="pdh-personal-card">
              <div className="pdh-personal-icon pdh-personal-icon--green">
                <FiCalendar size={20} strokeWidth={1.8} />
              </div>
              <h3 className="pdh-personal-title">Upcoming Appointment</h3>
              <div className="pdh-personal-detail">
                <p className="pdh-personal-doc">Dr Prachi Singh</p>
                <p className="pdh-personal-meta">Internal Medicine</p>
                <p className="pdh-personal-time">
                  <FiClock size={13} />
                  Tomorrow, 10:00 AM
                </p>
              </div>
              <Link to="/User/dashboard/Appointments" className="pdh-personal-cta">
                View appointment <FiArrowRight size={13} />
              </Link>
            </div>

            <div className="pdh-personal-card">
              <div className="pdh-personal-icon pdh-personal-icon--blue">
                <FiActivity size={20} strokeWidth={1.8} />
              </div>
              <h3 className="pdh-personal-title">Recent Health Activity</h3>
              <div className="pdh-personal-detail">
                <div className="pdh-activity-item">
                  <FiCheckCircle size={14} className="pdh-activity-check" />
                  <span>AI Health Check completed</span>
                </div>
                <p className="pdh-personal-meta pdh-personal-meta--light">
                  Symptom analysis • 2 days ago
                </p>
              </div>
              <Link to="/User/dashboard/SymptomChecker" className="pdh-personal-cta">
                View details <FiArrowRight size={13} />
              </Link>
            </div>

            <div className="pdh-personal-card">
              <div className="pdh-personal-icon pdh-personal-icon--purple">
                <FiHeart size={20} strokeWidth={1.8} />
              </div>
              <h3 className="pdh-personal-title">Health Support</h3>
              <div className="pdh-personal-detail">
                <p className="pdh-personal-support">
                  Need help deciding what to do next? Talk to a healthcare professional.
                </p>
              </div>
              <Link to="/User/dashboard/Chat" className="pdh-personal-cta">
                Talk to a doctor <FiArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ====== SECTION 6: AI HEALTH CHECK CTA ====== */}
      <section className="pdh-ai-cta">
        <div className="pdh-ai-cta-inner">
          <div className="pdh-ai-cta-content">
            <div className="pdh-ai-cta-icon">
              <FiCpu size={28} strokeWidth={1.6} />
            </div>
            <h2 className="pdh-ai-cta-title">
              Not sure what your symptoms mean?
            </h2>
            <p className="pdh-ai-cta-text">
              Get an AI-powered health assessment and understand whether you may
              need professional medical care.
            </p>
            <Link to="/User/dashboard/SymptomChecker" className="pdh-btn-primary">
              Start AI Health Check
              <FiArrowRight size={16} />
            </Link>
            <div className="pdh-ai-disclaimer">
              <FiAlertCircle size={13} />
              <span>
                AI guidance does not replace professional medical diagnosis.
                Always consult a qualified doctor for medical decisions.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ====== SECTION 7: FINAL CTA ====== */}
      <section className="pdh-final-cta">
        <div className="pdh-final-cta-inner">
          <h2 className="pdh-final-cta-title">Take control of your healthcare.</h2>
          <p className="pdh-final-cta-sub">
            From finding a doctor to managing appointments and getting health
            guidance, RemedyEase keeps everything connected.
          </p>
          <div className="pdh-final-cta-actions">
            <Link to="/User/dashboard/Meetdoctor" className="pdh-btn-primary">
              Find a Doctor
              <FiArrowRight size={16} />
            </Link>
            <Link to="/User/dashboard/SymptomChecker" className="pdh-btn-outline pdh-btn-outline--white">
              Start Health Check
            </Link>
          </div>
        </div>
      </section>

      {/* ====== SECTION 8: FOOTER ====== */}
      <footer className="pdh-footer">
        <div className="pdh-footer-inner">
          <div className="pdh-footer-brand">
            <span className="pdh-footer-name">☘ RemedyEase</span>
            <p className="pdh-footer-tagline">Healthcare made simpler.</p>
          </div>

          <nav className="pdh-footer-nav">
            <Link to="/User/dashboard/Home" className="pdh-footer-link">Home</Link>
            <Link to="/User/dashboard/SymptomChecker" className="pdh-footer-link">AI Health Check</Link>
            <Link to="/User/dashboard/Meetdoctor" className="pdh-footer-link">Meet Doctor</Link>
            <Link to="/User/dashboard/Appointments" className="pdh-footer-link">Appointments</Link>
            <Link to="/User/dashboard/medical-store" className="pdh-footer-link">Medical Store</Link>
            <Link to="/User/dashboard/Chat" className="pdh-footer-link">Chat</Link>
            <Link to="/User/dashboard/AIRecommanded" className="pdh-footer-link">Home Remedies</Link>
            <Link to="/User/dashboard/Profile" className="pdh-footer-link">Profile</Link>
          </nav>
        </div>

        <div className="pdh-footer-bottom">
          <p>&copy; 2026 RemedyEase. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;