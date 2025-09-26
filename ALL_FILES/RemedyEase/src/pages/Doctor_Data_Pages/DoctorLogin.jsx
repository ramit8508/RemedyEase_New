import React, { useState } from "react";
import "../../Css_for_all/Login.css";
import { Link, useNavigate } from "react-router-dom";

export default function DoctorLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch("/api/v1/doctors/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("doctorEmail", email);
        localStorage.setItem("doctor", JSON.stringify(data.data.doctor));
        setMessage("Login successful! Redirecting...");
        setTimeout(() => {
          navigate("/doctor/dashboard/home");
        }, 1200);
      } else {
        setMessage(data.message || "Login failed.");
      }
    } catch (err) {
      setMessage("Cannot connect to server. Please try again.");
    }
    setLoading(false);
  };

  return (
    <>
      <div className="login-form">
        <h1 className="login-logo">☘RemedyEase</h1>
        <h2 className="login-title">Login</h2>
        <h3 className="login-header">Welcome Back!</h3>
        <div className="login-divider">
          <form onSubmit={handleSubmit}>
            <div className="login-input-group">
              <label className="login-label">Email</label>
              <input
                type="email"
                name="email"
                placeholder="your email"
                required
                className="login_input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
            {message && (
              <div
                style={{
                  color: message.includes("success") ? "green" : "red",
                  marginTop: 10,
                }}
              >
                {message}
              </div>
            )}
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