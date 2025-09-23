import React from "react";
import "../../Css_for_all/Services.css";
import online_consult from "../../images/online_consultants.png";
import online_chat from "../../images/live_chat.png";
import ai_remedy from "../../images/ai_remedy.jpg";
import Footerdoctor from "../../components/Footerdoctor";

export default function DoctorServices() {
  return (
    <>
      <div className="container">
        <h1 className="heading">Our Services</h1>
        <p className="para">
          Discover our suite of powerful tools designed to streamline your
          practice, from a seamless virtual consultation platform to AI-assisted
          diagnostic support
        </p>
      </div>
      <div className="three_cards">
        <div className="cards">
          <img
            src={online_consult}
            alt="Online Consultations"
            className="image_online_consult"
          />
          <h1 className="card-title">Secure Virtual Consultations</h1>
          <p className="text_online_consult">
            Conduct HIPAA-compliant video consultations on our reliable,
            high-definition platform. Deliver your expert medical advice through
            a secure and professional interface designed for a seamless clinical
            experience.
          </p>
        </div>
        <div className="cards">
          <img
            src={online_chat}
            alt="Online Consultations"
            className="image_online_consult"
          />
          <h1 className="card-title">Secure Patient Messaging</h1>
          <p className="text_online_consult">
            Streamline your patient communication. Use our secure, real-time
            messaging to efficiently manage follow-up questions, provide quick
            updates, and offer ongoing support without interrupting your
            workflow.
          </p>
        </div>
        <div className="cards">
          <img
            src={ai_remedy}
            alt="Online Consultations"
            className="image_online_consult"
          />
          <h1 className="card-title">AI-Powered Clinical Insights</h1>
          <p className="text_online_consult">
            Leverage our advanced AI to complement your expertise. Our system
            analyzes patient data to provide evidence-based treatment options
            and lifestyle recommendations, helping you build comprehensive and
            personalized care plans faster.
          </p>
        </div>
      </div>
      <Footerdoctor />
    </>
  );
}
