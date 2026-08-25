import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../../Css_for_all/DoctorLanding.css";
import doctorHero from "../../images/doctor_3d_hero.jpg";
import doctor4 from "../../images/doctor4.jpg";
import doctor5 from "../../images/doctor5.png";
import doctor6 from "../../images/doctor6.jpg";
import Footerdoctor from "../../components/Footerdoctor";
import {
  FiUsers, FiVideo, FiMessageCircle, FiCpu, FiArrowRight,
  FiShield, FiCheck, FiCalendar, FiClipboard, FiMail,
  FiSettings, FiActivity, FiFileText, FiBarChart2, FiLayout,
  FiHeart, FiStar, FiList, FiClock, FiUser, FiSearch,
  FiPhone, FiSend, FiEdit, FiTrendingUp, FiAlertCircle,
  FiToggleLeft, FiToggleRight, FiBell, FiLock, FiGlobe
} from "react-icons/fi";

/* ─── Dashboard tab content components ─── */

function DashTabDashboard() {
  return (
    <>
      <div className="dl-dash-greeting">
        <div>
          <h3 className="dl-dash-greeting-h">Good morning, Doctor</h3>
          <p className="dl-dash-greeting-sub">Here's your day at a glance.</p>
        </div>
        <span className="dl-dash-date">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
        </span>
      </div>
      <div className="dl-dash-stats">
        <div className="dl-dash-stat">
          <div className="dl-dash-stat-icon dl-dash-stat-icon--g"><FiCalendar size={16} /></div>
          <div>
            <p className="dl-dash-stat-val">8</p>
            <p className="dl-dash-stat-lbl">Today's Appointments</p>
          </div>
        </div>
        <div className="dl-dash-stat">
          <div className="dl-dash-stat-icon dl-dash-stat-icon--b"><FiUsers size={16} /></div>
          <div>
            <p className="dl-dash-stat-val">124</p>
            <p className="dl-dash-stat-lbl">Active Patients</p>
          </div>
        </div>
        <div className="dl-dash-stat">
          <div className="dl-dash-stat-icon dl-dash-stat-icon--p"><FiMail size={16} /></div>
          <div>
            <p className="dl-dash-stat-val">3</p>
            <p className="dl-dash-stat-lbl">Unread Messages</p>
          </div>
        </div>
      </div>
      <div className="dl-dash-upcoming">
        <h4 className="dl-dash-section-h">Upcoming Consultations</h4>
        <div className="dl-dash-appt-list">
          <div className="dl-dash-appt-row">
            <span className="dl-dash-appt-time">09:30 AM</span>
            <span className="dl-dash-appt-name">Sarah K.</span>
            <span className="dl-dash-appt-type">Follow-up</span>
            <span className="dl-dash-appt-badge dl-dash-appt-badge--video">Video</span>
          </div>
          <div className="dl-dash-appt-row">
            <span className="dl-dash-appt-time">10:15 AM</span>
            <span className="dl-dash-appt-name">Michael R.</span>
            <span className="dl-dash-appt-type">Consultation</span>
            <span className="dl-dash-appt-badge dl-dash-appt-badge--chat">Chat</span>
          </div>
          <div className="dl-dash-appt-row">
            <span className="dl-dash-appt-time">11:00 AM</span>
            <span className="dl-dash-appt-name">Emma W.</span>
            <span className="dl-dash-appt-type">Check-up</span>
            <span className="dl-dash-appt-badge dl-dash-appt-badge--video">Video</span>
          </div>
        </div>
      </div>
    </>
  );
}

function DashTabPatients() {
  const patients = [
    { name: "Sarah K.", age: 34, condition: "Hypertension", status: "Active", lastVisit: "Aug 20" },
    { name: "Michael R.", age: 45, condition: "Diabetes Type 2", status: "Active", lastVisit: "Aug 18" },
    { name: "Emma W.", age: 28, condition: "Migraine", status: "Follow-up", lastVisit: "Aug 15" },
    { name: "James L.", age: 52, condition: "Back Pain", status: "Active", lastVisit: "Aug 12" },
    { name: "Olivia P.", age: 39, condition: "Allergies", status: "Recovered", lastVisit: "Aug 8" },
  ];
  return (
    <>
      <div className="dl-dash-greeting">
        <div>
          <h3 className="dl-dash-greeting-h">Patient Records</h3>
          <p className="dl-dash-greeting-sub">Manage and review your patient information.</p>
        </div>
        <div className="dl-dash-search-bar">
          <FiSearch size={14} />
          <span>Search patients…</span>
        </div>
      </div>
      <div className="dl-dash-table">
        <div className="dl-dash-table-head">
          <span className="dl-dash-th dl-dash-th--name">Patient</span>
          <span className="dl-dash-th">Age</span>
          <span className="dl-dash-th">Condition</span>
          <span className="dl-dash-th">Status</span>
          <span className="dl-dash-th">Last Visit</span>
        </div>
        {patients.map((p, i) => (
          <div className="dl-dash-table-row" key={i}>
            <span className="dl-dash-td dl-dash-td--name">
              <span className="dl-dash-patient-avatar">{p.name.charAt(0)}</span>
              {p.name}
            </span>
            <span className="dl-dash-td">{p.age}</span>
            <span className="dl-dash-td">{p.condition}</span>
            <span className="dl-dash-td">
              <span className={`dl-dash-status dl-dash-status--${p.status === "Active" ? "g" : p.status === "Recovered" ? "b" : "a"}`}>
                {p.status}
              </span>
            </span>
            <span className="dl-dash-td dl-dash-td--muted">{p.lastVisit}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function DashTabAppointments() {
  const days = [
    { label: "Mon", num: "25", appts: 3, active: true },
    { label: "Tue", num: "26", appts: 5 },
    { label: "Wed", num: "27", appts: 2 },
    { label: "Thu", num: "28", appts: 4 },
    { label: "Fri", num: "29", appts: 1 },
  ];
  return (
    <>
      <div className="dl-dash-greeting">
        <div>
          <h3 className="dl-dash-greeting-h">Appointments</h3>
          <p className="dl-dash-greeting-sub">Your weekly schedule overview.</p>
        </div>
      </div>
      <div className="dl-dash-week-strip">
        {days.map((d, i) => (
          <div className={`dl-dash-day-card ${d.active ? "dl-dash-day-card--active" : ""}`} key={i}>
            <span className="dl-dash-day-label">{d.label}</span>
            <span className="dl-dash-day-num">{d.num}</span>
            <span className="dl-dash-day-count">{d.appts} appts</span>
          </div>
        ))}
      </div>
      <h4 className="dl-dash-section-h">Monday, Aug 25</h4>
      <div className="dl-dash-appt-list">
        <div className="dl-dash-appt-row">
          <span className="dl-dash-appt-time">09:30 AM</span>
          <span className="dl-dash-appt-name">Sarah K.</span>
          <span className="dl-dash-appt-type">Follow-up</span>
          <span className="dl-dash-appt-badge dl-dash-appt-badge--video">Video</span>
        </div>
        <div className="dl-dash-appt-row">
          <span className="dl-dash-appt-time">11:00 AM</span>
          <span className="dl-dash-appt-name">James L.</span>
          <span className="dl-dash-appt-type">Consultation</span>
          <span className="dl-dash-appt-badge dl-dash-appt-badge--chat">Chat</span>
        </div>
        <div className="dl-dash-appt-row">
          <span className="dl-dash-appt-time">02:30 PM</span>
          <span className="dl-dash-appt-name">Olivia P.</span>
          <span className="dl-dash-appt-type">Review</span>
          <span className="dl-dash-appt-badge dl-dash-appt-badge--video">Video</span>
        </div>
      </div>
    </>
  );
}

function DashTabMessages() {
  const msgs = [
    { from: "Sarah K.", preview: "Thank you for the prescription, Doctor…", time: "2m ago", unread: true },
    { from: "Michael R.", preview: "I have a question about the dosage…", time: "15m ago", unread: true },
    { from: "Emma W.", preview: "My symptoms have improved since last…", time: "1h ago", unread: false },
    { from: "James L.", preview: "Can we reschedule Thursday's appointment?", time: "3h ago", unread: false },
  ];
  return (
    <>
      <div className="dl-dash-greeting">
        <div>
          <h3 className="dl-dash-greeting-h">Messages</h3>
          <p className="dl-dash-greeting-sub">Recent patient conversations.</p>
        </div>
        <span className="dl-dash-unread-count">2 unread</span>
      </div>
      <div className="dl-dash-msg-list">
        {msgs.map((m, i) => (
          <div className={`dl-dash-msg-row ${m.unread ? "dl-dash-msg-row--unread" : ""}`} key={i}>
            <span className="dl-dash-patient-avatar">{m.from.charAt(0)}</span>
            <div className="dl-dash-msg-content">
              <div className="dl-dash-msg-top">
                <strong className="dl-dash-msg-from">{m.from}</strong>
                <span className="dl-dash-msg-time">{m.time}</span>
              </div>
              <p className="dl-dash-msg-preview">{m.preview}</p>
            </div>
            {m.unread && <span className="dl-dash-msg-dot" />}
          </div>
        ))}
      </div>
    </>
  );
}

function DashTabPrescriptions() {
  const rxList = [
    { patient: "Sarah K.", drug: "Amlodipine 5mg", date: "Aug 20", status: "Sent" },
    { patient: "Michael R.", drug: "Metformin 500mg", date: "Aug 18", status: "Sent" },
    { patient: "Emma W.", drug: "Sumatriptan 50mg", date: "Aug 15", status: "Pending" },
    { patient: "James L.", drug: "Ibuprofen 400mg", date: "Aug 12", status: "Sent" },
  ];
  return (
    <>
      <div className="dl-dash-greeting">
        <div>
          <h3 className="dl-dash-greeting-h">Prescriptions</h3>
          <p className="dl-dash-greeting-sub">Recent prescriptions issued.</p>
        </div>
        <div className="dl-dash-search-bar">
          <FiSearch size={14} />
          <span>Search…</span>
        </div>
      </div>
      <div className="dl-dash-table">
        <div className="dl-dash-table-head">
          <span className="dl-dash-th dl-dash-th--name">Patient</span>
          <span className="dl-dash-th">Medication</span>
          <span className="dl-dash-th">Date</span>
          <span className="dl-dash-th">Status</span>
        </div>
        {rxList.map((rx, i) => (
          <div className="dl-dash-table-row" key={i}>
            <span className="dl-dash-td dl-dash-td--name">
              <span className="dl-dash-patient-avatar">{rx.patient.charAt(0)}</span>
              {rx.patient}
            </span>
            <span className="dl-dash-td">{rx.drug}</span>
            <span className="dl-dash-td dl-dash-td--muted">{rx.date}</span>
            <span className="dl-dash-td">
              <span className={`dl-dash-status dl-dash-status--${rx.status === "Sent" ? "g" : "a"}`}>
                {rx.status}
              </span>
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function DashTabReports() {
  const metrics = [
    { label: "Consultations This Month", value: 42, change: "+8%", icon: <FiVideo size={16} /> },
    { label: "Patient Satisfaction", value: "94%", change: "+2%", icon: <FiHeart size={16} /> },
    { label: "Avg. Response Time", value: "12m", change: "-18%", icon: <FiClock size={16} /> },
  ];
  return (
    <>
      <div className="dl-dash-greeting">
        <div>
          <h3 className="dl-dash-greeting-h">Reports & Analytics</h3>
          <p className="dl-dash-greeting-sub">Your practice performance overview.</p>
        </div>
      </div>
      <div className="dl-dash-stats">
        {metrics.map((m, i) => (
          <div className="dl-dash-stat" key={i}>
            <div className={`dl-dash-stat-icon dl-dash-stat-icon--${["g", "b", "p"][i]}`}>{m.icon}</div>
            <div>
              <p className="dl-dash-stat-val">{m.value}</p>
              <p className="dl-dash-stat-lbl">{m.label}</p>
            </div>
            <span className="dl-dash-change">{m.change}</span>
          </div>
        ))}
      </div>
      <div className="dl-dash-chart-mock">
        <h4 className="dl-dash-section-h">Monthly Consultations</h4>
        <div className="dl-dash-bars">
          {[28, 35, 22, 40, 32, 42].map((v, i) => (
            <div className="dl-dash-bar-col" key={i}>
              <div className="dl-dash-bar" style={{ height: `${(v / 42) * 100}%` }} />
              <span className="dl-dash-bar-lbl">{["Mar", "Apr", "May", "Jun", "Jul", "Aug"][i]}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function DashTabSettings() {
  return (
    <>
      <div className="dl-dash-greeting">
        <div>
          <h3 className="dl-dash-greeting-h">Settings</h3>
          <p className="dl-dash-greeting-sub">Manage your account and preferences.</p>
        </div>
      </div>
      <div className="dl-dash-settings-grid">
        <div className="dl-dash-setting-card">
          <div className="dl-dash-setting-icon"><FiUser size={16} /></div>
          <div>
            <strong>Profile Information</strong>
            <p>Update your name, specialty and bio.</p>
          </div>
        </div>
        <div className="dl-dash-setting-card">
          <div className="dl-dash-setting-icon"><FiBell size={16} /></div>
          <div>
            <strong>Notifications</strong>
            <p>Configure email and push alerts.</p>
          </div>
        </div>
        <div className="dl-dash-setting-card">
          <div className="dl-dash-setting-icon"><FiLock size={16} /></div>
          <div>
            <strong>Security</strong>
            <p>Password, two-factor authentication.</p>
          </div>
        </div>
        <div className="dl-dash-setting-card">
          <div className="dl-dash-setting-icon"><FiCalendar size={16} /></div>
          <div>
            <strong>Availability</strong>
            <p>Set your consultation hours.</p>
          </div>
        </div>
        <div className="dl-dash-setting-card">
          <div className="dl-dash-setting-icon"><FiGlobe size={16} /></div>
          <div>
            <strong>Language & Region</strong>
            <p>Set language and timezone.</p>
          </div>
        </div>
        <div className="dl-dash-setting-card">
          <div className="dl-dash-setting-icon"><FiShield size={16} /></div>
          <div>
            <strong>Privacy</strong>
            <p>Data handling and consent settings.</p>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Sidebar tab config ─── */
const DASH_TABS = [
  { key: "dashboard", label: "Dashboard", icon: <FiLayout size={16} /> },
  { key: "patients", label: "Patients", icon: <FiUsers size={16} /> },
  { key: "appointments", label: "Appointments", icon: <FiCalendar size={16} /> },
  { key: "messages", label: "Messages", icon: <FiMail size={16} /> },
  { key: "prescriptions", label: "Prescriptions", icon: <FiFileText size={16} /> },
  { key: "reports", label: "Reports", icon: <FiBarChart2 size={16} /> },
  { key: "settings", label: "Settings", icon: <FiSettings size={16} /> },
];

const DASH_CONTENT = {
  dashboard: DashTabDashboard,
  patients: DashTabPatients,
  appointments: DashTabAppointments,
  messages: DashTabMessages,
  prescriptions: DashTabPrescriptions,
  reports: DashTabReports,
  settings: DashTabSettings,
};

function DoctorHome() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const ActiveContent = DASH_CONTENT[activeTab];

  return (
    <div className="dl">
      {/* ====== HERO ====== */}
      <section className="dl-hero">
        <div className="dl-hero-split">
          {/* Left — Copy */}
          <div className="dl-hero-text">
            <span className="dl-hero-badge">
              <FiShield size={13} /> Built for Modern Healthcare
            </span>
            <h1 className="dl-hero-h1">
              Deliver Better Care.<br />
              <span className="dl-green">Work Smarter.</span>
            </h1>
            <p className="dl-hero-sub">
              Manage patients, consultations, prescriptions and clinical
              workflows — all from one simple platform.
            </p>
            <div className="dl-hero-actions">
              <Link to="/doctor/login" className="dl-btn-primary">
                Open Doctor Dashboard <FiArrowRight size={15} />
              </Link>
              <a href="#features" className="dl-btn-outline">
                Explore Features
              </a>
            </div>
            <p className="dl-hero-trust">
              <FiShield size={13} /> Secure &nbsp;•&nbsp; Simple &nbsp;•&nbsp; Built for Doctors
            </p>
          </div>

          {/* Right — Visual */}
          <div className="dl-hero-visual">
            <div className="dl-hero-img-wrap">
              <img src={doctorHero} alt="RemedyEase Doctor" className="dl-hero-img" draggable="false" />
              <div className="dl-hero-img-overlay" />
            </div>

            {/* Floating Appointment Card */}
            <div className="dl-float-card dl-float-card--appt">
              <div className="dl-float-head">
                <FiCalendar size={14} className="dl-float-ico" />
                <span>Today's Schedule</span>
              </div>
              <ul className="dl-float-list">
                <li><span className="dl-time">09:30</span> Sarah K. — Follow-up</li>
                <li><span className="dl-time">10:15</span> Michael R. — Consult</li>
                <li><span className="dl-time">11:00</span> Emma W. — Check-up</li>
              </ul>
            </div>

            {/* Floating Patient Card */}
            <div className="dl-float-card dl-float-card--patients">
              <div className="dl-float-head">
                <FiUsers size={14} className="dl-float-ico" />
                <span>Active Patients</span>
              </div>
              <p className="dl-float-big">124</p>
              <span className="dl-float-badge-up">+12% this month</span>
            </div>
          </div>
        </div>
      </section>

      {/* ====== FEATURES ====== */}
      <section className="dl-section" id="features">
        <div className="dl-section-inner">
          <span className="dl-section-badge">Platform Features</span>
          <h2 className="dl-section-title">Everything You Need to Deliver Better Care</h2>
          <p className="dl-section-sub">
            RemedyEase brings your essential clinical workflow into one simple platform.
          </p>

          <div className="dl-features-grid">
            <div className="dl-feature-card">
              <div className="dl-feature-icon dl-feature-icon--green">
                <FiUsers size={20} />
              </div>
              <h3 className="dl-feature-title">Patient Management</h3>
              <p className="dl-feature-desc">
                View patient information, history and ongoing care from one place.
              </p>
            </div>
            <div className="dl-feature-card">
              <div className="dl-feature-icon dl-feature-icon--blue">
                <FiVideo size={20} />
              </div>
              <h3 className="dl-feature-title">Online Consultations</h3>
              <p className="dl-feature-desc">
                Connect with patients through secure online consultations.
              </p>
            </div>
            <div className="dl-feature-card">
              <div className="dl-feature-icon dl-feature-icon--purple">
                <FiMessageCircle size={20} />
              </div>
              <h3 className="dl-feature-title">Real-time Chat</h3>
              <p className="dl-feature-desc">
                Communicate with patients quickly and conveniently.
              </p>
            </div>
            <div className="dl-feature-card">
              <div className="dl-feature-icon dl-feature-icon--amber">
                <FiCpu size={20} />
              </div>
              <h3 className="dl-feature-title">Smart Clinical Support</h3>
              <p className="dl-feature-desc">
                Use intelligent tools to organize information and support clinical decisions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ====== INTERACTIVE DASHBOARD PREVIEW ====== */}
      <section className="dl-section dl-section--alt" id="dashboard-preview">
        <div className="dl-section-inner">
          <span className="dl-section-badge">Product Preview</span>
          <h2 className="dl-section-title">Your Practice. One Simple Dashboard.</h2>
          <p className="dl-section-sub">
            Spend less time managing your workflow and more time caring for your patients.
            <br />
            <em style={{ fontSize: "13px", color: "#94a3b8" }}>Click any sidebar item to explore →</em>
          </p>

          <div className="dl-dash">
            {/* Sidebar */}
            <aside className="dl-dash-sidebar">
              <div className="dl-dash-brand">
                <span className="dl-dash-brand-text">RemedyEase</span>
              </div>
              <nav className="dl-dash-nav">
                {DASH_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    className={`dl-dash-nav-item ${activeTab === tab.key ? "dl-dash-nav-item--active" : ""}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </aside>

            {/* Main — dynamic content */}
            <div className="dl-dash-main" key={activeTab}>
              <ActiveContent />
            </div>
          </div>
        </div>
      </section>

      {/* ====== HOW IT WORKS ====== */}
      <section className="dl-section" id="how-it-works">
        <div className="dl-section-inner">
          <span className="dl-section-badge">Getting Started</span>
          <h2 className="dl-section-title">How RemedyEase Works</h2>
          <p className="dl-section-sub">A simple, streamlined process for your practice.</p>

          <div className="dl-steps">
            <div className="dl-step">
              <span className="dl-step-num">01</span>
              <h3 className="dl-step-title">Create Your Profile</h3>
              <p className="dl-step-desc">Set up your professional profile and availability.</p>
            </div>
            <div className="dl-step-connector" />
            <div className="dl-step">
              <span className="dl-step-num">02</span>
              <h3 className="dl-step-title">Manage Your Patients</h3>
              <p className="dl-step-desc">Access patient information and manage ongoing care.</p>
            </div>
            <div className="dl-step-connector" />
            <div className="dl-step">
              <span className="dl-step-num">03</span>
              <h3 className="dl-step-title">Consult & Connect</h3>
              <p className="dl-step-desc">Consult with patients and communicate securely.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ====== CLINICAL SUPPORT ====== */}
      <section className="dl-section dl-section--alt" id="clinical-support">
        <div className="dl-section-inner">
          <div className="dl-clinical-split">
            {/* Left — Mock UI */}
            <div className="dl-clinical-panel">
              <div className="dl-cp-head">
                <FiCpu size={16} />
                <span>Clinical Support</span>
              </div>
              <div className="dl-cp-section">
                <h5 className="dl-cp-label">Current Symptoms</h5>
                <div className="dl-cp-tags">
                  <span className="dl-cp-tag">Headache</span>
                  <span className="dl-cp-tag">Fatigue</span>
                  <span className="dl-cp-tag">Mild Fever</span>
                </div>
              </div>
              <div className="dl-cp-section">
                <h5 className="dl-cp-label">Patient History</h5>
                <ul className="dl-cp-list">
                  <li><FiCheck size={12} /> Allergies noted</li>
                  <li><FiCheck size={12} /> Previous consultations reviewed</li>
                  <li><FiCheck size={12} /> Medication history available</li>
                </ul>
              </div>
              <div className="dl-cp-section">
                <h5 className="dl-cp-label">Current Medication</h5>
                <ul className="dl-cp-list">
                  <li><FiFileText size={12} /> Ibuprofen 200mg</li>
                  <li><FiFileText size={12} /> Cetirizine 10mg</li>
                </ul>
              </div>
              <div className="dl-cp-insight">
                <FiActivity size={14} />
                <span>All patient information organized and accessible</span>
              </div>
            </div>

            {/* Right — Copy */}
            <div className="dl-clinical-text">
              <span className="dl-section-badge">Clinical Tools</span>
              <h2 className="dl-section-title dl-section-title--left">
                Smarter Workflows.<br />
                <span className="dl-green">Better Patient Care.</span>
              </h2>
              <p className="dl-clinical-desc">
                RemedyEase brings patient information, history, symptoms and medication details together
                in one organized view — helping you spend less time on administration and more time
                delivering quality care.
              </p>
              <ul className="dl-clinical-checks">
                <li><FiCheck size={14} className="dl-check-ico" /> Organized patient profiles</li>
                <li><FiCheck size={14} className="dl-check-ico" /> Symptom and history overview</li>
                <li><FiCheck size={14} className="dl-check-ico" /> Secure clinical communication</li>
                <li><FiCheck size={14} className="dl-check-ico" /> Prescription management</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ====== TESTIMONIALS ====== */}
      <section className="dl-section" id="testimonials">
        <div className="dl-section-inner">
          <span className="dl-section-badge">Physician Reviews</span>
          <h2 className="dl-section-title">Built for Doctors</h2>
          <p className="dl-section-sub">
            Hear from medical professionals using the platform.
          </p>

          <div className="dl-testimonials">
            <div className="dl-testimonial-card">
              <div className="dl-testimonial-stars">
                <FiStar size={14} /><FiStar size={14} /><FiStar size={14} /><FiStar size={14} /><FiStar size={14} />
              </div>
              <p className="dl-testimonial-quote">
                "Integrating RemedyEase into my practice was incredibly easy. The platform is intuitive
                and allows me to conduct virtual consultations seamlessly."
              </p>
              <div className="dl-testimonial-author">
                <img src={doctor4} alt="Dr. Sarah Chen" className="dl-testimonial-avatar" />
                <div>
                  <strong className="dl-testimonial-name">Dr. Sarah Chen</strong>
                  <span className="dl-testimonial-role">Family Medicine</span>
                </div>
              </div>
            </div>

            <div className="dl-testimonial-card">
              <div className="dl-testimonial-stars">
                <FiStar size={14} /><FiStar size={14} /><FiStar size={14} /><FiStar size={14} /><FiStar size={14} />
              </div>
              <p className="dl-testimonial-quote">
                "The clinical support tools provide relevant insights based on patient data, helping me
                build comprehensive care plans more efficiently."
              </p>
              <div className="dl-testimonial-author">
                <img src={doctor5} alt="Dr. Ben Carter" className="dl-testimonial-avatar" />
                <div>
                  <strong className="dl-testimonial-name">Dr. Ben Carter</strong>
                  <span className="dl-testimonial-role">Internist</span>
                </div>
              </div>
            </div>

            <div className="dl-testimonial-card">
              <div className="dl-testimonial-stars">
                <FiStar size={14} /><FiStar size={14} /><FiStar size={14} /><FiStar size={14} /><FiStar size={14} />
              </div>
              <p className="dl-testimonial-quote">
                "RemedyEase has been instrumental in expanding my reach to patients outside my local area.
                The scheduling flexibility improved my work-life balance."
              </p>
              <div className="dl-testimonial-author">
                <img src={doctor6} alt="Dr. Emily Rodriguez" className="dl-testimonial-avatar" />
                <div>
                  <strong className="dl-testimonial-name">Dr. Emily Rodriguez</strong>
                  <span className="dl-testimonial-role">Cardiologist</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== CTA ====== */}
      <section className="dl-cta">
        <div className="dl-cta-inner">
          <h2 className="dl-cta-title">Ready to Simplify Your Practice?</h2>
          <p className="dl-cta-sub">
            Bring your patients, consultations and workflow together with RemedyEase.
          </p>
          <Link to="/doctor/login" className="dl-btn-primary dl-btn-primary--lg">
            Open Doctor Dashboard <FiArrowRight size={16} />
          </Link>
        </div>
      </section>

      <Footerdoctor />
    </div>
  );
}

export default DoctorHome;
