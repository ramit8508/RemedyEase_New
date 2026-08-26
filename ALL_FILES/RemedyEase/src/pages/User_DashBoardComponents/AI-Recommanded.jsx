import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiMic,
  FiMicOff,
  FiGlobe,
  FiCheck,
  FiAlertCircle,
  FiAlertTriangle,
  FiBookmark,
  FiDownload,
  FiUserCheck,
  FiArrowRight,
  FiX,
  FiShield,
  FiInfo,
  FiActivity,
} from "react-icons/fi";
import "../../Css_for_all/AIRecommanded.css";

/* ─── Supported Languages ─── */
const LANGUAGES = [
  { code: "en-US", name: "English", label: "English" },
  { code: "hi-IN", name: "Hindi", label: "हिन्दी (Hindi)" },
  { code: "pa-IN", name: "Punjabi", label: "ਪੰਜਾਬੀ (Punjabi)" },
  { code: "bn-IN", name: "Bengali", label: "বাংলা (Bengali)" },
  { code: "mr-IN", name: "Marathi", label: "मराठी (Marathi)" },
  { code: "ta-IN", name: "Tamil", label: "தமிழ் (Tamil)" },
  { code: "te-IN", name: "Telugu", label: "తెలుగు (Telugu)" },
  { code: "gu-IN", name: "Gujarati", label: "ગુજરાતી (Gujarati)" },
  { code: "kn-IN", name: "Kannada", label: "ಕನ್ನಡ (Kannada)" },
  { code: "ml-IN", name: "Malayalam", label: "മലയാളം (Malayalam)" },
  { code: "ur-IN", name: "Urdu", label: "اردو (Urdu)" },
];

/* ─── Quick Prompt Chips ─── */
const QUICK_PROMPTS = [
  "Sore throat and dry cough",
  "Mild headache and eye strain",
  "Acid reflux and stomach bloating",
  "Stuffy nose and mild congestion",
  "Difficulty sleeping and restlessness",
];

/* ─── Curated Everyday Self-Care Remedies ─── */
const EVERYDAY_REMEDIES = [
  {
    id: "honey-lemon",
    icon: "🍯",
    title: "Honey & Warm Water",
    subtitle: "Natural throat soothing & hydration",
    helpsWith: "Mild sore throat, dry cough, morning vocal fatigue",
    howToUse: "Mix 1 tablespoon of raw honey and a squeeze of fresh lemon into a mug of warm (not boiling) water. Sip slowly.",
    frequency: "1 to 2 times daily as needed",
    whoShouldAvoid: "Infants under 1 year of age (risk of infant botulism); individuals with severe honey allergies.",
    precautions: "Do not add honey to boiling water as high heat can destroy beneficial enzymes.",
    whenToSeeDoctor: "If throat pain is severe, accompanied by high fever, or makes swallowing difficult.",
  },
  {
    id: "ginger-tea",
    icon: "🫚",
    title: "Fresh Ginger Tea",
    subtitle: "Digestive comfort & nausea relief",
    helpsWith: "Mild nausea, indigestion, motion sickness, chills",
    howToUse: "Thinly slice 1 inch of fresh ginger root. Simmer in 2 cups of water for 8-10 minutes. Strain and enjoy warm.",
    frequency: "1 to 3 cups per day after meals",
    whoShouldAvoid: "Individuals with active gallstones or taking prescription blood thinners without consulting a doctor.",
    precautions: "Excessive ginger consumption can cause mild heartburn in sensitive stomachs.",
    whenToSeeDoctor: "Persistent vomiting, severe abdominal pain, or unexplained weight loss.",
  },
  {
    id: "salt-gargle",
    icon: "🧂",
    title: "Warm Salt Water Gargle",
    subtitle: "Osmotic pharyngeal swelling reduction",
    helpsWith: "Throat irritation, post-nasal drip, mild oral discomfort",
    howToUse: "Dissolve 1/2 teaspoon of table salt in 1 cup of warm water. Gargle for 30 seconds, then spit out.",
    frequency: "2 to 3 times daily",
    whoShouldAvoid: "Young children who cannot reliably spit out gargle solution.",
    precautions: "Do not swallow the salt water.",
    whenToSeeDoctor: "White patches on tonsils, stiff neck, or difficulty opening mouth.",
  },
  {
    id: "turmeric-milk",
    icon: "🥛",
    title: "Turmeric Golden Milk",
    subtitle: "Anti-inflammatory evening recovery",
    helpsWith: "General body fatigue, mild muscle stiffness, restful sleep",
    howToUse: "Warm 1 cup of milk (or plant-based milk) with 1/2 tsp turmeric powder and a pinch of black pepper (enhances curcumin absorption).",
    frequency: "Once daily before bedtime",
    whoShouldAvoid: "Individuals with bile duct obstruction or scheduled for surgery within 2 weeks.",
    precautions: "Use pure culinary turmeric without synthetic coloring agents.",
    whenToSeeDoctor: "Unexplained joint swelling, fever, or severe systemic pain.",
  },
  {
    id: "steam-inhalation",
    icon: "💨",
    title: "Facial Steam Inhalation",
    subtitle: "Moisturizes nasal passages & loosens mucus",
    helpsWith: "Sinus pressure, dry nasal congestion, mild airway dryness",
    howToUse: "Lean over a bowl of hot steaming water with a towel draped over your head at a safe distance (12 inches). Inhale gently for 5-8 minutes.",
    frequency: "1 to 2 times daily",
    whoShouldAvoid: "Young children (burn hazard); individuals with severe facial rosacea or asthma triggered by hot steam.",
    precautions: "Keep eyes closed and maintain adequate distance to prevent thermal burns.",
    whenToSeeDoctor: "High facial pain, visual changes, or purulent nasal discharge lasting > 10 days.",
  },
  {
    id: "chamomile-tea",
    icon: "🌼",
    title: "Chamomile Herbal Infusion",
    subtitle: "Calming herbal wellness & relaxation",
    helpsWith: "Mild tension, evening restlessness, sleep onset support",
    howToUse: "Steep 1 chamomile tea bag or 1 tbsp dried flowers in boiling water for 5 minutes covered. Drink warm 30 minutes before sleep.",
    frequency: "1 cup in the evening",
    whoShouldAvoid: "Individuals with severe allergies to ragweed or daisy family plants.",
    precautions: "Avoid combining with prescription sedatives without medical guidance.",
    whenToSeeDoctor: "Chronic insomnia lasting more than 3 weeks.",
  },
];

export default function AIRecommanded() {
  const navigate = useNavigate();

  // State
  const [symptoms, setSymptoms] = useState("");
  const [selectedLang, setSelectedLang] = useState("en-US");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  // Results State
  const [resultData, setResultData] = useState(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  // Selected Detail Modal for Everyday Self-Care
  const [selectedRemedyDetail, setSelectedRemedyDetail] = useState(null);

  // Voice Assistant State
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [voiceNotice, setVoiceNotice] = useState("");
  const recognitionRef = useRef(null);

  const isMountedRef = useRef(true);

  // User profile
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    isMountedRef.current = true;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceSupported(false);
    }

    return () => {
      isMountedRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  // Voice Toggle Handler
  const toggleVoice = () => {
    if (!voiceSupported) {
      setVoiceNotice("Speech recognition is not supported in this browser. Please type your symptoms.");
      setTimeout(() => setVoiceNotice(""), 4000);
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (isListening) {
      // Stop
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = selectedLang;
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        if (isMountedRef.current) {
          setIsListening(true);
          setVoiceNotice("🔴 Listening... Speak clearly about what you are feeling.");
        }
      };

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (isMountedRef.current && transcript.trim()) {
          setSymptoms((prev) => {
            const cleanPrev = prev.trim();
            return cleanPrev ? `${cleanPrev} ${transcript}` : transcript;
          });
        }
      };

      recognition.onerror = (e) => {
        console.warn("Speech recognition error:", e.error);
        if (isMountedRef.current) {
          setIsListening(false);
          if (e.error === "not-allowed") {
            setVoiceNotice("Microphone access was denied. Please allow microphone permissions.");
          } else if (e.error === "no-speech") {
            setVoiceNotice("No speech was detected. Please try speaking again.");
          } else {
            setVoiceNotice("Voice recognition encountered an issue. You can type your symptoms.");
          }
          setTimeout(() => setVoiceNotice(""), 4000);
        }
      };

      recognition.onend = () => {
        if (isMountedRef.current) {
          setIsListening(false);
          setVoiceNotice("✓ Voice converted to text. Review or edit above.");
          setTimeout(() => setVoiceNotice(""), 3500);
        }
      };

      recognition.start();
    } catch (err) {
      console.error("Voice start failed:", err);
      setIsListening(false);
    }
  };

  // Submit Handler
  const handleGetRecommendation = async (symptomOverride) => {
    const textToAnalyze = (symptomOverride || symptoms).trim();
    if (!textToAnalyze) {
      setError("Please describe your symptoms before requesting recommendations.");
      return;
    }

    if (textToAnalyze.length > 1000) {
      setError("Please shorten your description (maximum 1,000 characters).");
      return;
    }

    setLoading(true);
    setError("");
    setResultData(null);
    setLoadingStep(0);

    // Dynamic loading step timer
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev < 2 ? prev + 1 : prev));
    }, 750);

    try {
      const res = await fetch("/api/v1/ai/recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptoms: textToAnalyze,
          language: selectedLang,
          userProfile: {
            allergies: user.allergies || "",
          },
        }),
      });

      const data = await res.json();
      clearInterval(interval);

      if (res.ok && data.data) {
        setResultData(data.data);
      } else {
        setError(data.error || data.message || "Unable to generate recommendations right now. Please try again.");
      }
    } catch (err) {
      clearInterval(interval);
      console.error("Home remedies API error:", err);
      setError("Network connection issue. Please check your internet and try again.");
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Save Recommendation
  const handleSaveRecommendation = () => {
    if (!resultData) return;

    try {
      const saved = JSON.parse(localStorage.getItem("savedRecommendations")) || [];
      saved.unshift({
        id: `rec_${Date.now()}`,
        symptoms,
        summary: resultData.summary,
        remedies: resultData.remedies,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem("savedRecommendations", JSON.stringify(saved.slice(0, 20)));
      setToast({ type: "success", message: "Saved to your profile successfully!" });
      setTimeout(() => setToast(null), 3000);
    } catch {
      setToast({ type: "error", message: "Failed to save recommendation." });
      setTimeout(() => setToast(null), 3000);
    }
  };

  // Export Structured Report
  const handleExportReport = () => {
    if (!resultData) return;

    const remediesText = resultData.remedies
      .map((r, i) => `${i + 1}. ${r.title}\n   - Why it helps: ${r.description}\n   - How to use: ${r.howToUse}\n   - Precaution: ${r.caution}`)
      .join("\n\n");

    const content = `=====================================================
REMEDYEASE AI HOME WELLNESS REPORT
=====================================================
Date: ${new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}
User: ${user.fullname || "Valued Patient"}

SYMPTOMS DESCRIBED:
"${symptoms}"

CLINICAL WELLNESS SUMMARY:
${resultData.summary}
Guidance Level: ${resultData.severity?.toUpperCase()}

RECOMMENDED HOME REMEDIES:
${remediesText}

SELF-CARE PRACTICES:
${resultData.selfCare?.map((t) => `• ${t}`).join("\n")}

THINGS TO AVOID:
${resultData.avoid?.map((a) => `• ${a}`).join("\n")}

WHEN TO CONSULT A DOCTOR:
${resultData.whenToSeeDoctor}

=====================================================
DISCLAIMER: This report provides general wellness information and is NOT a medical diagnosis or substitute for professional medical care.
=====================================================`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `RemedyEase_Home_Remedies_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="hr-container">
      {/* Toast */}
      {toast && (
        <div className={`ms-toast ${toast.type === "success" ? "ms-toast--success" : "ms-toast--error"}`}>
          <FiCheck size={16} /> {toast.message}
        </div>
      )}

      {/* ─── Hero Section ─── */}
      <section className="hr-hero">
        <span className="hr-hero-badge">
          ✨ AI Health Assistant
        </span>
        <h1 className="hr-hero-title">Home Remedies, Made Personal</h1>
        <p className="hr-hero-subtitle">
          Describe what you're feeling and get AI-assisted suggestions for simple, everyday comfort and self-care.
        </p>
      </section>

      {/* ─── Input Card ─── */}
      <div className="hr-input-card">
        <div className="hr-textarea-label">
          <span>🔍 What are you feeling today?</span>
          <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "normal" }}>
            {symptoms.length}/1000
          </span>
        </div>

        <textarea
          className="hr-textarea"
          placeholder="Describe your symptoms in your own words (e.g., 'I have a dry throat, mild headache, and feeling a bit fatigued since yesterday...')"
          value={symptoms}
          onChange={(e) => {
            setSymptoms(e.target.value);
            if (error) setError("");
          }}
          disabled={loading}
          maxLength={1000}
        />

        {/* Quick prompt chips */}
        <div style={{ display: "flex", gap: "6px", overflowX: "auto", padding: "8px 0", scrollbarWidth: "none" }}>
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="ms-category-pill"
              style={{ fontSize: "12px", padding: "5px 12px" }}
              onClick={() => {
                setSymptoms(prompt);
                handleGetRecommendation(prompt);
              }}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Notice from speech recognition */}
        {voiceNotice && (
          <div style={{ fontSize: "13px", color: isListening ? "#dc2626" : "#15803d", fontWeight: "600", margin: "6px 0" }}>
            {voiceNotice}
          </div>
        )}

        {/* Controls row */}
        <div className="hr-controls-row">
          <div className="hr-tools-group">
            {/* Voice input button */}
            <button
              type="button"
              className={`hr-btn-voice ${isListening ? "hr-btn-voice--listening" : ""}`}
              onClick={toggleVoice}
              title="Speak your symptoms using microphone"
            >
              {isListening ? (
                <>
                  <FiMicOff size={15} /> Stop Listening
                </>
              ) : (
                <>
                  <FiMic size={15} /> Voice Input
                </>
              )}
            </button>

            {/* Language selector */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <FiGlobe size={15} color="#64748b" />
              <select
                className="hr-lang-select"
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            className="hr-btn-submit"
            onClick={() => handleGetRecommendation()}
            disabled={loading || !symptoms.trim()}
          >
            {loading ? "Analyzing..." : "Get Safe Recommendations"}
          </button>
        </div>

        {error && (
          <div style={{ display: "flex", gap: "8px", alignItems: "center", color: "#dc2626", fontSize: "13.5px", marginTop: "12px", fontWeight: "500" }}>
            <FiAlertCircle size={16} /> {error}
          </div>
        )}

        <div className="hr-disclaimer">
          ⚠️ Home-remedy suggestions are for general wellness information and are not a diagnosis or a substitute for professional medical advice.
        </div>
      </div>

      {/* ─── Non-Blocking Loader ─── */}
      {loading && (
        <div className="hr-loader-card">
          <div className="hr-spinner" />
          <h4 style={{ fontFamily: "Manrope", fontSize: "16px", margin: "0 0 6px" }}>
            Analyzing Your Symptoms
          </h4>
          <div className="hr-loader-steps">
            <span className={`hr-step-chip ${loadingStep >= 0 ? "hr-step-chip--active" : ""}`}>
              🧠 Understanding symptoms
            </span>
            <span className={`hr-step-chip ${loadingStep >= 1 ? "hr-step-chip--active" : ""}`}>
              🌿 Finding self-care remedies
            </span>
            <span className={`hr-step-chip ${loadingStep >= 2 ? "hr-step-chip--active" : ""}`}>
              🛡️ Checking safety guidance
            </span>
          </div>
        </div>
      )}

      {/* ─── Emergency Warning Section (If flagged) ─── */}
      {resultData && resultData.isEmergency && (
        <div className="hr-emergency-card">
          <div className="hr-emergency-header">
            <div className="hr-emergency-icon">
              <FiAlertTriangle />
            </div>
            <div>
              <h3>You May Need Urgent Medical Attention</h3>
              <p>Based on the symptoms you described, home remedies are not safe or appropriate.</p>
            </div>
          </div>

          <p style={{ color: "#7f1d1d", fontSize: "14px", lineHeight: "1.5", margin: "0 0 14px" }}>
            {resultData.summary}
          </p>

          <div style={{ background: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #fecaca", marginBottom: "16px" }}>
            <strong style={{ color: "#991b1b", fontSize: "13.5px", display: "block", marginBottom: "6px" }}>
              Immediate Emergency Steps:
            </strong>
            <ul style={{ margin: "0", paddingLeft: "20px", fontSize: "13.5px", color: "#7f1d1d", lineHeight: "1.6" }}>
              {resultData.selfCare?.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ul>
          </div>

          <div className="hr-emergency-actions">
            <Link to="/user/dashboard/Meetdoctor" className="hr-btn-emergency">
              <FiUserCheck size={16} /> Consult an On-Call Doctor
            </Link>
            <Link to="/user/dashboard/Appointments" className="hr-btn-voice" style={{ background: "#ffffff" }}>
              Book Priority Appointment
            </Link>
          </div>
        </div>
      )}

      {/* ─── Structured Results Panel ─── */}
      {resultData && !resultData.isEmergency && (
        <div className="hr-results-card">
          {/* Header */}
          <div className="hr-results-header">
            <div className="hr-results-title-group">
              <h3>Your Personalized Self-Care Plan</h3>
              <p>{resultData.summary}</p>
            </div>

            <span className={`hr-level-badge ${resultData.severity === "moderate" ? "hr-level-badge--moderate" : "hr-level-badge--mild"}`}>
              {resultData.severity === "moderate" ? "🟡 Consider Medical Advice" : "🟢 General Self-Care"}
            </span>
          </div>

          {/* Remedies Grid */}
          <h4 style={{ fontFamily: "Manrope", fontSize: "16px", fontWeight: "800", color: "#0f172a", margin: "0 0 14px" }}>
            🌿 Recommended Everyday Remedies ({resultData.remedies?.length || 0})
          </h4>

          <div className="hr-remedies-grid">
            {resultData.remedies?.map((rem, idx) => (
              <div key={idx} className="hr-remedy-card">
                <div className="hr-remedy-card-header">
                  <span style={{ fontSize: "20px" }}>🌱</span>
                  <h4>{rem.title}</h4>
                </div>

                <p className="hr-remedy-desc">{rem.description}</p>

                <div className="hr-remedy-how">
                  <strong>How to prepare & use:</strong> {rem.howToUse}
                </div>

                {rem.caution && (
                  <div className="hr-remedy-caution">
                    <FiInfo size={14} /> <strong>Caution:</strong> {rem.caution}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 2-Column Tips: Self Care & Avoid */}
          <div className="hr-tips-grid">
            {/* Self-Care */}
            <div className="hr-tips-box">
              <h5>💧 Supportive Self-Care</h5>
              <ul className="hr-tips-list">
                {resultData.selfCare?.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>

            {/* Avoid */}
            {resultData.avoid?.length > 0 && (
              <div className="hr-tips-box" style={{ background: "#fffbfb", borderColor: "#fee2e2" }}>
                <h5 style={{ color: "#991b1b" }}>🚫 What to Avoid</h5>
                <ul className="hr-tips-list" style={{ color: "#7f1d1d" }}>
                  {resultData.avoid.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Warning Signs & Doctor Escalation */}
          <div className="hr-warning-box">
            <h4>
              <FiAlertCircle size={16} /> When to Consult a Professional
            </h4>
            <p>{resultData.whenToSeeDoctor}</p>

            <div className="hr-escalate-cta">
              <Link to="/user/dashboard/Meetdoctor" className="hr-btn-doctor">
                <FiUserCheck size={15} /> Find a Doctor
              </Link>
              <Link to="/user/dashboard/Appointments" className="ms-btn-nav" style={{ background: "#ffffff" }}>
                Book Appointment
              </Link>
            </div>
          </div>

          {/* Footer Actions (Save / Export) */}
          <div className="hr-results-actions">
            <div className="hr-action-group">
              <button type="button" className="ms-btn-nav" onClick={handleSaveRecommendation}>
                <FiBookmark size={15} /> Save to Profile
              </button>
              <button type="button" className="ms-btn-nav" onClick={handleExportReport}>
                <FiDownload size={15} /> Export Report (.txt)
              </button>
            </div>

            <button
              type="button"
              className="ms-btn-nav"
              onClick={() => {
                setSymptoms("");
                setResultData(null);
              }}
              style={{ color: "#64748b" }}
            >
              Ask Another Symptom
            </button>
          </div>
        </div>
      )}

      {/* ─── Everyday Self-Care (Common Remedies) Section ─── */}
      <section className="hr-everyday-section">
        <div className="hr-everyday-header">
          <h3>Everyday Self-Care Essentials</h3>
          <p>Time-tested, evidence-based natural practices for everyday comfort and recovery.</p>
        </div>

        <div className="hr-everyday-grid">
          {EVERYDAY_REMEDIES.map((rem) => (
            <div
              key={rem.id}
              className="hr-everyday-card"
              onClick={() => setSelectedRemedyDetail(rem)}
            >
              <div className="hr-everyday-icon-wrap">
                <span>{rem.icon}</span>
              </div>
              <h4>{rem.title}</h4>
              <p>{rem.subtitle}</p>
              <div className="hr-everyday-learn">
                Learn More & Precautions <FiArrowRight size={14} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Detail Modal Dialog for Everyday Remedy ─── */}
      {selectedRemedyDetail && (
        <div className="hr-modal-overlay" onClick={() => setSelectedRemedyDetail(null)}>
          <div className="hr-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setSelectedRemedyDetail(null)}
              style={{
                position: "absolute",
                top: "18px",
                right: "18px",
                background: "#f1f5f9",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <FiX size={16} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
              <span style={{ fontSize: "32px" }}>{selectedRemedyDetail.icon}</span>
              <div>
                <h3 style={{ fontFamily: "Manrope", fontSize: "20px", fontWeight: "800", margin: "0 0 2px" }}>
                  {selectedRemedyDetail.title}
                </h3>
                <span style={{ fontSize: "13px", color: "#16a34a", fontWeight: "600" }}>
                  {selectedRemedyDetail.subtitle}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "13.5px", color: "#334155" }}>
              <div>
                <strong style={{ color: "#0f172a" }}>Helps With:</strong>
                <p style={{ margin: "2px 0 0", color: "#475569" }}>{selectedRemedyDetail.helpsWith}</p>
              </div>

              <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <strong style={{ color: "#0f172a" }}>Preparation & Usage:</strong>
                <p style={{ margin: "4px 0 0", color: "#334155" }}>{selectedRemedyDetail.howToUse}</p>
                <div style={{ marginTop: "6px", fontSize: "12.5px", color: "#15803d", fontWeight: "600" }}>
                  Frequency: {selectedRemedyDetail.frequency}
                </div>
              </div>

              <div style={{ background: "#fef3c7", padding: "12px 14px", borderRadius: "10px", border: "1px solid #fde68a" }}>
                <strong style={{ color: "#92400e" }}>Who Should Avoid:</strong>
                <p style={{ margin: "4px 0 0", color: "#78350f" }}>{selectedRemedyDetail.whoShouldAvoid}</p>
              </div>

              <div>
                <strong style={{ color: "#0f172a" }}>Safety Precaution:</strong>
                <p style={{ margin: "2px 0 0", color: "#64748b" }}>{selectedRemedyDetail.precautions}</p>
              </div>

              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "12px", fontSize: "12.5px", color: "#94a3af" }}>
                <strong>When to see a doctor:</strong> {selectedRemedyDetail.whenToSeeDoctor}
              </div>
            </div>

            <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="ms-btn-cart"
                onClick={() => setSelectedRemedyDetail(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}