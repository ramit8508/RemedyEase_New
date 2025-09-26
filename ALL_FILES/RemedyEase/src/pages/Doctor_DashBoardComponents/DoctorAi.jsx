import React, { useState } from "react";
import "../../Css_for_all/AIRecommanded.css";

export default function DoctorAi() {
  const [symptoms, setSymptoms] = useState("");
  const [history, setHistory] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGetSuggestion = async () => {
    if (!symptoms.trim() || !history.trim()) return;
    setLoading(true);
    setSuggestion("");
    try {
      // Correct, simplified API call
      const res = await fetch(
        "/api/v1/ai/doctorsuggestions",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symptoms, history }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        setSuggestion(
          data.suggestion ||
          data.recommendation ||
          "No suggestion found."
        );
      } else {
        setSuggestion(data.error || "Failed to get suggestion.");
      }
    } catch (err) {
      setSuggestion("Connection failed. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="container">
      <h2 className="heading_ai">⚙️AI Clinical Assistant⚡</h2>
      <h1 className="heading">Get Data-Driven Treatment Suggestions</h1>
      <p className="description">
        Enter patient symptoms and history. The AI will provide diagnostic
        support, rationale, and actionable recommendations for clinical
        decision-making.
      </p>
      <div className="input_container">
        <input
          type="text"
          className="input_box"
          placeholder="Patient symptoms (e.g., chest pain, fever)"
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          disabled={loading}
        />
        <input
          type="text"
          className="input_box"
          placeholder="Patient history (e.g., diabetic, smoker, recent travel)"
          value={history}
          onChange={(e) => setHistory(e.target.value)}
          disabled={loading}
          style={{ marginTop: "12px" }}
        />
        <button
          className="submit_button"
          onClick={handleGetSuggestion}
          disabled={loading}
          style={{ marginTop: "12px" }}
        >
          {loading ? "Loading..." : "✨Get AI Suggestions"}
        </button>
      </div>
      <div className="output_container">
        <h3 className="output_heading">
          <span className="ai-icon">🧠</span>
          AI Clinical Suggestions:
          <span className="professional-badge">Professional Analysis</span>
        </h3>
        <div className={`ai-output-wrapper ${suggestion ? 'has-content' : ''}`}>
          <div className="ai-output-header">
            <div className="analysis-indicator">
              <div className="pulse-dot"></div>
              <span>Clinical Analysis Complete</span>
            </div>
            <div className="confidence-badge">
              <span>AI Confidence: High</span>
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
                <p className="loading-text">Analyzing patient data...</p>
                <div className="loading-steps">
                  <div className="step active">Processing symptoms</div>
                  <div className="step">Reviewing medical history</div>
                  <div className="step">Generating recommendations</div>
                </div>
              </div>
            ) : suggestion ? (
              <div className="suggestion-content">
                <div className="suggestion-header">
                  <div className="medical-cross">⚕️</div>
                  <h4>Clinical Recommendations</h4>
                </div>
                <div className="suggestion-text">
                  {suggestion}
                </div>
                <div className="suggestion-footer">
                  <div className="disclaimer">
                    <div className="warning-icon">⚠️</div>
                    <span>AI-generated suggestions for clinical decision support. Always use professional medical judgment.</span>
                  </div>
                  <div className="action-buttons">
                    <button className="save-btn">💾 Save to Patient Record</button>
                    <button className="export-btn">📄 Export Report</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🔬</div>
                <h4>Ready for Analysis</h4>
                <p>Enter patient symptoms and history above to receive AI-powered clinical suggestions</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}