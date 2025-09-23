import React, { useState } from "react";
import "../../Css_for_all/AIRecommanded.css";
import box1image from "../../images/box1image.jpg";
import box2image from "../../images/sample2.jpg";
import box3image from "../../images/sample3.jpg";
import box4image from "../../images/sample4.jpg";

export default function AIRecommanded() {
  const [symptoms, setSymptoms] = useState("");
  const [remedy, setRemedy] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  const loadingSteps = [
    "Analyzing your symptoms...",
    "Searching remedy database...",
    "Personalizing recommendations...",
    "Finalizing safe remedies..."
  ];

  const handleGetRecommendation = async () => {
    if (!symptoms.trim()) return;
    setLoading(true);
    setRemedy("");
    setLoadingStep(0);

    // Simulate progressive loading steps
    const stepInterval = setInterval(() => {
      setLoadingStep(prev => {
        if (prev < loadingSteps.length - 1) {
          return prev + 1;
        }
        clearInterval(stepInterval);
        return prev;
      });
    }, 800);

    try {
      const res = await fetch("/api/v1/ai/recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms }),
      });
      const data = await res.json();
      
      // Clear loading steps
      clearInterval(stepInterval);
      
      // Wait for the last step to complete
      setTimeout(() => {
        setRemedy(data.recommendation || "No remedy found.");
        setLoading(false);
      }, 500);
    } catch (err) {
      clearInterval(stepInterval);
      setRemedy("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const saveRecommendation = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const savedRecommendations = JSON.parse(localStorage.getItem("savedRecommendations")) || [];
    
    const newRecommendation = {
      id: Date.now(),
      symptoms,
      remedy,
      timestamp: new Date().toISOString(),
      userId: user?.email
    };
    
    savedRecommendations.push(newRecommendation);
    localStorage.setItem("savedRecommendations", JSON.stringify(savedRecommendations));
    alert("Recommendation saved to your profile!");
  };

  const exportRecommendation = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const content = `
RemedyEase AI Recommendation
Generated on: ${new Date().toLocaleDateString()}
User: ${user?.fullname || 'Anonymous'}

Symptoms: ${symptoms}

Recommended Remedies:
${remedy}

Disclaimer: These are AI-generated suggestions for home remedies only. Please consult with a healthcare professional for serious symptoms or if your condition worsens.
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `remedy-recommendation-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
            placeholder="eg., I have a sore throat and a mild fever"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            disabled={loading}
          />
          <button
            className="submit_button"
            onClick={handleGetRecommendation}
            disabled={loading}
          >
            {loading ? "Loading..." : "✨Get Recommendations"}
          </button>
        </div>
        <div className="output_container">
          <div className="output_heading">
            <span className="ai-icon">🏠</span>
            Your Personalized Home Remedies
            <span className="user-badge">For You</span>
          </div>
          
          {/* Enhanced AI Output Wrapper */}
          <div className={`ai-output-wrapper ${remedy ? 'has-content' : ''}`}>
            <div className="ai-output-header">
              <div className="analysis-indicator">
                <div className="pulse-dot"></div>
                <span>AI Health Assistant</span>
              </div>
              <div className="confidence-badge">
                Home Remedies
              </div>
            </div>
            
            <div className="ai-output-box">
              {loading ? (
                <div className="loading-animation">
                  <div className="medical-spinner">
                    <div className="spinner-ring"></div>
                    <div className="spinner-ring"></div>
                    <div className="spinner-ring"></div>
                  </div>
                  <div className="loading-text">Generating Your Personalized Remedies</div>
                  <div className="loading-steps">
                    {loadingSteps.map((step, index) => (
                      <div 
                        key={index} 
                        className={`step ${index <= loadingStep ? 'active' : ''}`}
                      >
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              ) : remedy ? (
                <div className="suggestion-content">
                  <div className="suggestion-header">
                    <div className="medical-cross">🌿</div>
                    <h4>Recommended Home Remedies</h4>
                  </div>
                  
                  <div className="suggestion-text">
                    {remedy}
                  </div>
                  
                  <div className="suggestion-footer">
                    <div className="disclaimer">
                      <span className="warning-icon">⚠️</span>
                      <span>
                        These are AI-generated home remedy suggestions. For serious symptoms or if your condition worsens, please consult a healthcare professional immediately.
                      </span>
                    </div>
                    
                    <div className="action-buttons">
                      <button className="save-btn" onClick={saveRecommendation}>
                        💾 Save Remedies
                      </button>
                      <button className="export-btn" onClick={exportRecommendation}>
                        📤 Export Report
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">🌱</div>
                  <h4>Ready to Help You Feel Better</h4>
                  <p>Describe your symptoms above and get personalized home remedy recommendations powered by AI.</p>
                </div>
              )}
            </div>
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
