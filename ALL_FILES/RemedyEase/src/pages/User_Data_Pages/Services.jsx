import React from "react";
import { Link } from "react-router-dom";
import "../../Css_for_all/Services.css";
import onlineConsultImg from "../../images/online_consultants.png";
import liveChatImg from "../../images/live_chat.png";
import aiRemedyImg from "../../images/ai_remedy.jpg";
import medicineStoreImg from "../../images/box1image.jpg";
import Footerforuser from "../../components/Footerforuser";
import {
  FiVideo, FiMessageCircle, FiCpu, FiShoppingBag,
  FiArrowRight, FiZap, FiLayers, FiGlobe
} from "react-icons/fi";

const SERVICES = [
  {
    icon: <FiVideo size={20} />,
    iconClass: "sv-card-icon--green",
    image: onlineConsultImg,
    title: "Online Consultations",
    desc: "Connect with healthcare professionals through convenient online consultations from wherever you are.",
    link: "/user/dashboard/videocall",
    alt: "Online Doctor Video Consultation",
  },
  {
    icon: <FiMessageCircle size={20} />,
    iconClass: "sv-card-icon--blue",
    image: liveChatImg,
    title: "Real-time Doctor Chat",
    desc: "Communicate directly with doctors through convenient real-time chat when you need guidance.",
    link: "/user/dashboard/chat",
    alt: "Real-time Doctor Chat",
  },
  {
    icon: <FiCpu size={20} />,
    iconClass: "sv-card-icon--purple",
    image: aiRemedyImg,
    title: "AI-Powered Health Insights",
    desc: "Get personalized health insights based on the information you provide to support your wellness.",
    link: "/user/dashboard/ai",
    alt: "AI Health Guidance and Insights",
  },
  {
    icon: <FiShoppingBag size={20} />,
    iconClass: "sv-card-icon--amber",
    image: medicineStoreImg,
    title: "Medicine Store",
    desc: "Access and browse essential medicines and remedies through the RemedyEase platform.",
    link: "/user/dashboard/store",
    alt: "Essential Medicines and Healthcare Products",
  },
];

const WHY_ITEMS = [
  {
    num: "01",
    icon: <FiZap size={18} />,
    title: "Simple",
    desc: "Designed to make healthcare easier to navigate for everyone.",
  },
  {
    num: "02",
    icon: <FiLayers size={18} />,
    title: "Connected",
    desc: "Bring consultations, communication and healthcare tools together.",
  },
  {
    num: "03",
    icon: <FiGlobe size={18} />,
    title: "Accessible",
    desc: "Access essential healthcare services from one convenient platform.",
  },
];

export default function Services() {
  return (
    <div className="sv">
      {/* ====== HERO ====== */}
      <section className="sv-hero">
        <div className="sv-container">
          <span className="sv-eyebrow">WHAT WE OFFER</span>
          <h1 className="sv-hero-h1">
            Healthcare,<br />
            <span className="sv-green">Made Simpler.</span>
          </h1>
          <p className="sv-hero-sub">
            Explore the tools and services RemedyEase provides to make healthcare
            more accessible, convenient and connected.
          </p>
        </div>
      </section>

      {/* ====== 4-CARD SERVICES GRID ====== */}
      <section className="sv-section">
        <div className="sv-container">
          <div className="sv-grid">
            {SERVICES.map((s, i) => (
              <div className="sv-card" key={i}>
                {/* Controlled Image Box */}
                <div className="sv-card-media">
                  <img src={s.image} alt={s.alt} className="sv-card-img" />
                </div>

                {/* Content Area */}
                <div className="sv-card-body">
                  <div className={`sv-card-icon ${s.iconClass}`}>
                    {s.icon}
                  </div>
                  <h3 className="sv-card-title">{s.title}</h3>
                  <p className="sv-card-desc">{s.desc}</p>
                  <Link to={s.link} className="sv-card-link">
                    Explore <FiArrowRight size={14} className="sv-card-arrow" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== WHY CHOOSE REMEDYEASE ====== */}
      <section className="sv-section sv-section--alt">
        <div className="sv-container">
          <div className="sv-section-header">
            <span className="sv-eyebrow">WHY REMEDYEASE</span>
            <h2 className="sv-section-title">Why Choose RemedyEase?</h2>
            <p className="sv-section-sub">
              Everything is designed around making healthcare simpler and more accessible.
            </p>
          </div>

          <div className="sv-why-grid">
            {WHY_ITEMS.map((w, i) => (
              <div className="sv-why-card" key={i}>
                <div className="sv-why-top">
                  <span className="sv-why-num">{w.num}</span>
                  <div className="sv-why-icon">{w.icon}</div>
                </div>
                <h3 className="sv-why-title">{w.title}</h3>
                <p className="sv-why-desc">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== CTA SECTION ====== */}
      <section className="sv-cta">
        <div className="sv-cta-container">
          <h2 className="sv-cta-title">Ready to get started?</h2>
          <p className="sv-cta-sub">
            Explore RemedyEase and take a simpler approach to managing your healthcare.
          </p>
          <div className="sv-cta-actions">
            <Link to="/user/signup" className="sv-btn-primary">
              Get Started <FiArrowRight size={15} />
            </Link>
            <Link to="/learn" className="sv-btn-outline">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* ====== FOOTER ====== */}
      <Footerforuser />
    </div>
  );
}
