import React, { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const SignupStyles = () => (
  <style>
    {`
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
      .signup-form { display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; padding: 20px; background: linear-gradient(135deg, #e6ffe6, #dcf8ff); font-family: 'Poppins', sans-serif; }
      .signup-logo { font-size: 50px; color: #388e3c; font-weight: 800; text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1); }
      .signup-title { font-size: 36px; font-weight: 700; margin-top: 15px; margin-bottom: 10px; color: #333; }
      .signup-header { font-size: 18px; font-weight: 400; color: #555; margin-bottom: 30px; text-align: center; }
      .signup-divider { display: flex; flex-direction: column; gap: 15px; background-color: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1); min-width: 380px; border: 1px solid #ffffff30; }
      .signup-input-group { display: flex; flex-direction: column; width: 100%; }
      .signup-label { font-size: 16px; margin-bottom: 8px; font-weight: 600; color: #333; }
      .signup_input { width: 100%; padding: 14px 18px; font-size: 16px; background-color: #f9f9f9; border: 1px solid #ddd; border-radius: 10px; box-sizing: border-box; transition: all 0.3s ease; }
      .signup_input:focus { border-color: #4CAF50; box-shadow: 0 0 0 4px rgba(76, 175, 80, 0.2); background-color: #fff; outline: none; }
      .signup_input::placeholder { color: #aaa; }
      .agree-row { display: flex; align-items: center; margin-top: 10px; }
      .agree-row input[type="checkbox"] { margin-right: 10px; width: 16px; height: 16px; }
      .agree-label { font-size: 14px; color: #555; font-weight: 400; }
      .signup-button { width: 100%; padding: 14px 20px; font-size: 16px; font-weight: 700; letter-spacing: 0.5px; color: white; background: linear-gradient(90deg, #4CAF50, #388e3c); border: none; border-radius: 10px; cursor: pointer; margin-top: 15px; transition: transform 0.2s ease, box-shadow 0.2s ease; }
      .signup-button:hover { box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2); transform: translateY(-3px); }
      .signin-prompt { font-size: 15px; font-weight: 500; text-align: center; margin-top: 20px; }
      .signin-link { color: #4CAF50; text-decoration: none; font-weight: 600; }
      .signin-link:hover { text-decoration: underline; }
      .signup-message { margin-top: 15px; padding: 10px; border-radius: 5px; text-align: center; font-weight: 500; }
      .signup-message.error { background-color: #ffebee; color: #c62828; border: 1px solid #ef5350; }
      .signup-message.success { background-color: #e8f5e8; color: #2e7d32; border: 1px solid #4caf50; }
      @media (max-width: 480px) { .signup-divider { min-width: 90vw; padding: 30px 25px; } .signup-logo { font-size: 40px; } .signup-title { font-size: 30px; } }
    `}
  </style>
);

export default function Signup() {
  const avatarRef = useRef();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agree: false,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");

    if (!form.agree) {
      setMessage("You must agree to the terms.");
      setMessageType("error");
      return;
    }
    if (!avatarRef.current.files[0]) {
      setMessage("Please upload your avatar.");
      setMessageType("error");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setMessage("Passwords do not match.");
      setMessageType("error");
      return;
    }
    if (form.password.length < 6) {
      setMessage("Password must be at least 6 characters long.");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("Creating your account...");

    try {
      const formData = new FormData();
      formData.append("fullname", form.fullName);
      formData.append("email", form.email);
      formData.append("password", form.password);
      formData.append("confirmPassword", form.confirmPassword);
      formData.append("avatar", avatarRef.current.files[0]);

      const res = await fetch(`/api/v1/users/register`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Account created successfully! Redirecting to login...");
        setMessageType("success");
        setForm({
            fullName: "",
            email: "",
            password: "",
            confirmPassword: "",
            agree: false,
        });
        avatarRef.current.value = "";
        setTimeout(() => {
          navigate("/user/login");
        }, 2000);
      } else {
        setMessage(data.message || `Error: ${res.statusText}`);
        setMessageType("error");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setMessage("Cannot connect to server. Please try again.");
      setMessageType("error");
    }
    setLoading(false);
  };

  return (
    <>
      <SignupStyles />
      <div className="signup-form">
        <h1 className="signup-logo">☘RemedyEase</h1>
        <h2 className="signup-title">Create Your Account</h2>
        <h3 className="signup-header">
          Join RemedyEase and start your wellness journey today!
        </h3>
        <div className="signup-divider">
          <form onSubmit={handleSubmit} encType="multipart/form-data">
            <div className="signup-input-group">
              <label className="signup-label">Full Name</label>
              <input type="text" name="fullName" placeholder="John Doe" required className="signup_input" value={form.fullName} onChange={handleChange} />
            </div>
            <div className="signup-input-group">
              <label className="signup-label">Email</label>
              <input type="email" name="email" placeholder="john@example.com" required className="signup_input" value={form.email} onChange={handleChange} />
            </div>
            <div className="signup-input-group">
              <label className="signup-label">Password</label>
              <input type="password" name="password" placeholder="At least 6 characters" required className="signup_input" value={form.password} onChange={handleChange} />
            </div>
            <div className="signup-input-group">
              <label className="signup-label">Confirm Password</label>
              <input type="password" name="confirmPassword" placeholder="Re-enter your password" required className="signup_input" value={form.confirmPassword} onChange={handleChange} />
            </div>
            <div className="signup-input-group">
              <label className="signup-label">Avatar (Profile Photo)</label>
              <input type="file" name="avatar" accept="image/*" required className="signup_input" ref={avatarRef} />
            </div>
            <div className="agree-row">
              <input type="checkbox" id="agree" name="agree" checked={form.agree} onChange={handleChange} required />
              <label htmlFor="agree" className="agree-label">I agree to the terms and conditions</label>
            </div>
            <button type="submit" className="signup-button" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </button>
            {message && (
              <p className={`signup-message ${messageType}`}>{message}</p>
            )}
          </form>
          <p className="signin-prompt">
            Already have an account?{" "}
            <Link to="/user/login" className="signin-link">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}