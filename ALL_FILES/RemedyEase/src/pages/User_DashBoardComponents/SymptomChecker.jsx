import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../Css_for_all/SymptomChecker.css";

export default function SymptomChecker() {
  const [symptoms, setSymptoms] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const navigate = useNavigate();

  const loadingSteps = [
    "Analyzing your symptoms...",
    "Evaluating severity...",
    "Checking medical database...",
    "Preparing recommendations..."
  ];

  const handleAnalyze = async () => {
    if (!symptoms.trim()) {
      alert("Please describe your symptoms");
      return;
    }

    setLoading(true);
    setAnalysis(null);
    setLoadingStep(0);

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
      const res = await fetch("/api/v1/ai/symptom-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms }),
      });

      const data = await res.json();
      clearInterval(stepInterval);

      setTimeout(() => {
        if (res.ok) {
          setAnalysis(data);
        } else {
          setAnalysis({
            error: true,
            message: data.message || "Failed to analyze symptoms"
          });
        }
        setLoading(false);
      }, 500);
    } catch (err) {
      clearInterval(stepInterval);
      setAnalysis({
        error: true,
        message: "Cannot connect to server. Please try again."
      });
      setLoading(false);
    }
  };

  const handleBookAppointment = () => {
    navigate("/user/dashboard/Appointments");
  };

  const handleViewDoctors = () => {
    navigate("/user/dashboard/Meetdoctor");
  };

  const saveAnalysis = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const savedAnalyses = JSON.parse(localStorage.getItem("savedSymptomAnalyses")) || [];
    
    const newAnalysis = {
      id: Date.now(),
      symptoms,
      analysis,
      timestamp: new Date().toISOString(),
      userId: user?.email
    };
    
    savedAnalyses.push(newAnalysis);
    localStorage.setItem("savedSymptomAnalyses", JSON.stringify(savedAnalyses));
    alert("Analysis saved to your profile!");
  };

  return (
    <div className="symptom-checker-container">
      <div className="symptom-checker-header">
        <h2 className="checker-subtitle">🤖 AI-Powered Health Assistant</h2>
        <h1 className="checker-title">Smart Symptom Checker</h1>
        <p className="checker-description">
          Describe your symptoms and get instant AI analysis. We'll determine if you need 
          to see a doctor or if home remedies can help you feel better.
        </p>
      </div>

      <div className="symptom-input-section">
        <textarea
          className="symptom-textarea"
          placeholder="Describe your symptoms in detail... 
          
For example: 'I have a fever of 101°F, sore throat, body aches, and feeling very weak since yesterday'"
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          disabled={loading}
          rows={6}
        />
        <button
          className="analyze-btn"
          onClick={handleAnalyze}
          disabled={loading || !symptoms.trim()}
        >
          {loading ? "Analyzing..." : "🔍 Analyze Symptoms"}
        </button>
      </div>

      <div className="analysis-output-container">
        {loading ? (
          <div className="loading-animation">
            <div className="medical-spinner">
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
            </div>
            <p className="loading-text">Analyzing your health...</p>
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
        ) : analysis ? (
          analysis.error ? (
            <div className="error-message">
              <span className="error-icon">❌</span>
              <p>{analysis.message}</p>
            </div>
          ) : (
            <div className="analysis-result">
              <div className={`severity-badge ${analysis.severity}`}>
                <span className="severity-icon">
                  {analysis.severity === 'severe' ? '⚠️' : 
                   analysis.severity === 'moderate' ? '⚡' : '✅'}
                </span>
                <span className="severity-text">
                  {analysis.severity === 'severe' ? 'URGENT - See a Doctor' :
                   analysis.severity === 'moderate' ? 'Moderate - Medical Attention Recommended' :
                   'MILD - Home Remedies Recommended'}
                </span>
              </div>

              <div className="analysis-content">
                <div className="analysis-section">
                  <h3 className="section-title">
                    <span className="section-icon">📋</span>
                    Analysis Summary
                  </h3>
                  <p className="analysis-text">{analysis.summary}</p>
                </div>

                {(analysis.severity === 'severe' || analysis.severity === 'moderate') && (
                  <div className="doctor-recommendation">
                    <div className="recommendation-header">
                      <span className="doctor-icon">👨‍⚕️</span>
                      <h3>Recommended Medical Specialist</h3>
                    </div>
                    <div className="specialist-info">
                      <p className="specialist-type">{analysis.doctorType}</p>
                      <p className="specialist-reason">{analysis.reason}</p>
                    </div>
                    <div className="action-buttons-group">
                      <button className="book-now-btn" onClick={handleBookAppointment}>
                        📅 Book Appointment Now
                      </button>
                      <button className="view-doctors-btn" onClick={handleViewDoctors}>
                        👥 View Available Doctors
                      </button>
                    </div>
                  </div>
                )}

                {analysis.severity === 'mild' && analysis.homeRemedies && (
                  <div className="home-remedies-section">
                    <div className="remedies-header">
                      <span className="remedy-icon">🏠</span>
                      <h3>Recommended Home Remedies</h3>
                    </div>
                    <div className="remedies-list">
                      {analysis.homeRemedies.split('\n').map((remedy, index) => (
                        remedy.trim() && (
                          <div key={index} className="remedy-item">
                            <span className="remedy-bullet">✓</span>
                            <p>{remedy.trim()}</p>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}

                <div className="analysis-section warning-section">
                  <h3 className="section-title">
                    <span className="section-icon">⚠️</span>
                    Important Notice
                  </h3>
                  <p className="warning-text">
                    This AI analysis is for informational purposes only and should not replace 
                    professional medical advice. If symptoms worsen or persist, please seek 
                    immediate medical attention.
                  </p>
                </div>

                <div className="action-buttons">
                  <button className="save-analysis-btn" onClick={saveAnalysis}>
                    💾 Save Analysis
                  </button>
                  <button className="new-analysis-btn" onClick={() => {
                    setSymptoms("");
                    setAnalysis(null);
                  }}>
                    🔄 New Analysis
                  </button>
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🩺</div>
            <h3>Ready to Help</h3>
            <p>Describe your symptoms above to get started with AI-powered health analysis</p>
          </div>
        )}
      </div>

      <div className="info-cards">
        <div className="info-card">
          <div className="card-icon">🎯</div>
          <h4>Accurate Analysis</h4>
          <p>AI-powered symptom evaluation with medical database</p>
        </div>
        <div className="info-card">
          <div className="card-icon">⚡</div>
          <h4>Instant Results</h4>
          <p>Get immediate recommendations for your health concerns</p>
        </div>
        <div className="info-card">
          <div className="card-icon">🔒</div>
          <h4>Private & Secure</h4>
          <p>Your health information is kept confidential</p>
        </div>
      </div>
    </div>
  );
}
