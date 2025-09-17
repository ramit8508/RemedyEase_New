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
    const res = await fetch("http://localhost:5001/api/v1/ais/doctorsuggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symptoms, history }),
    });
    const data = await res.json();
    setSuggestion(data.suggestion || data.recommendation || data.error || "No remedy found.");
  } catch (err) {
    setSuggestion("Something went wrong. Please try again.");
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
        <h3 className="output_heading">AI Clinical Suggestions:</h3>
        <div
          className="output_box"
          style={{
            background: "linear-gradient(135deg, #e8f5e9 0%, #fff 100%)", // soft green gradient
            border: "1px solid #43a047", // green border
            borderRadius: "18px",
            padding: "26px 32px",
            boxShadow: "0 8px 32px rgba(67, 160, 71, 0.18), 0 1.5px 8px rgba(67, 160, 71, 0.12)", // green shadow
            color: "#1b5e20", // deep green text
            fontSize: "22px",
            fontWeight: 700,
            margin: "16px 0",
            textAlign: "left",
            whiteSpace: "pre-line",
            letterSpacing: "0.7px",
            lineHeight: "1.7",
            textShadow: "0 2px 8px rgba(67, 160, 71, 0.18)", // subtle green text glow
            transition: "box-shadow 0.3s",
          }}
        >
          {suggestion}
        </div>
      </div>
    </div>
  );
}
