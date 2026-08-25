import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../../Css_for_all/Contact.css";
import Footerforuser from "../../components/Footerforuser";
import {
  FiMail, FiPhone, FiMapPin, FiClock, FiShield,
  FiCheckCircle, FiChevronDown, FiSend, FiArrowRight,
  FiHelpCircle, FiMessageSquare, FiLifeBuoy, FiLock
} from "react-icons/fi";
import { FaLinkedin, FaGithub } from "react-icons/fa";

const FAQS = [
  {
    q: "How quickly will I receive a response?",
    a: "Our support team typically reviews and responds to all inquiries within 24 hours on business days.",
  },
  {
    q: "How can I contact a doctor?",
    a: "You can easily schedule a video consultation or start a direct real-time chat with certified specialists through your patient dashboard.",
  },
  {
    q: "Is my personal healthcare information secure?",
    a: "Yes. RemedyEase adheres to strict healthcare data privacy standards. All consultations and medical messages are protected with end-to-end encryption.",
  },
  {
    q: "Can I get help with my RemedyEase account?",
    a: "Absolutely. Send us a message using this form, email support directly, or manage your account preferences in the patient settings.",
  },
];

export default function Contact() {
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");

  // FAQ Accordion State (all collapsed by default)
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setFormError("Please fill out all required fields.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(formData.email)) {
      setFormError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    // Simulate reliable API submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
      setTimeout(() => setSubmitted(false), 5000);
    }, 1000);
  };

  return (
    <div className="ct">
      {/* ====== HERO ====== */}
      <section className="ct-hero">
        <div className="ct-container">
          <div className="ct-hero-split">
            {/* Left Header Content */}
            <div className="ct-hero-text">
              <span className="ct-eyebrow">GET IN TOUCH</span>
              <h1 className="ct-hero-h1">
                We're here to <span className="ct-green">help.</span>
              </h1>
              <p className="ct-hero-sub">
                Have a question about RemedyEase? Our team is here to help you
                get the most out of your healthcare experience.
              </p>
              <div className="ct-hero-badges">
                <div className="ct-hero-badge">
                  <FiClock className="ct-badge-ico" size={14} />
                  <span>24-Hour Response Time</span>
                </div>
                <div className="ct-hero-badge">
                  <FiShield className="ct-badge-ico" size={14} />
                  <span>100% Confidential</span>
                </div>
              </div>
            </div>

            {/* Right Abstract Healthcare UI Visual */}
            <div className="ct-hero-visual">
              <div className="ct-hero-card">
                <div className="ct-card-top-pill">
                  <span className="ct-pill-dot" />
                  <span>Support Center Active</span>
                </div>
                <h3 className="ct-card-hero-title">Patient & Doctor Assistance</h3>
                <p className="ct-card-hero-desc">
                  Reach out for platform questions, consultation assistance, or technical guidance.
                </p>
                <div className="ct-hero-card-list">
                  <div className="ct-hero-card-item">
                    <FiCheckCircle className="ct-green-check" size={14} />
                    <span>Dedicated Patient Support</span>
                  </div>
                  <div className="ct-hero-card-item">
                    <FiCheckCircle className="ct-green-check" size={14} />
                    <span>Direct Medical Channel Assistance</span>
                  </div>
                  <div className="ct-hero-card-item">
                    <FiCheckCircle className="ct-green-check" size={14} />
                    <span>Encrypted Inquiry Handling</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== MAIN CONTACT SECTION (2 Columns) ====== */}
      <section className="ct-section">
        <div className="ct-container">
          <div className="ct-grid">
            {/* LEFT: Contact Form Card */}
            <div className="ct-form-card">
              <div className="ct-form-header">
                <h2 className="ct-form-title">Send us a message</h2>
                <p className="ct-form-subtitle">
                  Tell us how we can help and we'll get back to you as soon as possible.
                </p>
              </div>

              {submitted ? (
                <div className="ct-success-banner">
                  <FiCheckCircle size={22} className="ct-success-ico" />
                  <div>
                    <h4 className="ct-success-title">Message sent successfully!</h4>
                    <p className="ct-success-text">
                      Thank you for contacting RemedyEase. Our support team will respond to your email within 24 hours.
                    </p>
                  </div>
                </div>
              ) : (
                <form className="ct-form" onSubmit={handleSubmit} noValidate>
                  {formError && (
                    <div className="ct-error-banner">{formError}</div>
                  )}

                  <div className="ct-form-group">
                    <label className="ct-label" htmlFor="ct-name">
                      Full Name <span className="ct-req">*</span>
                    </label>
                    <input
                      type="text"
                      id="ct-name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Sarah Jenkins"
                      className="ct-input"
                      required
                    />
                  </div>

                  <div className="ct-form-group">
                    <label className="ct-label" htmlFor="ct-email">
                      Email Address <span className="ct-req">*</span>
                    </label>
                    <input
                      type="email"
                      id="ct-email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className="ct-input"
                      required
                    />
                  </div>

                  <div className="ct-form-group">
                    <label className="ct-label" htmlFor="ct-subject">
                      Subject
                    </label>
                    <input
                      type="text"
                      id="ct-subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="e.g. Question about video consultation"
                      className="ct-input"
                    />
                  </div>

                  <div className="ct-form-group">
                    <label className="ct-label" htmlFor="ct-message">
                      Message <span className="ct-req">*</span>
                    </label>
                    <textarea
                      id="ct-message"
                      name="message"
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="How can we assist you today?"
                      className="ct-textarea"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="ct-submit-btn"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Sending message..." : "Send Message →"}
                  </button>

                  <div className="ct-form-privacy">
                    <FiLock size={13} />
                    <span>Your information is kept private and secure.</span>
                  </div>
                </form>
              )}
            </div>

            {/* RIGHT: Contact Info & Support Channels */}
            <div className="ct-info-col">
              {/* Info Overview Card */}
              <div className="ct-info-card">
                <h3 className="ct-info-title">Contact Information</h3>
                <p className="ct-info-desc">
                  Need help using RemedyEase? Our support team is ready to assist.
                </p>

                <div className="ct-direct-list">
                  <div className="ct-direct-item">
                    <div className="ct-direct-icon">
                      <FiMail size={16} />
                    </div>
                    <div>
                      <span className="ct-direct-label">Email</span>
                      <a href="mailto:ramigoyal1987@gmail.com" className="ct-direct-val">
                        ramigoyal1987@gmail.com
                      </a>
                    </div>
                  </div>

                  <div className="ct-direct-item">
                    <div className="ct-direct-icon">
                      <FiClock size={16} />
                    </div>
                    <div>
                      <span className="ct-direct-label">Response Time</span>
                      <span className="ct-direct-val">We usually respond within 24 hours.</span>
                    </div>
                  </div>

                  <div className="ct-direct-item">
                    <div className="ct-direct-icon">
                      <FiMapPin size={16} />
                    </div>
                    <div>
                      <span className="ct-direct-label">Location</span>
                      <span className="ct-direct-val">Zirakpur, Punjab, India</span>
                    </div>
                  </div>
                </div>

                {/* 3 Support Channel Blocks */}
                <div className="ct-channels-section">
                  <h4 className="ct-channels-heading">Support Channels</h4>
                  <div className="ct-channels-grid">
                    <div className="ct-channel-box">
                      <FiMessageSquare className="ct-channel-ico" size={17} />
                      <div>
                        <strong>Email Support</strong>
                        <p>General inquiries, feedback, and questions.</p>
                      </div>
                    </div>

                    <div className="ct-channel-box">
                      <FiLifeBuoy className="ct-channel-ico" size={17} />
                      <div>
                        <strong>Patient Support</strong>
                        <p>Guidance for consultations, chats, and records.</p>
                      </div>
                    </div>

                    <div className="ct-channel-box">
                      <FiHelpCircle className="ct-channel-ico" size={17} />
                      <div>
                        <strong>Technical Support</strong>
                        <p>Assistance with account access and settings.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Social Connect */}
                <div className="ct-social-wrap">
                  <span className="ct-social-label">Follow Us</span>
                  <div className="ct-social-links">
                    <a
                      href="https://www.linkedin.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ct-social-btn"
                      aria-label="LinkedIn"
                    >
                      <FaLinkedin size={18} />
                    </a>
                    <a
                      href="https://github.com/ramit8508"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ct-social-btn"
                      aria-label="GitHub"
                    >
                      <FaGithub size={18} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== TRUST & REASSURANCE STRIP ====== */}
      <section className="ct-trust-strip">
        <div className="ct-container">
          <div className="ct-trust-inner">
            <div className="ct-trust-lead">
              <h3 className="ct-trust-title">Your privacy matters to us.</h3>
              <p className="ct-trust-sub">
                We take the privacy and security of your healthcare information seriously.
              </p>
            </div>
            <div className="ct-trust-items">
              <div className="ct-trust-pill">
                <FiShield size={15} className="ct-trust-check" />
                <span>Secure communication</span>
              </div>
              <div className="ct-trust-pill">
                <FiLock size={15} className="ct-trust-check" />
                <span>Privacy-focused platform</span>
              </div>
              <div className="ct-trust-pill">
                <FiCheckCircle size={15} className="ct-trust-check" />
                <span>Patient-first support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== FAQ SECTION ====== */}
      <section className="ct-section ct-section--faq">
        <div className="ct-container">
          <div className="ct-faq-header">
            <span className="ct-eyebrow">COMMON QUESTIONS</span>
            <h2 className="ct-section-title">Frequently asked questions</h2>
            <p className="ct-section-sub">
              Quick answers to common questions about RemedyEase.
            </p>
          </div>

          <div className="ct-faq-list">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  className={`ct-faq-item ${isOpen ? "ct-faq-item--open" : ""}`}
                  key={idx}
                >
                  <button
                    className="ct-faq-question"
                    onClick={() => toggleFaq(idx)}
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    <FiChevronDown
                      className={`ct-faq-arrow ${isOpen ? "ct-faq-arrow--rotated" : ""}`}
                      size={18}
                    />
                  </button>
                  {isOpen && (
                    <div className="ct-faq-answer">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ====== FINAL CTA ====== */}
      <section className="ct-cta">
        <div className="ct-cta-container">
          <h2 className="ct-cta-title">Need healthcare support?</h2>
          <p className="ct-cta-sub">
            Explore RemedyEase and discover a simpler way to manage your healthcare.
          </p>
          <div className="ct-cta-actions">
            <Link to="/user/signup" className="ct-btn-primary">
              Get Started <FiArrowRight size={15} />
            </Link>
            <Link to="/user/service" className="ct-btn-outline">
              Explore Services
            </Link>
          </div>
        </div>
      </section>

      {/* ====== FOOTER ====== */}
      <Footerforuser />
    </div>
  );
}
