import React from "react";
import "../../Css_for_all/AIRecommanded.css";
import box1image from "../../images/box1image.jpg";
import box2image from "../../images/sample2.jpg";
import box3image from "../../images/sample3.jpg";
import box4image from "../../images/sample4.jpg";


export default function AIRecommanded() {
  return (
    <>
      <div className="container">
        <h2 className="heading_ai">⚙️Powered by AI⚡</h2>
        <h1 className="heading">Get Instant Home Remedy Advice</h1>
        <p className="description">
          Simply describe your symptoms, and our Ai will provide you with safe
          and effective home remedies to help you feel better
        </p>
        <div className="input_container">
          <input
            type="text"
            className="input_box"
            placeholder="eg., I have  a sore throat and a mild fever"
          />
          <button className="submit_button">✨Get Recommendations</button>
        </div>
        <div className="output_container">
          <h3 className="output_heading">
            Your AI Recommendations Remedies are:
          </h3>
          <div className="output_box">
            {/* AI-generated recommendations will be displayed here */}
          </div>
        </div>
        <div className="sample_container">
          <h3 className="sample_heading">Common Remedy by Ai are:</h3>
          <div className="samplebox1_2">
            <div className="sample_box1 sample_box">
              <img
                src={box1image}
                alt="Sample Remedy"
                className="sample_image"
              />
              <div className="title">
                <h1 className="head_sample">Ginger Tea for Nausea</h1>
                <p className="para_sample">
                  Ginger Tea can help alleviate nausea and soothe the stomach.
                  Drink a cup of warm ginger tea slowly
                </p>
              </div>
            </div>
            <div className="sample_box2 sample_box">
              <img
                src={box2image}
                alt="Sample Remedy"
                className="sample_image"
              />
              <div className="title">
                <h1 className="head_sample">Honey and Lemon for Sore Throat</h1>
                <p className="para_sample">
                  A mixture of honey and lemon in warm water can soothe a sore
                  throat.Take spoonful as needed.
                </p>
              </div>
            </div>
          </div>
          <div className="samplebox3_4">
            <div className="sample_box3 sample_box">
              <img
                src={box3image}
                alt="Sample Remedy"
                className="sample_image"
              />
              <div className="title">
                <h1 className="head_sample">Salt Water Gargle</h1>
                <p className="para_sample">
                  Gargling with warm salt water can help reduce
                  inflammation.Gargle for 30 seconds for several times a day
                </p>
              </div>
            </div>
            <div className="sample_box4 sample_box">
              <img
                src={box4image}
                alt="Sample Remedy"
                className="sample_image"
              />
              <div className="title">
                <h1 className="head_sample">Rest and Hydration</h1>
                <p className="para_sample">
                  Ensure you get plenty of rest and stay hydrated by drinking
                  plenty of fluids.This helps your body recover faster.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
