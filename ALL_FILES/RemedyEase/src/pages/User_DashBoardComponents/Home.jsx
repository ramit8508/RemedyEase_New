import React from "react";
import { Link } from "react-router-dom";
import "../../Css_for_all/UserDashHome.css";
import service1 from "../../images/SEARCH.png";
import service2 from "../../images/BOOK.webp";
import service3 from "../../images/CHAT.png";
import service4 from "../../images/AIROBOT.png";
import doctor1 from "../../images/doctor1.jpg";
import doctor2 from "../../images/doctor2.jpg";
import doctor3 from "../../images/doctor3.jpg";

function Home() {
  return (
    <>
      <div className="main_head">
        <h1 className="head_title">
          Find the right care, right now with RemedyEase
        </h1>
        <p className="head_para">
          Connect with experienced healthcare professionals from the comfort of
          your home. Get personalized advice and treatment plans tailored to
          your needs.
        </p>
        <Link to="/user/dashboard/Meetdoctor">
          <button className="head_btn">Find a doctor</button>
        </Link>
      </div>
      <div className="services">
        <h2 className="service_title">Explore Our Services</h2>
        <div className="service_cards">
          <div className="service_card">
            <img src={service1} alt="Find a doctor" className="service_image1" />
            <h3 className="service_name">Find a doctor</h3>
            <p className="service_desc">
              Browse profiles, read reviews, and book appointments with ease.
            </p>
          </div>
          <div className="service_card">
            <img src={service2} alt="Book Appointment" className="service_image2" />
            <h3 className="service_name">Book Appointment</h3>
            <p className="service_desc">
              Schedule appointments at your convenience, anytime, anywhere.
            </p>
          </div>
          <div className="service_card">
            <img src={service3} alt="Chat with Doctor" className="service_image3" />
            <h3 className="service_name">Chat with Doctor</h3>
            <p className="service_desc">
              Get instant answers to your health questions via secure chat.
            </p>
          </div>
          <div className="service_card">
            <img src={service4} alt="AI Recommendations" className="service_image4" />
            <h3 className="service_name">AI Recommendations</h3>
            <p className="service_desc">
              Receive personalized health tips and recommendations powered by
              AI.
            </p>
          </div>
        </div>
      </div>
      <div className="feature_doctor">
        <h2 className="feature_title">Featured Doctors</h2>
        <div className="doctor_cards">
          <div className="doctor_card">
            <img src={doctor1} alt="Doctor Prachi Singh" className="doctor_image1" />
            <h3 className="doctor_name">Dr Prachi Singh</h3>
            <p className="doctor_specialty">MBBS/MD MEDICINE</p>
          </div>
          <div className="doctor_card">
            <img src={doctor2} alt="Doctor Adward Prist" className="doctor_image2" />
            <h3 className="doctor_name">Dr Adward Prist</h3>
            <p className="doctor_specialty">Orthopedist</p>
          </div>
          <div className="doctor_card">
            <img src={doctor3} alt="Doctor Ethan" className="doctor_image3" />
            <h3 className="doctor_name">Dr Ethan</h3>
            <p className="doctor_specialty">Cardiologist</p>
          </div>
        </div>
      </div>
      <div className="ready">
        <h2 className="ready_title">Ready to take control on your Health?</h2>
        <Link to="/user/dashboard/Meetdoctor">
          <button className="ready_btn">Find a doctor</button>
        </Link>
      </div>
    </>
  );
}

export default Home;