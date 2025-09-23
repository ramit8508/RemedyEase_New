import React from "react";
import emoji1 from "../../images/emoji1.png";
import emoji2 from "../../images/emoji2.jpg";
import emoji3 from "../../images/emoji3.png";
import { Link } from "react-router-dom";
import "../../Css_for_all/UserHome.css";
import emoji4 from "../../images/emoji4.png";
import emoji5 from "../../images/emoji5.png";
import emoji6 from "../../images/emoji6.png";
import person1 from "../../images/person1.jpg";
import person2 from "../../images/person2.jpg";
import person3 from "../../images/person3.jpg";
import Footerforuser from "../../components/Footerforuser";

function UserHome() {
  return (
    <>
      <div className="first-container">
        <h1 className="heading">Your Health, Simplified</h1>
        <p className="subheading">
          Connect with top doctors online, chat in real-time and get AI-powered
          health insights. Your well-being is our top priority
        </p>
        <div className="buttons">
          <Link to="/user/signup">
            <button className="btn1">Get Started</button>
          </Link>
          <Link to="/learn">
            <button className="btn2">Learn More</button>
          </Link>
        </div>
      </div>
      <div className="key">
        <h1 className="key-heading">Key Features</h1>
        <p className="key_para">
          Explore how RemedyEase makes healthcare accessible and convenient
        </p>
        <div className="key-features">
          <div className="feature1">
            <img src={emoji1} alt="Emoji 1" className="emoji" />
            <h1 className="feature-title">Online Consultations</h1>
            <p className="feature-description">
              Schedule Video calls with experienced doctors from the comfort of
              your home.
            </p>
          </div>
          <div className="feature2">
            <img src={emoji2} alt="Emoji 2" className="emoji" />
            <h1 className="feature-title">Real-time Doctor Chat</h1>
            <p className="feature-description">
              Chat with doctors to discuss your health concerns and get
              immediate advice
            </p>
          </div>
          <div className="feature3">
            <img src={emoji3} alt="Emoji 3" className="emoji1" />
            <h1 className="feature-title">AI-Powered Recommendations</h1>
            <p className="feature-description">
              Receive personalized Remedies based on symptoms and health
              history.
            </p>
          </div>
        </div>
        <div className="how">
          <h1 className="how-heading">How RemedyEase Works</h1>
          <p className="how-para">
            Simple streamline process for your healthcare needs
          </p>
          <div className="how-cards">
            {/* Note: It's better practice to use different class names if they have different styles */}
            <div className="how-card1">
              <img src={emoji4} alt="sigup-img" className="img4" />
              <h1 className="how-card-title">1. Sign Up</h1>
              <p className="how-card-description">
                Create an account with your email and a password.
              </p>
            </div>
            <div className="how-card1">
              <img src={emoji5} alt="select-doctor-img" className="img4" />
              <h1 className="how-card-title">2. Select Doctor</h1>
              <p className="how-card-description">
                Choose a doctor from our list of specialists.
              </p>
            </div>
            <div className="how-card1">
              <img src={emoji6} alt="get-healthcare-img" className="img4" />
              <h1 className="how-card-title">3. Get Healthcare</h1>
              <p className="how-card-description">
                Access personalized healthcare solutions tailored to your needs.
              </p>
            </div>
          </div>
        </div>
        <div className="feedback-contain">
          <h1 className="feedback-heading">What Our Users Say</h1>
          <p className="feedback-para">
            Real stories from people who have experienced the RemedyEase
          </p>
          <div className="feedback-container">
            <div className="feedback1">
              <p className="feedback-text">
                "RemedyEase made it so easy to consult with a doctor without
                leaving my home. The AI recommendations were spot on!"{" "}
              </p>
              <img src={person1} alt="Sarah K." className="person" />
              <h1 className="feedback-user">- Sarah K.</h1>
            </div>
            <div className="feedback2">
              <p className="feedback-text">
                "I love the convenience of online consultations. It's like
                having a doctor in my pocket!"{" "}
              </p>
              <img src={person2} alt="John D." className="person1" />
              <h1 className="feedback-user">- John D.</h1>
            </div>
            <div className="feedback3">
              <p className="feedback-text">
                "The AI recommendations helped me find the right treatment
                quickly. Highly recommend!"{" "}
              </p>
              <img src={person3} alt="Emily R." className="person" />
              <h1 className="feedback-user">- Emily R.</h1>
            </div>
          </div>
        </div>
        <div className="ready">
          <h1 className="ready-heading">
            Ready to Take Control of Your Health?
          </h1>
          <Link to="/signup">
            <button className="ready-button">
              Get Started with RemedyEase
            </button>
          </Link>
          <p className="ready-para">
            Join millions of users who are taking charge of their health.
          </p>
        </div>
      </div>
      <Footerforuser />
    </>
  );
}

export default UserHome;
