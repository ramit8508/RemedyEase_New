import React, { useEffect, useRef } from "react";
import "../../Css_for_all/Services.css";
import online_consult from "../../images/online_consultants.png";
import online_chat from "../../images/live_chat.png";
import ai_remedy from "../../images/ai_remedy.jpg";
import Footerforuser from "../../components/Footerforuser";
import { Link } from "react-router-dom";
import {
  FiVideo, FiMessageCircle, FiCpu, FiShoppingBag,
  FiArrowRight, FiCheck, FiZap, FiGlobe, FiLayers,
} from "react-icons/fi";

/* ─── Scroll reveal hook ─── */
function useReveal() {
  const ref = useRef(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || !ref.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("sv-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    const children = ref.current.querySelectorAll(".sv-reveal");
    children.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return ref;
}

/* ─── Service card data ─── */
const SERVICES = [
  {
    icon: <FiVideo size={22} />,
    iconClass: "sv-icon--green",
    image: online_consult,
    title: "Online Consultations",
    desc: "Connect with experienced healthcare professionals from the comfort of your home through secure online consultations.",
    alt: "Online consultations illustration",
  },
  {
    icon: <FiMessageCircle size={22} />,
    iconClass: "sv-icon--blue",
    image: online_chat,
    title: "Real-time Doctor Chat",
    desc: "Chat with doctors in real time to discuss your concerns and get convenient guidance.",
    alt: "Live chat with doctors illustration",
  },
  {
    icon: <FiCpu size={22} />,
    iconClass: "sv-icon--purple",
    image: ai_remedy,
    title: "AI-Powered Health Insights",
    desc: "Receive personalized health insights based on the information you provide.",
    alt: "AI health insights illustration",
  },
  {
    icon: <FiShoppingBag size={22} />,
    iconClass: "sv-icon--amber",
    image: null,
    title: "Medicine Store",
    desc: "Browse and order medicines through the RemedyEase platform.",
    alt: "Medicine store",
  },
];

const WHY_ITEMS = [
  {
    num: "01",
    icon: <FiZap size={20} />,
    title: "Simple",
    desc: "Designed to make healthcare easier to navigate.",
  },
  {
    num: "02",
    icon: <FiLayers size={20} />,
    title: "Connected",
    desc: "Bring consultations, communication and healthcare tools together.",
  },
  {
    num: "03",
    icon: <FiGlobe size={20} />,
    title: "Accessible",
    desc: "Access essential healthcare services from one convenient platform.",
  },
];

export default function Services() {
  const revealRef = useReveal();

  return (
    <div className="sv" ref={revealRef}>
      {/* ====== HERO ====== */}
      <section className="sv-hero">
        <div className="sv-hero-inner">
          <span className="sv-eyebrow sv-reveal">WHAT WE OFFER</span>
          <h1 className="sv-hero-h1 sv-reveal">
            Healthcare,<br />
            <span className="sv-green">Made Simpler.</span>
          </h1>
          <p className="sv-hero-sub sv-reveal">
            Explore the tools and services RemedyEase provides to make
            healthcare more accessible, convenient and connected.
          </p>
        </div>
      </section>

      {/* ====== SERVICE CARDS ====== */}
      <section className="sv-section">
        <div className="sv-section-inner">
          <div className="sv-grid">
            {SERVICES.map((s, i) => (
              <article
                className="sv-card sv-reveal"
                key={i}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {/* Image / Icon area */}
                <div className="sv-card-visual">
                  {s.image ? (
                    <img src={s.image} alt={s.alt} className="sv-card-img" loading="lazy" />
                  ) : (
                    <div className="sv-card-img-placeholder">
                      <FiShoppingBag size={48} />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="sv-card-body">
                  <div className={`sv-card-icon ${s.iconClass}`}>
                    {s.icon}
                  </div>
                  <h3 className="sv-card-title">{s.title}</h3>
                  <p className="sv-card-desc">{s.desc}</p>
                  <span className="sv-card-action">
                    Explore <FiArrowRight size={14} />
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ====== WHY REMEDYEASE ====== */}
      <section className="sv-section sv-section--alt">
        <div className="sv-section-inner">
          <span className="sv-eyebrow sv-reveal">WHY REMEDYEASE</span>
          <h2 className="sv-section-title sv-reveal">Why Choose RemedyEase?</h2>
          <p className="sv-section-sub sv-reveal">
            Everything is designed around making healthcare simpler and more accessible.
          </p>

          <div className="sv-why-grid">
            {WHY_ITEMS.map((w, i) => (
              <div className="sv-why-card sv-reveal" key={i} style={{ animationDelay: `${i * 80}ms` }}>
                <span className="sv-why-num">{w.num}</span>
                <div className="sv-why-icon">{w.icon}</div>
                <h3 className="sv-why-title">{w.title}</h3>
                <p className="sv-why-desc">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== CTA ====== */}
      <section className="sv-cta sv-reveal">
        <div className="sv-cta-inner">
          <h2 className="sv-cta-title">Ready to get started?</h2>
          <p className="sv-cta-sub">
            Explore RemedyEase and take a simpler approach to managing your healthcare.
          </p>
          <div className="sv-cta-actions">
            <Link to="/user/home" className="sv-btn-primary">
              Get Started <FiArrowRight size={15} />
            </Link>
            <Link to="/learn" className="sv-btn-outline">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      <Footerforuser />
    </div>
  );
}
