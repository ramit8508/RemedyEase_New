import React from "react";
import emoji1 from "../../images/emoji1.png";
import emoji2 from "../../images/emoji2.jpg";
import emoji3 from "../../images/emoji3.png";
import { Link } from "react-router-dom";
import "../../Css_for_all/UserHome.css"; // Assuming you are reusing styles
import doctor4 from "../../images/doctor4.jpg";
import doctor5 from "../../images/doctor5.png";
import doctor6 from "../../images/doctor6.jpg";
import emoji4 from "../../images/emoji4.png";
import emoji5 from "../../images/emoji5.png";
import emoji6 from "../../images/emoji6.png";
import Footerdoctor from "../../components/Footerdoctor";

function DoctorHome() {
  return (
    <>
      <div className="first-container">
        <h1 className="heading">Your Practice, Simplified</h1>
        <p className="subheading">
          Connect with patients on a secure platform, manage communications in
          real-time, and leverage AI-powered clinical support. Your practice's
          success is our top priority.
        </p>
        <div className="buttons">
          <Link to="/doctor/signup">
            <button className="btn1">Get Started</button>
          </Link>
          <Link to="/doctor/login">
            <button className="btn2">Login</button>
          </Link>
        </div>
      </div>
      <div className="key">
        <h1 className="key-heading">Key Features</h1>
        <p className="key_para">
          Discover how RemedyEase makes your practice more efficient and
          flexible.
        </p>
        <div className="key-features">
          <div className="feature1">
            <img src={emoji1} alt="Video Consultation Icon" className="emoji" />
            <h1 className="feature-title">Flexible Video Consultations</h1>
            <p className="feature-description">
              Conduct secure video calls with your patients on your schedule,
              from your office or home.
            </p>
          </div>
          <div className="feature2">
            <img src={emoji2} alt="Chat Icon" className="emoji" />
            <h1 className="feature-title">Efficient Patient Chat</h1>
            <p className="feature-description">
              Securely message with your patients to answer their questions and
              provide timely follow-up advice.
            </p>
          </div>
          <div className="feature3">
            <img src={emoji3} alt="AI Icon" className="emoji1" />
            <h1 className="feature-title">AI-Powered Clinical Support</h1>
            <p className="feature-description">
              Leverage AI that analyzes patient symptoms and history to provide
              data-driven treatment suggestions.
            </p>
          </div>
        </div>
        <div className="how">
          <h1 className="how-heading">How RemedyEase Works</h1>
          <p className="how-para">
            A simple, streamlined process for your practice.
          </p>
          <div className="how-cards">
            <div className="how-card1">
              <img src={emoji4} alt="Sign Up Icon" className="img4" />
              {/* FIXED: Removed unnecessary {" "} */}
              <h1 className="how-card-title">
                1. Create Your Professional Profile
              </h1>
              <p className="how-card-description">
                Quickly set up your secure physician account with your email and
                a password to get started.
              </p>
            </div>
            <div className="how-card1">
              <img src={emoji5} alt="Profile Icon" className="img4" />
              <h1 className="how-card-title">2. Build Your Profile</h1>
              <p className="how-card-description">
                Add your credentials, specialties, and professional bio so
                patients can connect with you.
              </p>
            </div>
            <div className="how-card1">
              <img src={emoji6} alt="Consultation Icon" className="img4" />
              <h1 className="how-card-title">3. Start Consulting</h1>
              <p className="how-card-description">
                Begin accepting virtual appointments and providing your expert
                care to patients on our secure platform.
              </p>
            </div>
          </div>
        </div>
        <div className="feedback-contain">
          {/* FIXED: Renamed heading to be doctor-centric */}
          <h1 className="feedback-heading">What Our Physicians Say</h1>
          <p className="feedback-para">
            {/* FIXED: Updated subheading text */}
            Real stories from medical professionals on our platform.
          </p>
          <div className="feedback-container">
            <div className="feedback1">
              <p className="feedback-text">
                Integrating RemedyEase into my practice was incredibly easy. The
                platform is so intuitive, and it allows me to seamlessly conduct
                virtual consultations from my office or home. It has genuinely
                simplified my workflow.
              </p>
              <img src={doctor4} alt="Dr. Sarah Chen" className="person" />
              <h1 className="feedback-user">— Dr. Sarah Chen</h1>

              <p className="feedback-specialty">Family Medicine</p>
            </div>
            <div className="feedback2">
              {/* FIXED: Replaced patient testimonial with a doctor testimonial */}
              <p className="feedback-text">
                "The AI-assisted tools are impressive. They provide relevant
                clinical insights based on patient data, which helps me build
                comprehensive care plans more efficiently. A smart feature that
                complements my expertise."
              </p>
              <img src={doctor5} alt="Dr. Ben Carter" className="person" />
              <h1 className="feedback-user">— Dr. Ben Carter</h1>
              <p className="feedback-specialty">Internist</p>
            </div>
            <div className="feedback3">
              <p className="feedback-text">
                "As a specialist, RemedyEase has been instrumental in expanding
                my reach to patients outside my local area. The flexibility of
                scheduling virtual appointments has given me better control over
                my work-life balance."
              </p>
              <img src={doctor6} alt="Dr. Emily Rodriguez" className="person" />
              <h1 className="feedback-user">— Dr. Emily Rodriguez</h1>
              <p className="feedback-specialty">Cardiologist</p>
            </div>
          </div>
        </div>
        <div className="ready">
          {/* FIXED: Changed heading to be doctor-centric */}
          <h1 className="ready-heading">Ready to Elevate Your Practice?</h1>
          {/* FIXED: Changed link to point to doctor signup for consistency */}
          <Link to="/doctor/signup">
            <button className="ready-button">
              Get Started with RemedyEase
            </button>
          </Link>
          <p className="ready-para">
            Join thousands of forward-thinking physicians transforming patient
            care.
          </p>
        </div>
      </div>
      <Footerdoctor />
    </>
  );
}

export default DoctorHome;
