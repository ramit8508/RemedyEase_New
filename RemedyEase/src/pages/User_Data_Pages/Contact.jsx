import React from "react";
import "../../Css_for_all/Contact.css";
import Getintouch from "../../components/Getintouch";
import { FaLinkedin, FaGithub } from "react-icons/fa";
import Footerforuser from "../../components/Footerforuser";

export default function Contact() {
  return (
    <>
      <div className="contact_heading">
        <h1 className="contact_head">Contact Us</h1>
        <p className="contact_para">
          We are here to help! Reach out to us for any inquiries or doubt.
        </p>
      </div>
      <div className="contact_info">
        <div className="intouch">
          <h1 className="intouch_head">Get in Touch</h1>
          <Getintouch />
        </div>
        <div className="contact">
          <h1 className="contact_heading1">Contact Information</h1>
          <h1 className="cont">📧 Email</h1>
          <h1 className="contac">ramigoyal1987@gmail.com</h1>
          <h1 className="cont">📞Phone no.</h1>
          <h1 className="contac">+91 8307730036</h1>
          <h1 className="cont">📍Location</h1>
          <h1 className="contac">Zirakpur, Punjab, India</h1>
          <div className="follow">
            <h1 className="follow_head">Follow Us</h1>
            <h1 className="follow_para">
              Stay connected with us through social media for the latest updates
            </h1>
            <div className="social_media">
              <a
                href="https://www.linkedin.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-link"
              >
                <FaLinkedin />
              </a>
              <a
                href="https://github.com/ramit8508"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-link"
              >
                <FaGithub />
              </a>
              <div />
            </div>
          </div>
        </div>
      </div>
      <Footerforuser />
    </>
  );
}
