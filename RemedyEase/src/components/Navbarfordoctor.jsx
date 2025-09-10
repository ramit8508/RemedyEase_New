import React from "react";
import { Link } from "react-router-dom";
import "../Css_for_all/Navbarfordoctor.css";
const navbar = {
  display: "flex",
  justifyContent: "space-around",
  padding: "15px 40px",
  backgroundColor: "#fff",
  boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
  fontFamily: "Arial, sans-serif",
  flexWrap: "wrap",
};
const Logo = {
  color: "#008639",
  fontWeight: "bold",
  fontSize: "30px",
  marginTop: "6px",
};
const style0 = {
  marginTop: "6px",
  textDecoration: "none",
  color: "black",
  fontSize: "18px",
  alignitems: "center",
};
const login = {
  display: "flex",
  justifyContent: "center" /* horizontal centering */,
  alignItems: "center" /* vertical centering */,
  padding: "5px 10px" /* adjust as needed */,
  width: "120px" /* optional: set a width */,
  height: "40px",
  textDecoration: "none",
  color: "black",
  backgroundColor: "#90EE90",
  border: "1px solid white",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "18px",
  alignitems: "center",
};
const signup = {
  display: "flex",
  justifyContent: "center" /* horizontal centering */,
  alignItems: "center" /* vertical centering */,
  padding: "5px 10px" /* adjust as needed */,
  width: "120px" /* optional: set a width */,
  height: "40px",
  textDecoration: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "18px",
  fontWeight: 600,
  transition: "all 0.3s ease",
  border: "1px solid white",
  color: "black",
  backgroundColor: "lightgrey",
  alignitems: "center",
};

function Navbarfordoctor() {
  return (
    <>
      <div className="navbarforuserpage" style={navbar}>
        <h1 style={Logo}>☘RemedyEase</h1>
        <Link to="/doctor/home" className="user-link" style={style0}>
          Home
        </Link>
        <Link to="/doctor/service" className="user-link" style={style0}>
          Services
        </Link>
        <Link to="/doctor/about" className="user-link" style={style0}>
          About Us
        </Link>
        <Link to="/doctor/contact" className="user-link" style={style0}>
          Contact Us
        </Link>
        <Link to="/doctor/login" className="user-link" style={login}>
          Login
        </Link>
        <Link to="/doctor/signup" className="user-link" style={signup}>
          Sign Up
        </Link>
      </div>
    </>
  );
}

export default Navbarfordoctor;
