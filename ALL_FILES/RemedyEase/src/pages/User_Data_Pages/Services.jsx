import React from "react";
import "../../Css_for_all/Services.css";
import online_consult from "../../images/online_consultants.png";
import online_chat from "../../images/live_chat.png";
import ai_remedy from "../../images/ai_remedy.jpg";
import Footerforuser from "../../components/Footerforuser";

export default function Services() {
  return (
    <>
      <div className="container">
        <h1 className="heading">Our Services</h1>
        <p className="para">
          Explore the range of healthcare we offer to support well-being, from
          online consultations to AI -powered recommendations.
        </p>
      </div>
      <div className="three_cards">
        <div className="cards">
          <img
            src={online_consult}
            alt="Online Consultations"
            className="image_online_consult"
          />
          <h1 className="card-title">Online Consultations</h1>
          <p className="text_online_consult">
            Connect with experienced healthcare professionals from the comfort
            of your home.Schedule a video consultation and recieve personalized
            medical advice.
          </p>
        </div>
        <div className="cards">
          <img
            src={online_chat}
            alt="Online Consultations"
            className="image_online_consult"
          />
          <h1 className="card-title">Live chat with doctors</h1>
          <p className="text_online_consult">
            Get immediate answers to your health questions through our live chat
            feature.Connect with doctor in real time for quick advice and
            support.
          </p>
        </div>
        <div className="cards">
          <img
            src={ai_remedy}
            alt="Online Consultations"
            className="image_online_consult"
          />
          <h1 className="card-title">AI-Powered Home Remedies</h1>
          <p className="text_online_consult">
            Receive personalized home remedy suggestions based on your
            symptoms and health history.Our AI algorithms analyze your input to
            provide effective and safe recommendations.
          </p>
        </div>
        <div className="cards">
          <div className="service-icon" style={{fontSize: '80px', marginBottom: '20px'}}>🏥</div>
          <h1 className="card-title">Medical Store</h1>
          <p className="text_online_consult">
            Order medicines directly from your prescriptions with multiple brand options.
            Choose supply duration (15-60 days) and get medicines delivered to your doorstep
            at competitive prices.
          </p>
        </div>
      </div>
      <Footerforuser />
    </>
  );
}
