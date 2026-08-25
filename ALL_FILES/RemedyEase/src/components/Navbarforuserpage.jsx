import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";
import "../Css_for_all/Navbarforuserpage.css";

function Navbarforuserpage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => {
    if (path === "/user" || path === "/user/home") {
      return location.pathname === "/user" || location.pathname === "/user/home";
    }
    return location.pathname === path;
  };

  return (
    <header className="un-header">
      <div className="un-header-inner">
        {/* Brand */}
        <Link to="/" className="un-brand">RemedyEase</Link>

        {/* Desktop Nav */}
        <nav className="un-nav">
          <Link to="/user/home" className={`un-nav-link ${isActive("/user/home") ? "un-nav-link--active" : ""}`}>Home</Link>
          <Link to="/user/service" className={`un-nav-link ${isActive("/user/service") ? "un-nav-link--active" : ""}`}>Services</Link>
          <Link to="/user/about" className={`un-nav-link ${isActive("/user/about") ? "un-nav-link--active" : ""}`}>About</Link>
          <Link to="/user/contact" className={`un-nav-link ${isActive("/user/contact") ? "un-nav-link--active" : ""}`}>Contact</Link>
        </nav>

        {/* Actions */}
        <div className="un-actions">
          <Link to="/user/login" className="un-btn-ghost">Log in</Link>
          <Link to="/user/signup" className="un-btn-primary">Get Started</Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="un-mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="un-mobile-menu">
          <nav className="un-mobile-nav">
            <Link to="/user/home" className="un-mobile-link" onClick={() => setMobileOpen(false)}>Home</Link>
            <Link to="/user/service" className="un-mobile-link" onClick={() => setMobileOpen(false)}>Services</Link>
            <Link to="/user/about" className="un-mobile-link" onClick={() => setMobileOpen(false)}>About</Link>
            <Link to="/user/contact" className="un-mobile-link" onClick={() => setMobileOpen(false)}>Contact</Link>
          </nav>
          <div className="un-mobile-actions">
            <Link to="/user/login" className="un-btn-ghost un-btn--full" onClick={() => setMobileOpen(false)}>Log in</Link>
            <Link to="/user/signup" className="un-btn-primary un-btn--full" onClick={() => setMobileOpen(false)}>Get Started</Link>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbarforuserpage;
