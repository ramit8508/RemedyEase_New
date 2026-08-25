import React from "react";
import "../../Css_for_all/About.css";
import doctor1 from "../../images/doctor1.jpg";
import doctor2 from "../../images/doctor2.jpg";
import doctor3 from "../../images/doctor3.jpg";
import Footerforuser from "../../components/Footerforuser";
import {
  FiShield, FiHeart, FiActivity, FiUsers, FiStar,
  FiThumbsUp, FiCheck, FiCompass, FiTarget, FiAward
} from "react-icons/fi";

const VALUES_DATA = [
  {
    num: "01",
    icon: <FiTarget size={20} />,
    title: "Our Mission",
    desc: "Empower individuals to take control of their health by providing convenient, affordable, and reliable access to healthcare professionals.",
  },
  {
    num: "02",
    icon: <FiCompass size={20} />,
    title: "Our Vision",
    desc: "A future where healthcare is proactive, patient-centric, and seamlessly integrated into daily life through innovative virtual care.",
  },
  {
    num: "03",
    icon: <FiAward size={20} />,
    title: "Our Values",
    desc: "Patient-Centricity, Integrity, Innovation, Collaboration, and Accessibility in everything we build.",
  },
];

const TESTIMONIALS_DATA = [
  {
    quote: "RemedyEase was a lifesaver! I got an online consultation with a specialist without leaving my home. The guidance was clear, professional, and reassuring.",
    author: "Sarah J.",
    role: "Verified user",
  },
  {
    quote: "The convenience of chatting with a doctor at any time is incredible. I've used RemedyEase for medical advice while traveling, and the experience was seamless.",
    author: "Michael R.",
    role: "Verified user",
  },
  {
    quote: "As a busy professional, RemedyEase has been a game-changer for me. Getting quick answers and the care I need without disrupting my schedule is priceless.",
    author: "Emily K.",
    role: "Verified user",
  },
];

const TEAM_DATA = [
  {
    image: doctor1,
    name: "Dr. Prachi Singh",
    degree: "MBBS / MD Medicine",
    specialty: "General Physician",
  },
  {
    image: doctor2,
    name: "Dr. Edward Prist",
    degree: "MS Orthopedics",
    specialty: "Orthopedist",
  },
  {
    image: doctor3,
    name: "Dr. Ethan Vance",
    degree: "MD Cardiology",
    specialty: "Cardiologist",
  },
];

const IMPACT_DATA = [
  {
    icon: <FiUsers size={24} />,
    value: "100,000+",
    label: "Patients served",
  },
  {
    icon: <FiStar size={24} />,
    value: "4.8 / 5",
    label: "Average rating",
  },
  {
    icon: <FiThumbsUp size={24} />,
    value: "95%",
    label: "Positive feedback",
  },
];

export default function About() {
  return (
    <div className="ab">
      {/* ====== HERO ====== */}
      <section className="ab-hero">
        <div className="ab-container">
          <div className="ab-hero-split">
            {/* Left Content */}
            <div className="ab-hero-text">
              <span className="ab-eyebrow">ABOUT REMEDYEASE</span>
              <h1 className="ab-hero-h1">
                Healthcare should<br />
                <span className="ab-green">feel simpler.</span>
              </h1>
              <p className="ab-hero-sub">
                RemedyEase brings patients and healthcare professionals together
                through accessible consultations, real-time communication and intelligent
                health tools.
              </p>
              <div className="ab-hero-trust">
                <div className="ab-hero-trust-item">
                  <FiShield className="ab-trust-ico" size={15} />
                  <span>Secure & Confidential</span>
                </div>
                <div className="ab-hero-trust-divider" />
                <div className="ab-hero-trust-item">
                  <FiHeart className="ab-trust-ico" size={15} />
                  <span>Patient-First Approach</span>
                </div>
              </div>
            </div>

            {/* Right Visual Card */}
            <div className="ab-hero-visual">
              <div className="ab-visual-card">
                <div className="ab-visual-badge">
                  <span className="ab-badge-dot" />
                  <span>Connected Healthcare Platform</span>
                </div>
                <h3 className="ab-visual-title">Bridging care and convenience</h3>
                <p className="ab-visual-desc">
                  Providing modern digital infrastructure so patients get timely medical attention from certified doctors anywhere.
                </p>
                <div className="ab-visual-list">
                  <div className="ab-visual-item">
                    <FiCheck size={14} className="ab-check-ico" />
                    <span>24/7 Virtual Consultations</span>
                  </div>
                  <div className="ab-visual-item">
                    <FiCheck size={14} className="ab-check-ico" />
                    <span>Encrypted Medical Privacy</span>
                  </div>
                  <div className="ab-visual-item">
                    <FiCheck size={14} className="ab-check-ico" />
                    <span>Intelligent Health Guidance</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== OUR STORY / INTRODUCTION ====== */}
      <section className="ab-section ab-section--story">
        <div className="ab-container">
          <div className="ab-story-wrapper">
            <span className="ab-eyebrow">OUR STORY</span>
            <h2 className="ab-section-title">About RemedyEase</h2>
            <div className="ab-story-content">
              <p>
                At RemedyEase, we are dedicated to transforming healthcare accessibility.
                Our journey began with a simple yet profound vision: to bridge the gap between
                patients and quality medical care, regardless of geographical barriers or time constraints.
              </p>
              <p>
                We believe that everyone deserves access to expert medical advice and support,
                and we are committed to making that a reality through our innovative online platform.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ====== MISSION / VISION / VALUES ====== */}
      <section className="ab-section ab-section--alt">
        <div className="ab-container">
          <div className="ab-section-header">
            <span className="ab-eyebrow">OUR FOUNDATION</span>
            <h2 className="ab-section-title">Driven by Purpose</h2>
            <p className="ab-section-sub">
              Our principles shape every feature and consultation we deliver.
            </p>
          </div>

          <div className="ab-values-grid">
            {VALUES_DATA.map((v, i) => (
              <div className="ab-value-card" key={i}>
                <div className="ab-value-top">
                  <span className="ab-value-num">{v.num}</span>
                  <div className="ab-value-icon">{v.icon}</div>
                </div>
                <h3 className="ab-value-title">{v.title}</h3>
                <p className="ab-value-desc">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== PATIENT STORIES ====== */}
      <section className="ab-section">
        <div className="ab-container">
          <div className="ab-section-header">
            <span className="ab-eyebrow">PATIENT STORIES</span>
            <h2 className="ab-section-title">Patient Stories</h2>
            <p className="ab-section-sub">
              Real experiences from people using RemedyEase.
            </p>
          </div>

          <div className="ab-testimonials-grid">
            {TESTIMONIALS_DATA.map((t, i) => (
              <div className="ab-testimonial-card" key={i}>
                <span className="ab-quote-mark">“</span>
                <p className="ab-testimonial-quote">{t.quote}</p>
                <div className="ab-testimonial-author">
                  <strong className="ab-author-name">— {t.author}</strong>
                  <span className="ab-author-badge">{t.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== MEET OUR TEAM ====== */}
      <section className="ab-section ab-section--alt">
        <div className="ab-container">
          <div className="ab-section-header">
            <span className="ab-eyebrow">OUR SPECIALISTS</span>
            <h2 className="ab-section-title">Meet Our Team</h2>
            <p className="ab-section-sub">
              Dedicated medical professionals committed to delivering quality virtual care.
            </p>
          </div>

          <div className="ab-team-grid">
            {TEAM_DATA.map((m, i) => (
              <div className="ab-team-card" key={i}>
                <div className="ab-team-media">
                  <img src={m.image} alt={m.name} className="ab-team-img" />
                </div>
                <div className="ab-team-info">
                  <h3 className="ab-team-name">{m.name}</h3>
                  <span className="ab-team-degree">{m.degree}</span>
                  <span className="ab-team-specialty">{m.specialty}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== OUR IMPACT ====== */}
      <section className="ab-section ab-section--impact">
        <div className="ab-container">
          <div className="ab-section-header">
            <span className="ab-eyebrow">OUR IMPACT</span>
            <h2 className="ab-section-title">Trusted by Thousands</h2>
            <p className="ab-section-sub">
              Delivering accessible and dependable digital healthcare every day.
            </p>
          </div>

          <div className="ab-impact-grid">
            {IMPACT_DATA.map((item, i) => (
              <div className="ab-impact-card" key={i}>
                <div className="ab-impact-icon">{item.icon}</div>
                <span className="ab-impact-val">{item.value}</span>
                <span className="ab-impact-label">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== FOOTER ====== */}
      <Footerforuser />
    </div>
  );
}
