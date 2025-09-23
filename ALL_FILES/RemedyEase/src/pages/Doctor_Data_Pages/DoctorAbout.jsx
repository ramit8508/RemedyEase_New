import React from "react";
import "../../Css_for_all/About.css";
import doctor1 from "../../images/doctor1.jpg";
import doctor2 from "../../images/doctor2.jpg";
import doctor3 from "../../images/doctor3.jpg";
import star from "../../images/star.png";
import people from "../../images/people.webp";
import like from "../../images/like.webp";
import Footerdoctor from "../../components/Footerdoctor";

export default function DoctorAbout() {
  return (
    <>
      <div className="about">
        <h1 className="about-title">About RemedyEase</h1>
        <p className="para">
          At RemedyEase, we are building the future of medical practice. Our
          journey was inspired by a single goal: to eliminate the traditional
          barriers that limit a physician's reach and efficiency. We believe in
          providing doctors with superior technology so they can deliver their
          expert care to more patients, more effectively, creating a more
          sustainable way to practice medicine.
        </p>
        <div className="three_cards">
          <div className="card">
            <h1 className="heading1">Our Mission</h1>
            <p className="paragraph">
              Our mission is to empower healthcare professionals to deliver
              exceptional care by providing a secure, intuitive, and flexible
              digital platform. We are committed to leveraging technology that
              streamlines clinical workflows, enhances the doctor-patient
              relationship, and allows physicians to build a thriving, modern
              practice.
            </p>
          </div>
          <div className="card">
            <h1 className="heading1">Our Vision</h1>
            <p className="paragraph">
              We envision a future where physicians are empowered with advanced
              technology to deliver proactive, personalized care. RemedyEase
              aims to be at the forefront of this transformation, providing a
              platform that seamlessly integrates into a doctor's professional
              workflow, enhances clinical capabilities, and sets the new
              standard for excellence in professional telehealth.
            </p>
          </div>
          <div className="card">
            <h1 className="heading1">Our Values</h1>
            <p className="paragraph">
              Physician-Centricity: Empowering doctors with tools designed to
              support their workflow and simplify patient care.
              <br />
              Integrity: Upholding the highest ethical standards to ensure trust
              and confidentiality for physicians and patients.
              <br />
              Innovation: Advancing healthcare by providing physicians with
              reliable and cutting-edge technology.
              <br />
              Partnership: Building a true partnership with our physician
              community based on respect and shared success.
              <br />
              Excellence & Access: Striving for excellence in our platform and
              support to help physicians expand access to their care.
              <br />
            </p>
          </div>
        </div>
        <h1 className="user_head">What our doctor's says</h1>
        <div className="user_feedback_container">
          <div className="feedback">
            <p className="feedback">
              "Adopting RemedyEase has transformed my practice. The platform's
              intuitive interface allows me to manage consultations and patient
              records with incredible efficiency. It handles the administrative
              tasks, so I can focus purely on providing quality care."
            </p>
            <h1 className="users">
              — Dr. Evelyn Reed, Dermatologist <br />
              verified doctor
            </h1>
          </div>
          <div className="feedback">
            <p className="feedback">
              "The secure messaging feature on RemedyEase has been a
              game-changer for patient follow-ups. It allows me to answer
              non-urgent questions and manage ongoing care efficiently without
              endless phone calls. It strengthens the doctor-patient
              relationship while respecting my schedule."
            </p>
            <h1 className="users">
              — Dr. Samuel Jones, General Practitioner
              <br />
              verified doctor
            </h1>
          </div>
          <div className="feedback">
            <p className="feedback">
              "As a physician with a demanding schedule, RemedyEase provides the
              flexibility I need to manage my practice on my own terms. I can
              set my virtual hours and consult with patients from anywhere,
              allowing me to achieve a better work-life balance without
              compromising on the quality of care."
            </p>
            <h1 className="users">
              — Dr. David Chen, Family Medicine
              <br />
              verified doctor
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
      <Footerdoctor />
    </>
  );
}
