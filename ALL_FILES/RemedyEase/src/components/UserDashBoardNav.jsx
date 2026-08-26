import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiCpu,
  FiUsers,
  FiCalendar,
  FiShoppingBag,
  FiMessageCircle,
  FiHome,
  FiUser,
  FiMenu,
  FiX,
} from "react-icons/fi";
import "../Css_for_all/UserDashNav.css";

const NAV_ITEMS = [
  { to: "/User/dashboard/SymptomChecker", label: "AI Health Check", icon: FiCpu },
  { to: "/User/dashboard/Meetdoctor", label: "Meet Doctor", icon: FiUsers },
  { to: "/User/dashboard/Appointments", label: "Appointments", icon: FiCalendar },
  { to: "/User/dashboard/medical-store", label: "Medical Store", icon: FiShoppingBag },
  { to: "/User/dashboard/Chat", label: "Chat", icon: FiMessageCircle },
  { to: "/User/dashboard/AIRecommanded", label: "Home Remedies", icon: FiHome },
  { to: "/User/dashboard/Profile", label: "Profile", icon: FiUser },
];

function UserDashBoardNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch {}
  const avatar = user?.avatar;
  const location = useLocation();

  const isActive = (path) => {
    if (path === "/User/dashboard" || path === "/User/dashboard/Home") {
      return (
        location.pathname === "/user/dashboard" ||
        location.pathname === "/user/dashboard/" ||
        location.pathname === "/user/dashboard/Home" ||
        location.pathname === "/User/dashboard" ||
        location.pathname === "/User/dashboard/" ||
        location.pathname === "/User/dashboard/Home"
      );
    }
    return location.pathname.toLowerCase() === path.toLowerCase();
  };

  const isHomePage =
    location.pathname === "/user/dashboard" ||
    location.pathname === "/user/dashboard/" ||
    location.pathname === "/user/dashboard/Home" ||
    location.pathname === "/User/dashboard" ||
    location.pathname === "/User/dashboard/" ||
    location.pathname === "/User/dashboard/Home";

  return (
    <header className="udn-header">
      <div className="udn-header-inner">
        {/* Brand */}
        <Link to="/user/dashboard" className="udn-brand">
          <span className="udn-brand-icon">☘</span>
          RemedyEase
        </Link>

        {/* Desktop Nav */}
        <nav className="udn-nav">
          <Link
            to="/User/dashboard/Home"
            className={`udn-nav-link ${isHomePage ? "udn-nav-link--active" : ""}`}
          >
            Home
          </Link>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`udn-nav-link ${isActive(item.to) ? "udn-nav-link--active" : ""}`}
              >
                <Icon size={15} className="udn-nav-icon" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Avatar */}
        <div className="udn-actions">
          {avatar && (
            <Link to="/User/dashboard/Profile">
              <img
                src={avatar}
                alt="Profile"
                className="udn-avatar"
              />
            </Link>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="udn-mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="udn-mobile-menu">
          <nav className="udn-mobile-nav">
            <Link
              to="/User/dashboard/Home"
              className={`udn-mobile-link ${isHomePage ? "udn-mobile-link--active" : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              Home
            </Link>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`udn-mobile-link ${isActive(item.to) ? "udn-mobile-link--active" : ""}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}

export default UserDashBoardNav;
