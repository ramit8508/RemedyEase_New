import React, { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../Css_for_all/AuthPages.css";
import {
  FiEye,
  FiEyeOff,
  FiShield,
  FiHeart,
  FiCheck,
  FiVideo,
  FiMessageCircle,
  FiLock,
  FiMail,
  FiArrowLeft,
  FiRefreshCw,
} from "react-icons/fi";

export default function Signup() {
  const [step, setStep] = useState(1); // 1: Info Form, 2: OTP Verification
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agree: false,
  });

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpInputsRef = useRef([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Cooldown countdown timer for resending OTP
  const [countdown, setCountdown] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Focus the first OTP box when entering Step 2
  useEffect(() => {
    if (step === 2 && otpInputsRef.current[0]) {
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 150);
    }
  }, [step]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // STEP 1: Validate info & send verification OTP
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setMessage("");
    setMessageType("");

    if (!form.fullName.trim()) {
      setMessage("Please enter your full name.");
      setMessageType("error");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim() || !emailRegex.test(form.email.trim())) {
      setMessage("Please enter a valid email address.");
      setMessageType("error");
      return;
    }

    if (!form.password || form.password.length < 6) {
      setMessage("Password must be at least 6 characters long.");
      setMessageType("error");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setMessage("Passwords do not match.");
      setMessageType("error");
      return;
    }

    if (!form.agree) {
      setMessage("You must agree to the terms and conditions.");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("Sending verification code...");
    setMessageType("info");

    try {
      const res = await fetch(`/api/v1/users/send-signup-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullname: form.fullName.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          confirmPassword: form.confirmPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStep(2);
        setOtp(["", "", "", "", "", ""]);
        setCountdown(45);
        setMessage("Verification code sent to your email!");
        setMessageType("success");
      } else {
        setMessage(data.message || "Failed to send verification code.");
        setMessageType("error");
      }
    } catch (err) {
      console.error("[Signup] Error sending OTP:", err);
      setMessage("Unable to connect to the server. Please check your connection.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Handle individual OTP input changes
  const handleOtpChange = (index, value) => {
    // Only accept numeric digits
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned && value !== "") return;

    const newOtp = [...otp];
    newOtp[index] = cleaned.slice(-1); // Take last entered digit
    setOtp(newOtp);

    // Auto-advance to next input
    if (cleaned && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        otpInputsRef.current[index - 1]?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").trim();
    const digitsOnly = pastedData.replace(/\D/g, "").slice(0, 6);

    if (digitsOnly.length > 0) {
      const newOtp = ["", "", "", "", "", ""];
      for (let i = 0; i < digitsOnly.length; i++) {
        newOtp[i] = digitsOnly[i];
      }
      setOtp(newOtp);

      const nextFocus = Math.min(digitsOnly.length, 5);
      otpInputsRef.current[nextFocus]?.focus();
    }
  };

  // STEP 2: Verify OTP & complete account creation
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");

    const fullOtp = otp.join("").trim();
    if (fullOtp.length !== 6) {
      setMessage("Please enter the complete 6-digit verification code.");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("Verifying code & creating account...");
    setMessageType("info");

    try {
      const res = await fetch(`/api/v1/users/verify-signup-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullname: form.fullName.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          confirmPassword: form.confirmPassword,
          otp: fullOtp,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.data?.accessToken) {
          localStorage.setItem("accessToken", data.data.accessToken);
          localStorage.setItem("userAccessToken", data.data.accessToken);
        }
        if (data.data?.user) {
          localStorage.setItem("user", JSON.stringify(data.data.user));
        }
        localStorage.setItem("userEmail", form.email.trim().toLowerCase());

        setMessage("🎉 Account verified & created successfully! Redirecting to dashboard...");
        setMessageType("success");

        setTimeout(() => {
          navigate("/user/dashboard/Home");
        }, 1200);
      } else {
        setMessage(data.message || "Verification failed. Please check the code.");
        setMessageType("error");
      }
    } catch (err) {
      console.error("[Signup] Error verifying OTP:", err);
      setMessage("Unable to connect to server. Please try again.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const getMessageClass = () => {
    if (messageType === "success") return "auth-message auth-message--success";
    if (messageType === "error") return "auth-message auth-message--error";
    return "auth-message auth-message--info";
  };

  return (
    <div className="auth-page">
      <div className="auth-layout">
        {/* LEFT COLUMN — Intro */}
        <div className="auth-intro">
          <span className="auth-intro-badge">RemedyEase Healthcare</span>
          <h2 className="auth-intro-heading">Healthcare made simpler.</h2>
          <p className="auth-intro-text">
            Connect with trusted doctors, manage your healthcare and access
            personalized support — all from one secure platform.
          </p>

          <div className="auth-benefits">
            <div className="auth-benefit-item">
              <div className="auth-benefit-icon auth-benefit-icon--green">
                <FiVideo size={18} />
              </div>
              <div className="auth-benefit-text">
                <span className="auth-benefit-title">Video Consultations</span>
                <span className="auth-benefit-sub">Meet trusted doctors online</span>
              </div>
            </div>

            <div className="auth-benefit-item">
              <div className="auth-benefit-icon auth-benefit-icon--blue">
                <FiMessageCircle size={18} />
              </div>
              <div className="auth-benefit-text">
                <span className="auth-benefit-title">Real-time Doctor Chat</span>
                <span className="auth-benefit-sub">Get support when you need it</span>
              </div>
            </div>

            <div className="auth-benefit-item">
              <div className="auth-benefit-icon auth-benefit-icon--green">
                <FiShield size={18} />
              </div>
              <div className="auth-benefit-text">
                <span className="auth-benefit-title">Secure & Private</span>
                <span className="auth-benefit-sub">Your healthcare data stays protected</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN — Form */}
        <div className="auth-form-column">
          <Link to="/user/home" className="auth-brand">RemedyEase</Link>

          <div className="auth-card">
            {step === 1 ? (
              /* STEP 1: Registration Details */
              <>
                <div className="auth-step-pill">
                  <FiLock size={12} />
                  <span>Step 1 of 2: Patient Details</span>
                </div>

                <h1 className="auth-card-title">Create your account</h1>
                <p className="auth-card-subtitle">
                  Join RemedyEase and take control of your healthcare.
                </p>

                <form onSubmit={handleSendOtp}>
                  <div className="auth-section">
                    <span className="auth-section-label">Personal Information</span>

                    <div className="auth-field">
                      <label htmlFor="signup-fullname" className="auth-label">Full Name</label>
                      <div className="auth-input-wrapper">
                        <input
                          id="signup-fullname"
                          type="text"
                          name="fullName"
                          placeholder="e.g. Sam Goyal"
                          required
                          className="auth-input"
                          value={form.fullName}
                          onChange={handleChange}
                          autoComplete="name"
                        />
                      </div>
                    </div>

                    <div className="auth-field">
                      <label htmlFor="signup-email" className="auth-label">Email Address</label>
                      <div className="auth-input-wrapper">
                        <input
                          id="signup-email"
                          type="email"
                          name="email"
                          placeholder="you@example.com"
                          required
                          className="auth-input"
                          value={form.email}
                          onChange={handleChange}
                          autoComplete="email"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="auth-section">
                    <span className="auth-section-label">Security</span>

                    <div className="auth-field">
                      <label htmlFor="signup-password" className="auth-label">Password</label>
                      <div className="auth-input-wrapper">
                        <input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          name="password"
                          placeholder="At least 6 characters"
                          required
                          className="auth-input auth-input--password"
                          value={form.password}
                          onChange={handleChange}
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="auth-password-toggle"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          tabIndex={0}
                        >
                          {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="auth-field">
                      <label htmlFor="signup-confirm-password" className="auth-label">Confirm Password</label>
                      <div className="auth-input-wrapper">
                        <input
                          id="signup-confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          placeholder="Re-enter your password"
                          required
                          className="auth-input auth-input--password"
                          value={form.confirmPassword}
                          onChange={handleChange}
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="auth-password-toggle"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                          tabIndex={0}
                        >
                          {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="auth-checkbox-row">
                    <input
                      type="checkbox"
                      id="agree"
                      name="agree"
                      checked={form.agree}
                      onChange={handleChange}
                      required
                    />
                    <label htmlFor="agree" className="auth-checkbox-label">
                      I agree to the terms of service and privacy policy
                    </label>
                  </div>

                  <button type="submit" className="auth-submit-btn" disabled={loading}>
                    {loading ? "Sending verification code..." : "Continue →"}
                  </button>

                  {message && (
                    <div className={getMessageClass()}>
                      {message}
                    </div>
                  )}
                </form>
              </>
            ) : (
              /* STEP 2: OTP Verification */
              <>
                <div className="auth-step-pill">
                  <FiMail size={12} />
                  <span>Step 2 of 2: Email Verification</span>
                </div>

                <h1 className="auth-card-title">Verify your email</h1>
                <p className="auth-card-subtitle">
                  We've sent a 6-digit verification code to your email.
                </p>

                <div className="auth-otp-summary">
                  <div className="auth-otp-summary-text">
                    <span>Sent code to: </span>
                    <span className="auth-otp-summary-email">{form.email}</span>
                  </div>
                  <button
                    type="button"
                    className="auth-back-btn"
                    onClick={() => {
                      setStep(1);
                      setMessage("");
                      setMessageType("");
                    }}
                  >
                    <FiArrowLeft size={13} />
                    <span>Change</span>
                  </button>
                </div>

                <form onSubmit={handleVerifyOtp}>
                  <label className="auth-label" style={{ textAlign: "center", display: "block" }}>
                    Enter 6-Digit Code
                  </label>

                  <div className="auth-otp-boxes" onPaste={handleOtpPaste}>
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (otpInputsRef.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        className={`auth-otp-box ${digit ? "filled" : ""}`}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        autoComplete="one-time-code"
                        aria-label={`Digit ${idx + 1}`}
                      />
                    ))}
                  </div>

                  <div className="auth-resend-row">
                    <button
                      type="button"
                      className="auth-back-btn"
                      onClick={() => {
                        setStep(1);
                        setMessage("");
                        setMessageType("");
                      }}
                    >
                      <FiArrowLeft size={14} />
                      <span>Edit Details</span>
                    </button>

                    <button
                      type="button"
                      className="auth-resend-btn"
                      onClick={() => handleSendOtp()}
                      disabled={countdown > 0 || loading}
                    >
                      <FiRefreshCw size={13} className={loading ? "spin" : ""} />
                      {countdown > 0 ? `Resend code in ${countdown}s` : "Resend Code"}
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="auth-submit-btn"
                    disabled={loading || otp.join("").length !== 6}
                  >
                    {loading ? "Verifying..." : "Verify & Create Account →"}
                  </button>

                  {message && (
                    <div className={getMessageClass()}>
                      {message}
                    </div>
                  )}
                </form>
              </>
            )}

            <div className="auth-divider">
              <span className="auth-divider-text">or</span>
            </div>

            <p className="auth-footer-text">
              Already have an account?{" "}
              <Link to="/user/login" className="auth-footer-link">
                Sign in
              </Link>
            </p>

            <div className="auth-secure-note">
              <FiLock size={14} />
              <span>Your information is protected with secure encryption.</span>
            </div>
          </div>

          <div className="auth-trust-row">
            <div className="auth-trust-item">
              <FiShield size={14} />
              <span>Secure & private</span>
            </div>
            <div className="auth-trust-item">
              <FiHeart size={14} />
              <span>Patient-first</span>
            </div>
            <div className="auth-trust-item">
              <FiCheck size={14} />
              <span>Trusted healthcare platform</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}