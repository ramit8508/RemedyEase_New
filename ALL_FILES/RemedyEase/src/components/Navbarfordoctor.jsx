import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiMenu, FiX, FiArrowRight } from "react-icons/fi";
import "../Css_for_all/Navbarfordoctor.css";

function Navbarfordoctor() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  return (
    <header className={`doc-nav ${isScrolled ? "doc-nav--scrolled" : ""}`}>
      <div className="doc-nav-inner">
        {/* Brand */}
        <Link to="/doctor/home" className="doc-nav-brand">
          <span className="doc-nav-brand-name">RemedyEase</span>
          <span className="doc-nav-brand-tag">Doctor</span>
        </Link>

        {/* Desktop Links */}
        <nav className="doc-nav-links">
          <Link
            to="/doctor/home"
            className={`doc-nav-link ${
              location.pathname === "/doctor" || location.pathname === "/doctor/home"
                ? "doc-nav-link--active"
                : ""
            }`}
          >
            Home
          </Link>
          <a href="#features" className="doc-nav-link">Features</a>
          <a href="#dashboard-preview" className="doc-nav-link">Dashboard</a>
          <a href="#how-it-works" className="doc-nav-link">How It Works</a>
          <a href="#clinical-support" className="doc-nav-link">Clinical Tools</a>
          <a href="#testimonials" className="doc-nav-link">Reviews</a>
        </nav>

        {/* Desktop Right CTA */}
        <div className="doc-nav-actions">
          <Link to="/doctor/login" className="doc-nav-signin">Sign In</Link>
          <Link to="/doctor/signup" className="doc-nav-cta">
            <span>Doctor Dashboard</span>
            <FiArrowRight size={14} />
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="doc-nav-toggle"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
        >
          {isOpen ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="doc-nav-drawer">
          <nav className="doc-nav-drawer-links">
            <Link to="/doctor/home" className="doc-nav-drawer-link" onClick={() => setIsOpen(false)}>Home</Link>
            <a href="#features" className="doc-nav-drawer-link" onClick={() => setIsOpen(false)}>Features</a>
            <a href="#dashboard-preview" className="doc-nav-drawer-link" onClick={() => setIsOpen(false)}>Dashboard Preview</a>
            <a href="#how-it-works" className="doc-nav-drawer-link" onClick={() => setIsOpen(false)}>How It Works</a>
            <a href="#clinical-support" className="doc-nav-drawer-link" onClick={() => setIsOpen(false)}>Clinical Tools</a>
            <a href="#testimonials" className="doc-nav-drawer-link" onClick={() => setIsOpen(false)}>Reviews</a>
            <div className="doc-nav-drawer-divider" />
            <div className="doc-nav-drawer-actions">
              <Link to="/doctor/login" className="doc-nav-drawer-btn-outline" onClick={() => setIsOpen(false)}>Sign In</Link>
              <Link to="/doctor/signup" className="doc-nav-drawer-btn-primary" onClick={() => setIsOpen(false)}>Open Doctor Dashboard</Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export default Navbarfordoctor;
