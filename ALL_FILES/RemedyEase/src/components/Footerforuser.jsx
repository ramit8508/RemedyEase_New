import React from "react";
import logo from "../images/Logo.png";
import { Link } from "react-router-dom";

const footer = {
  display: "flex",
  flexDirection: "row",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "center",
  gap: "48px",
  padding: "32px 16px 16px 16px",
  background: "linear-gradient(90deg, #e6ffe6 60%, #b2f7c1 100%)",
  borderRadius: "24px 24px 0 0",
  boxShadow: "0 -2px 16px rgba(72, 168, 96, 0.08)",
  width: "100vw",           
  position: "relative",    
  left: 0,
  right: 0,
  margin: 0,               
};

const logoimg = {
  height: "90px",
  width: "120px",
  objectFit: "contain",
  marginRight: "24px",
};

const linkStyle = {
  textDecoration: "none",
  color: "#222",
  fontSize: "20px",
  fontWeight: 700,
  padding: "8px 18px",
  borderRadius: "8px",
  transition: "background 0.2s, color 0.2s, box-shadow 0.2s",
  textAlign: "center",
  display: "flex",
  alignItems: "center",
};

const linkHover = {
  background: "#48a860",
  color: "#fff",
  boxShadow: "0 2px 8px rgba(72, 168, 96, 0.13)",
};

const copyright = {
  textAlign: "center",
  background: "none",
  color: "#388e3c",
  fontSize: "15px",
  fontWeight: 600,
  margin: "18px 0 0 0",
  letterSpacing: "0.5px",
  width: "100vw",           
};

function Footerforuser() {
  const [hovered, setHovered] = React.useState("");

  return (
    <>
      <div className="footer" style={footer}>
        <img src={logo} alt="Logo" style={logoimg} />
        <Link
          to="/"
          style={hovered === "home" ? { ...linkStyle, ...linkHover } : linkStyle}
          onMouseEnter={() => setHovered("home")}
          onMouseLeave={() => setHovered("")}
        >
          Home
        </Link>
        <Link
          to="/user/service"
          style={hovered === "services" ? { ...linkStyle, ...linkHover } : linkStyle}
          onMouseEnter={() => setHovered("services")}
          onMouseLeave={() => setHovered("")}
        >
          Services
        </Link>
        <Link
          to="/user/about"
          style={hovered === "about" ? { ...linkStyle, ...linkHover } : linkStyle}
          onMouseEnter={() => setHovered("about")}
          onMouseLeave={() => setHovered("")}
        >
          About Us
        </Link>
      </div>
      <p style={copyright}>© 2024 RemedyEase. All rights reserved.</p>
    </>
  );
}

export default Footerforuser;