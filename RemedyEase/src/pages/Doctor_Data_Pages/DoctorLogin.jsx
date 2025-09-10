import React from "react";
import "../../Css_for_all/Login.css";
import { Link } from "react-router-dom";
import DoctorSignup from "./DoctorSignUp";

export default function DoctorLogin() {
  return (
    <>
      <div className="login-form">
        <h1 className="login-logo">☘RemedyEase</h1>
        <h2 className="login-title">Login</h2>
        <h3 className="login-header">Welcome Back!</h3>
        <div className="login-divider">
          <form>
            <div className="login-input-group">
              <label className="login-label">Email</label>
              <input
                type="email"
                name="email"
                placeholder="your email"
                required
                className="login_input"
              />
            </div>
            <div className="login-input-group">
              <label className="login-label">Password</label>
              <input
                type="password"
                name="password"
                placeholder="your password"
                required
                className="login_input"
              />
            </div>
            <button type="submit" className="login-button">
              Login
            </button>
          </form>
          <p className="signin">
            If you don't have account you can{" "}
            <Link to="/doctor/signup" className="login-signup-link">
              Sign-up
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
