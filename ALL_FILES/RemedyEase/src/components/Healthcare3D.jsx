import React, { useRef, useState, useEffect } from "react";
import doctorImg from "../images/doctor_3d_hero.jpg";
import { FiCheck, FiHeart, FiShield, FiActivity, FiUser } from "react-icons/fi";
import { LuStethoscope } from "react-icons/lu";

/* ============================================================
   Healthcare3D — Premium 3D Doctor Hero Visual
   Sophisticated 3D Healthcare Illustration with Interactive Parallax
   ============================================================ */

export default function Healthcare3D() {
  const containerRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const handleMouseMove = (e) => {
    if (reducedMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 16;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -16;
    setTilt({ x, y });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  return (
    <div
      ref={containerRef}
      className="h3d-hero-container"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      aria-label="RemedyEase 3D Healthcare Doctor Illustration"
    >
      {/* Background Soft Glow */}
      <div className="h3d-glow-backdrop" />

      {/* Main 3D Card Stage with Parallax Tilt */}
      <div
        className="h3d-stage"
        style={{
          transform: `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) scale3d(${isHovered ? 1.02 : 1}, ${isHovered ? 1.02 : 1}, 1)`,
          transition: isHovered ? "transform 0.1s ease-out" : "transform 0.5s ease-out",
        }}
      >
        {/* Doctor 3D Illustration Frame */}
        <div className="h3d-doctor-frame">
          <img
            src={doctorImg}
            alt="RemedyEase Doctor"
            className="h3d-doctor-img"
            loading="eager"
          />
          <div className="h3d-doctor-overlay-gradient" />
        </div>

        {/* Floating Health Status Badge (Top-Left) */}
        <div
          className="h3d-badge-status"
          style={{
            transform: `translate3d(${tilt.x * 0.4}px, ${-tilt.y * 0.4}px, 20px)`,
          }}
        >
          <div className="h3d-badge-icon h3d-badge-icon--green">
            <span className="h3d-pulse-dot" />
            <LuStethoscope size={14} />
          </div>
          <div className="h3d-badge-text">
            <span className="h3d-badge-title">Verified Specialist</span>
            <span className="h3d-badge-sub">Available for consult</span>
          </div>
        </div>

        {/* Floating Main Title Card (Presented by Doctor) */}
        <div
          className="h3d-main-panel"
          style={{
            transform: `translate3d(${-tilt.x * 0.5}px, ${tilt.y * 0.5}px, 35px)`,
          }}
        >
          <div className="h3d-panel-header">
            <span className="h3d-panel-pill">
              <span className="h3d-panel-pill-dot" />
              RemedyEase Care
            </span>
            <span className="h3d-panel-tag">
              <FiShield size={12} /> Secure
            </span>
          </div>

          <h3 className="h3d-panel-title">
            Your Healthcare,<br />
            <span className="h3d-highlight">Made Simpler.</span>
          </h3>

          <p className="h3d-panel-desc">
            Connect with doctors, chat in real time, and get personalized health guidance.
          </p>

          <div className="h3d-panel-tags">
            <span className="h3d-tag h3d-tag--green">
              <FiCheck size={12} /> Consultations
            </span>
            <span className="h3d-tag h3d-tag--blue">
              <FiCheck size={12} /> Real-time Chat
            </span>
            <span className="h3d-tag h3d-tag--purple">
              <FiCheck size={12} /> AI Insights
            </span>
          </div>
        </div>

        {/* Small Bottom Live Metric Pill */}
        <div
          className="h3d-badge-metric"
          style={{
            transform: `translate3d(${tilt.x * 0.3}px, ${-tilt.y * 0.3}px, 25px)`,
          }}
        >
          <div className="h3d-metric-icon">
            <FiActivity size={14} />
          </div>
          <div className="h3d-metric-info">
            <span className="h3d-metric-val">24/7</span>
            <span className="h3d-metric-lbl">Care Access</span>
          </div>
        </div>
      </div>
    </div>
  );
}
