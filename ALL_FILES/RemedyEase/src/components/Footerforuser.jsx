import React from "react";
import { Link } from "react-router-dom";

function Footerforuser() {
  return (
    <footer className="uf-footer">
      <div className="uf-footer-inner">
        <div className="uf-footer-brand">
          <span className="uf-footer-name">RemedyEase</span>
          <p className="uf-footer-tagline">Healthcare made simpler.</p>
        </div>

        <nav className="uf-footer-nav">
          <Link to="/" className="uf-footer-link">Home</Link>
          <Link to="/user/service" className="uf-footer-link">Services</Link>
          <Link to="/user/about" className="uf-footer-link">About</Link>
          <Link to="/user/contact" className="uf-footer-link">Contact</Link>
        </nav>
      </div>

      <div className="uf-footer-bottom">
        <p>&copy; {new Date().getFullYear()} RemedyEase. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footerforuser;