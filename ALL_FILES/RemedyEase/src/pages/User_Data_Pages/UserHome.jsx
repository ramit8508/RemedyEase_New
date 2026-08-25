import React, { Suspense, lazy } from "react";
import { Link } from "react-router-dom";
import "../../Css_for_all/UserHome.css";
import person1 from "../../images/person1.jpg";
import person2 from "../../images/person2.jpg";
import person3 from "../../images/person3.jpg";
import Footerforuser from "../../components/Footerforuser";
import { FiVideo, FiMessageCircle, FiCpu, FiArrowRight, FiHeart, FiClock, FiShield, FiSmartphone } from "react-icons/fi";

const Healthcare3D = lazy(() => import("../../components/Healthcare3D"));

function UserHome() {
  return (
    <div className="uh">
      {/* ====== HERO ====== */}
      <section className="uh-hero">
        <div className="uh-hero-split">
          {/* Left — Text content */}
          <div className="uh-hero-text">
            <span className="uh-hero-badge">Your healthcare companion</span>
            <h1 className="uh-hero-h1">Your healthcare,<br />made simpler.</h1>
            <p className="uh-hero-sub">
              Connect with doctors, manage your healthcare, and get personalized
              support—all in one place.
            </p>
            <div className="uh-hero-actions">
              <Link to="/user/signup" className="uh-btn-primary">
                Get Started
                <FiArrowRight size={16} />
              </Link>
              <Link to="/user/service" className="uh-btn-outline">
                Explore Services
              </Link>
            </div>
          </div>

          {/* Right — 3D Visualization */}
          <div className="uh-hero-3d">
            <Suspense fallback={<div className="uh-hero-3d-fallback" />}>
              <Healthcare3D />
            </Suspense>
          </div>
        </div>
      </section>

      {/* ====== TRUST STRIP ====== */}
      <section className="uh-trust">
        <div className="uh-trust-inner">
          <div className="uh-trust-item">
            <FiHeart size={16} />
            <span>Patient-first care</span>
          </div>
          <div className="uh-trust-divider" />
          <div className="uh-trust-item">
            <FiVideo size={16} />
            <span>Online consultations</span>
          </div>
          <div className="uh-trust-divider" />
          <div className="uh-trust-item">
            <FiCpu size={16} />
            <span>AI-powered guidance</span>
          </div>
        </div>
      </section>

      {/* ====== KEY FEATURES ====== */}
      <section className="uh-section">
        <div className="uh-section-inner">
          <div className="uh-section-header">
            <h2 className="uh-section-title">Everything you need for better healthcare</h2>
            <p className="uh-section-sub">Simple tools designed to make your healthcare journey easier.</p>
          </div>

          <div className="uh-features-grid">
            <div className="uh-feature-card">
              <div className="uh-feature-icon uh-feature-icon--green">
                <FiVideo size={22} strokeWidth={1.8} />
              </div>
              <h3 className="uh-feature-title">Online Consultations</h3>
              <p className="uh-feature-desc">
                Schedule video calls with experienced doctors from the comfort of your home.
              </p>
            </div>

            <div className="uh-feature-card">
              <div className="uh-feature-icon uh-feature-icon--blue">
                <FiMessageCircle size={22} strokeWidth={1.8} />
              </div>
              <h3 className="uh-feature-title">Real-time Doctor Chat</h3>
              <p className="uh-feature-desc">
                Chat with doctors to discuss your health concerns and get immediate advice.
              </p>
            </div>

            <div className="uh-feature-card">
              <div className="uh-feature-icon uh-feature-icon--purple">
                <FiCpu size={22} strokeWidth={1.8} />
              </div>
              <h3 className="uh-feature-title">AI-Powered Recommendations</h3>
              <p className="uh-feature-desc">
                Receive personalized remedies based on symptoms and health history.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ====== HOW IT WORKS ====== */}
      <section className="uh-section uh-section--muted">
        <div className="uh-section-inner">
          <div className="uh-section-header">
            <h2 className="uh-section-title">How RemedyEase works</h2>
            <p className="uh-section-sub">A simple, streamlined process for your healthcare needs.</p>
          </div>

          <div className="uh-steps">
            <div className="uh-step">
              <span className="uh-step-num">01</span>
              <h3 className="uh-step-title">Create your account</h3>
              <p className="uh-step-desc">Sign up with your email and set a secure password to get started.</p>
            </div>

            <div className="uh-step-connector" aria-hidden="true" />

            <div className="uh-step">
              <span className="uh-step-num">02</span>
              <h3 className="uh-step-title">Choose your doctor</h3>
              <p className="uh-step-desc">Browse our list of specialists and select the right doctor for you.</p>
            </div>

            <div className="uh-step-connector" aria-hidden="true" />

            <div className="uh-step">
              <span className="uh-step-num">03</span>
              <h3 className="uh-step-title">Get your care</h3>
              <p className="uh-step-desc">Access personalized healthcare solutions tailored to your needs.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ====== BENEFITS ====== */}
      <section className="uh-section">
        <div className="uh-section-inner">
          <div className="uh-section-header">
            <h2 className="uh-section-title">Healthcare that fits your life</h2>
            <p className="uh-section-sub">Designed around what matters most to you.</p>
          </div>

          <div className="uh-benefits-grid">
            <div className="uh-benefit">
              <div className="uh-benefit-icon"><FiClock size={20} /></div>
              <div>
                <h4 className="uh-benefit-title">Convenient access</h4>
                <p className="uh-benefit-desc">Get care anytime, anywhere—no waiting rooms or long commutes.</p>
              </div>
            </div>

            <div className="uh-benefit">
              <div className="uh-benefit-icon"><FiMessageCircle size={20} /></div>
              <div>
                <h4 className="uh-benefit-title">Simple communication</h4>
                <p className="uh-benefit-desc">Chat and video call with your doctors directly from the app.</p>
              </div>
            </div>

            <div className="uh-benefit">
              <div className="uh-benefit-icon"><FiSmartphone size={20} /></div>
              <div>
                <h4 className="uh-benefit-title">Personalized experience</h4>
                <p className="uh-benefit-desc">AI-powered recommendations tailored to your health profile.</p>
              </div>
            </div>

            <div className="uh-benefit">
              <div className="uh-benefit-icon"><FiShield size={20} /></div>
              <div>
                <h4 className="uh-benefit-title">Secure and private</h4>
                <p className="uh-benefit-desc">Your health data is protected with industry-standard security.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== TESTIMONIALS ====== */}
      <section className="uh-section uh-section--muted">
        <div className="uh-section-inner">
          <div className="uh-section-header">
            <h2 className="uh-section-title">What our users say</h2>
            <p className="uh-section-sub">Real stories from people who have experienced RemedyEase.</p>
          </div>

          <div className="uh-testimonials">
            <div className="uh-testimonial">
              <p className="uh-testimonial-text">
                "RemedyEase made it so easy to consult with a doctor without
                leaving my home. The AI recommendations were spot on!"
              </p>
              <div className="uh-testimonial-author">
                <img src={person1} alt="Sarah K." className="uh-testimonial-avatar" />
                <span className="uh-testimonial-name">Sarah K.</span>
              </div>
            </div>

            <div className="uh-testimonial">
              <p className="uh-testimonial-text">
                "I love the convenience of online consultations. It's like
                having a doctor in my pocket!"
              </p>
              <div className="uh-testimonial-author">
                <img src={person2} alt="John D." className="uh-testimonial-avatar" />
                <span className="uh-testimonial-name">John D.</span>
              </div>
            </div>

            <div className="uh-testimonial">
              <p className="uh-testimonial-text">
                "The AI recommendations helped me find the right treatment
                quickly. Highly recommend!"
              </p>
              <div className="uh-testimonial-author">
                <img src={person3} alt="Emily R." className="uh-testimonial-avatar" />
                <span className="uh-testimonial-name">Emily R.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== CTA ====== */}
      <section className="uh-cta">
        <div className="uh-cta-inner">
          <h2 className="uh-cta-title">Ready to take control of your healthcare?</h2>
          <p className="uh-cta-sub">
            Get started with RemedyEase and make your healthcare experience simpler.
          </p>
          <Link to="/user/signup" className="uh-btn-primary uh-btn-primary--lg">
            Get Started
            <FiArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ====== FOOTER ====== */}
      <Footerforuser />
    </div>
  );
}

export default UserHome;
