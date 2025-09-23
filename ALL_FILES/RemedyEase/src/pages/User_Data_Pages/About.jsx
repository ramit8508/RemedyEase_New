import React from "react";
import "../../Css_for_all/About.css";
import doctor1 from "../../images/doctor1.jpg";
import doctor2 from "../../images/doctor2.jpg";
import doctor3 from "../../images/doctor3.jpg";
import star from "../../images/star.png";
import people from "../../images/people.webp";
import like  from "../../images/like.webp";
import Footerforuser from "../../components/Footerforuser";

export default function About() {
  return (
    <>
      <div className="about">
        <h1 className="about-title">About RemedyEase</h1>
        <p className="para">
          At RemedyEase, we are dedicated to transforming healthcare
          accessibility. Our journey began with a simple yet profound vision: to
          bridge the gap between patients and quality medical care, regardless
          of geographical barriers or time constraints. We believe that everyone
          deserves access to expert medical advice and support, and we are
          committed to making that a reality through our innovative online
          platform.
        </p>
        <div className="three_cards">
          <div className="card">
            <h1 className="heading1">Our Mission</h1>
            <p className="paragraph">
              Our mission is to empower individuals to take control of their
              health by providing a convenient, affordable, and reliable access
              to healthcare professionals. We strive to leverage technology to
              enhance the patient experience and improve health outcomes.
            </p>
          </div>
          <div className="card">
            <h1 className="heading1">Our Vision</h1>
            <p className="paragraph">
              We envision a future where healthcare is proactive,
              patient-centric, and seamlessly integrated into daily life.
              RemedyEase aims to be at the forefront of this transformation,
              leading the way in innovative virtual care and setting the
              standard for excellence in online healthcare.
            </p>
          </div>
          <div className="card">
            <h1 className="heading1">Our Values</h1>
            <p className="paragraph">
              Patient-Centricity: Prioritizing patient needs.
              <br />
              Integrity: Upholding the highest ethical standards.
              <br />
              Innovation: Advancing healthcare through technology.
              <br />
              Collaboration: Fostering a connected community.
              <br />
              Accessibility: Ensuring quality care for all.
              <br />
            </p>
          </div>
        </div>
        <h1 className="user_head">What our User's says</h1>
        <div className="user_feedback_container">
          <div className="feedback">
            <p className="feedback">
              "RemedyEase was a lifesaver! I got an online consultation with a
              specialist without leaving my home. The AI recommendation was
              surprisingly accurate and helpful."
            </p>
            <h1 className="users">
              -Sarah J. <br />
              verified user
            </h1>
          </div>
          <div className="feedback">
            <p className="feedback">
              "Rem"The convenience of chatting with a doctor at any time is
              incredible. I've used RemedyEase for medical advice while
              traveling, highly recommended!" edyEase was a lifesaver! I got an
              online consultation with a specialist without leaving my home. The
              AI recommendation was surprisingly accurate and helpful."
            </p>
            <h1 className="users">
              - Michael R.
              <br />
              verified user
            </h1>
          </div>
          <div className="feedback">
            <p className="feedback">
              "As a busy professional, RemedyEase has been a game-changer for
              me. Getting answers on the go and get the care I need without
              disrupting my schedule."
            </p>
            <h1 className="users">
              - Emily K.
              <br />
              verified user
            </h1>
          </div>
        </div>
        <div className="team">
          <h1 className="meet">Meet Our Team</h1>
          <div className="team_cards">
            <div className="team-member">
              <img src={doctor1} alt="doctor1" className="team_image" />
              <h1 className="doctor_name">Dr Prachi Singh</h1>
              <h1 className="degree">MBBS/MD MEDICINE</h1>
            </div>
            <div className="team-member">
              <img src={doctor2} alt="doctor2" className="team_image" />
              <h1 className="doctor_name">Dr Adward Prist</h1>
              <h1 className="degree">Orthopedist</h1>
            </div>
            <div className="team-member">
              <img src={doctor3} alt="doctor3" className="team_image" />
              <h1 className="doctor_name">Dr Ethan</h1>
              <h1 className="degree">Cardiologist</h1>
            </div>
          </div>
        </div>
        <div className="achieve">
          <h1 className="achieve_head">Our Achievements</h1>
          <div className="card_acheive">
            <div className="card_acheivement">
              <img src={people} alt="people" className="ach" />
              <h1 className="achieves">100,000+</h1>
              <h1 className="people">patients served</h1>
            </div>
            <div className="card_acheivement">
              <img src={star} alt="star" className="ach" />
              <h1 className="achieves">4.8/5</h1>
              <h1 className="people">Average rating</h1>
            </div>
            <div className="card_acheivement">
              <img src={like} alt="like" className="ach" />
              <h1 className="achieves">95%</h1>
              <h1 className="people">Positive feedback</h1>
            </div>
          </div>
        </div>
      </div>
      <Footerforuser />

    </>
  );
}
