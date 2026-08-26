import React, { useState } from "react";
import {
  FiCpu,
  FiZap,
  FiActivity,
  FiFileText,
  FiAlertCircle,
  FiCheckCircle,
  FiRefreshCw,
  FiShield,
  FiInfo,
} from "react-icons/fi";
import "../../Css_for_all/DoctorAi.css";
import "../../Css_for_all/DoctorDashboard.css";

export default function DoctorAi() {
  const [symptoms, setSymptoms] = useState("");
  const [history, setHistory] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGetSuggestion = async () => {
    if (!symptoms.trim() || !history.trim()) {
      alert("Please enter both patient symptoms and medical history.");
      return;
    }

    setLoading(true);
    setSuggestion("");
    setError("");

    try {
      const res = await fetch("/api/v1/doctor-ai/doctorsuggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms: symptoms.trim(), history: history.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuggestion(
          data.suggestion ||
            data.recommendation ||
            "No diagnostic recommendations generated."
        );
      } else {
        setError(data.error || "Failed to generate clinical analysis from the AI service.");
      }
    } catch (err) {
      console.error("Doctor AI error:", err);
      setError("Connection to AI service failed. Please check your network and retry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dai-container">
      {/* ─── 1. Hero Section ─── */}
      <div className="dai-hero-card">
        <div className="dai-hero-content">
          <div className="dai-hero-tag">
            <FiZap size={13} color="#16a34a" /> AI Clinical Assistant ⚡
          </div>
          <h1 className="dai-hero-title">Get Data-Driven Treatment Suggestions</h1>
          <p className="dai-hero-subtitle">
            Enter patient symptoms and medical history to receive AI-powered clinical decision support, differential diagnoses, and actionable recommendations.
          </p>
        </div>
      </div>

      {/* ─── 2. Error State ─── */}
      {error && (
        <div className="dai-error-box">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <FiAlertCircle size={20} />
            <div>
              <strong style={{ display: "block", fontSize: "14px" }}>
                Unable to generate analysis
              </strong>
              <span style={{ fontSize: "13px" }}>{error}</span>
            </div>
          </div>
          <button
            type="button"
            className="dd-btn-action dd-btn-action--reject"
            onClick={handleGetSuggestion}
            disabled={loading}
          >
            <FiRefreshCw size={13} /> Retry Analysis
          </button>
        </div>
      )}

      {/* ─── 3. Patient Information Input Section ─── */}
      <div className="dai-card">
        <div className="dai-card-header">
          <h2 className="dai-card-title">
            <FiFileText size={17} color="#16a34a" /> Patient Information
          </h2>
        </div>

        <div className="dai-input-grid">
          {/* A. Symptoms Input */}
          <div className="dai-form-group">
            <label className="dai-form-label">
              <FiActivity size={14} color="#16a34a" /> Patient Symptoms
            </label>
            <textarea
              className="dai-textarea"
              placeholder="Describe the patient's symptoms, severity, duration, and relevant observations (e.g., acute retrosternal chest pain radiating to left jaw, onset 2 hours ago, diaphoresis, dyspnea)..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* B. Medical History Input */}
          <div className="dai-form-group">
            <label className="dai-form-label">
              <FiFileText size={14} color="#2563eb" /> Patient Medical History
            </label>
            <textarea
              className="dai-textarea"
              placeholder="Enter relevant medical history, existing conditions, medications, allergies, previous diagnoses, etc. (e.g., Type 2 Diabetes on Metformin 500mg, Hypertension, smoker 10 pack-years, penicillin allergy)..."
              value={history}
              onChange={(e) => setHistory(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <div className="dai-action-row">
          <div className="dai-security-note">
            <FiShield size={14} color="#16a34a" />
            <span>
              Patient information is processed securely and should be reviewed by a qualified clinician.
            </span>
          </div>

          <button
            type="button"
            className="dai-generate-btn"
            onClick={handleGetSuggestion}
            disabled={loading || !symptoms.trim() || !history.trim()}
          >
            {loading ? (
              <>
                <FiRefreshCw size={14} className="hr-spin" /> Analyzing Clinical Data...
              </>
            ) : (
              <>
                <FiZap size={15} /> Generate AI Analysis
              </>
            )}
          </button>
        </div>
      </div>

      {/* ─── 4. AI Clinical Analysis Result Section ─── */}
      <div className="dai-result-card">
        <div className="dai-result-header">
          <h2 className="dai-card-title">
            <FiCpu size={18} color="#16a34a" /> AI Clinical Analysis
          </h2>

          <div className="dai-badges-group">
            {suggestion && (
              <>
                <span className="dai-badge-ready">
                  <FiCheckCircle size={12} /> Analysis Ready
                </span>
                <span className="dai-badge-confidence">AI Confidence: High</span>
              </>
            )}
          </div>
        </div>

        {/* Dynamic States */}
        {loading ? (
          <div className="dai-loading-state">
            <div className="hr-spinner" style={{ width: "36px", height: "36px" }} />
            <h3 className="dai-loading-title">Analyzing patient information...</h3>
            <p className="dai-loading-subtitle">
              Generating clinical decision-support insights and differential diagnostic pathways...
            </p>
          </div>
        ) : suggestion ? (
          <div>
            <div className="dai-output-content">{suggestion}</div>

            <div className="dai-disclaimer-box">
              <FiInfo size={16} style={{ flexShrink: 0 }} />
              <span>
                <strong>Clinical Decision Support:</strong> AI-generated suggestions are designed for clinical decision support only. Final diagnosis, prescription, and treatment decisions remain with the licensed treating physician.
              </span>
            </div>
          </div>
        ) : (
          <div className="dai-empty-state">
            <div className="dai-empty-icon">🧠</div>
            <h3 className="dai-empty-title">Ready for Analysis</h3>
            <p className="dai-empty-subtitle">
              Enter patient symptoms and medical history above to receive AI-powered clinical decision-support insights and treatment considerations.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
