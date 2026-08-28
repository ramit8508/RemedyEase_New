import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FiMic, FiMicOff, FiSquare, FiCheck, FiChevronRight, FiAlertTriangle, FiShield, FiZap, FiTarget, FiLock, FiGlobe, FiX, FiChevronDown, FiBookOpen, FiUsers, FiSave, FiRefreshCw, FiCalendar, FiHelpCircle, FiInfo } from "react-icons/fi";
import "../../Css_for_all/SymptomChecker.css";

// Locale imports
import en from "../../locales/en.json";
import hi from "../../locales/hi.json";
import hinglish from "../../locales/hinglish.json";
import pa from "../../locales/pa.json";
import bn from "../../locales/bn.json";
import mr from "../../locales/mr.json";
import ta from "../../locales/ta.json";
import te from "../../locales/te.json";
import gu from "../../locales/gu.json";
import kn from "../../locales/kn.json";
import ml from "../../locales/ml.json";
import ur from "../../locales/ur.json";

/* ─── Constants ─── */
const MAX_CHARS = 2000;
const MIN_CHARS = 10;

const LOCALES = { en, hi, hinglish, pa, bn, mr, ta, te, gu, kn, ml, ur };

const LANGUAGES = [
  { code: "en", speechCode: "en-US", flag: "🇺🇸", name: "English" },
  { code: "hi", speechCode: "hi-IN", flag: "🇮🇳", name: "हिन्दी (Hindi)" },
  { code: "hinglish", speechCode: "hi-IN", flag: "🇮🇳", name: "Hinglish" },
  { code: "pa", speechCode: "pa-IN", flag: "🇮🇳", name: "ਪੰਜਾਬੀ (Punjabi)" },
  { code: "bn", speechCode: "bn-IN", flag: "🇮🇳", name: "বাংলা (Bengali)" },
  { code: "mr", speechCode: "mr-IN", flag: "🇮🇳", name: "मराठी (Marathi)" },
  { code: "ta", speechCode: "ta-IN", flag: "🇮🇳", name: "தமிழ் (Tamil)" },
  { code: "te", speechCode: "te-IN", flag: "🇮🇳", name: "తెలుగు (Telugu)" },
  { code: "gu", speechCode: "gu-IN", flag: "🇮🇳", name: "ગુજરાતી (Gujarati)" },
  { code: "kn", speechCode: "kn-IN", flag: "🇮🇳", name: "ಕನ್ನಡ (Kannada)" },
  { code: "ml", speechCode: "ml-IN", flag: "🇮🇳", name: "മലയാളം (Malayalam)" },
  { code: "ur", speechCode: "ur-IN", flag: "🇵🇰", name: "اردو (Urdu)" },
];

// Voice state machine
const VOICE_STATES = {
  IDLE: "IDLE",
  REQUESTING_PERMISSION: "REQUESTING_PERMISSION",
  READY: "READY",
  LISTENING: "LISTENING",
  PROCESSING: "PROCESSING",
  COMPLETE: "COMPLETE",
  ERROR: "ERROR",
};

/* ─── Helper: Deep get from locale ─── */
function t(locale, path) {
  return path.split(".").reduce((obj, key) => obj?.[key], locale) || path;
}

/* ─── Component ─── */
export default function SymptomChecker() {
  const navigate = useNavigate();

  // Core state
  const [symptoms, setSymptoms] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [validationMsg, setValidationMsg] = useState("");

  // Language
  const [langCode, setLangCode] = useState("en");

  // Voice
  const [voiceState, setVoiceState] = useState(VOICE_STATES.IDLE);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [voiceTroubleOpen, setVoiceTroubleOpen] = useState(false);
  const recognitionRef = useRef(null);
  const voiceModeRef = useRef(null); // 'symptoms' | 'answer'

  // Interactive Q&A
  const [conversation, setConversation] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answerInput, setAnswerInput] = useState("");
  const [questionProgress, setQuestionProgress] = useState({ current: 0, total: 8 });
  const [isOptionalQuestion, setIsOptionalQuestion] = useState(false);

  // Request management
  const abortRef = useRef(null);
  const isSubmittingRef = useRef(false);

  // Derived
  const locale = useMemo(() => LOCALES[langCode] || LOCALES.en, [langCode]);
  const currentLang = useMemo(() => LANGUAGES.find((l) => l.code === langCode) || LANGUAGES[0], [langCode]);

  /* ─── Speech Recognition Setup ─── */
  useEffect(() => {
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.hostname === "";
    const isSecure = window.location.protocol === "https:" || isLocalhost;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!isSecure || !SpeechRecognition) {
      setVoiceSupported(false);
      return;
    }

    setVoiceSupported(true);

    return () => {
      // Cleanup on unmount
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) { /* ignore */ }
        recognitionRef.current = null;
      }
    };
  }, []);

  /* ─── Abort pending requests on unmount ─── */
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  /* ─── Voice: Start ─── */
  const startVoice = useCallback((mode) => {
    if (voiceState === VOICE_STATES.LISTENING) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError(t(locale, "voice.unsupported"));
      setVoiceState(VOICE_STATES.ERROR);
      return;
    }

    setVoiceState(VOICE_STATES.REQUESTING_PERMISSION);
    setVoiceError("");
    voiceModeRef.current = mode;

    // Request mic permission first
    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          // Got permission — stop the stream immediately (we don't need it, SpeechRecognition manages its own)
          stream.getTracks().forEach((track) => track.stop());

          // Create fresh recognition instance
          const recog = new SpeechRecognition();
          recog.lang = currentLang.speechCode;
          recog.interimResults = true;
          recog.continuous = false; // Single utterance — not continuous
          recog.maxAlternatives = 3;

          recog.onstart = () => {
            setVoiceState(VOICE_STATES.LISTENING);
          };

          recog.onresult = (event) => {
            let finalText = "";
            let interimText = "";

            for (let i = 0; i < event.results.length; i++) {
              const result = event.results[i];
              if (result.isFinal) {
                finalText += result[0].transcript;
              } else {
                interimText += result[0].transcript;
              }
            }

            // Only commit final text to the input
            if (finalText.trim()) {
              const trimmed = finalText.trim();
              if (voiceModeRef.current === "symptoms") {
                setSymptoms((prev) => {
                  const combined = prev ? `${prev} ${trimmed}` : trimmed;
                  return combined.slice(0, MAX_CHARS);
                });
              } else if (voiceModeRef.current === "answer") {
                setAnswerInput((prev) => (prev ? `${prev} ${trimmed}` : trimmed));
              }
            }
          };

          recog.onerror = (e) => {
            if (e.error === "aborted") return; // Normal when we manually stop
            if (e.error === "not-allowed" || e.error === "permission-denied") {
              setVoiceError(t(locale, "voice.permissionDenied"));
            } else if (e.error === "no-speech") {
              setVoiceError(t(locale, "voice.noSpeech"));
            } else if (e.error === "network") {
              setVoiceError(t(locale, "voice.networkError"));
            } else {
              setVoiceError(t(locale, "voice.networkError"));
            }
            setVoiceState(VOICE_STATES.ERROR);
          };

          recog.onend = () => {
            setVoiceState(VOICE_STATES.COMPLETE);
            // Auto-reset to idle after a brief "captured" message
            setTimeout(() => setVoiceState(VOICE_STATES.IDLE), 2000);
          };

          recognitionRef.current = recog;

          try {
            recog.start();
          } catch (e) {
            setVoiceError(t(locale, "voice.networkError"));
            setVoiceState(VOICE_STATES.ERROR);
          }
        })
        .catch(() => {
          setVoiceError(t(locale, "voice.permissionDenied"));
          setVoiceState(VOICE_STATES.ERROR);
        });
    } else {
      setVoiceError(t(locale, "voice.unsupported"));
      setVoiceState(VOICE_STATES.ERROR);
    }
  }, [voiceState, locale, currentLang.speechCode]);

  /* ─── Voice: Stop ─── */
  const stopVoice = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { /* ignore */ }
    }
    setVoiceState(VOICE_STATES.COMPLETE);
    setTimeout(() => setVoiceState(VOICE_STATES.IDLE), 2000);
  }, []);

  /* ─── API Call Helper ─── */
  const apiCall = useCallback(async (body) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const res = await fetch("/api/v1/ai/interactive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const data = await res.json();

    if (!res.ok) {
      let errorKey = "errors.serverError";
      if (res.status === 408) errorKey = "errors.timeoutError";
      else if (res.status === 429) errorKey = "errors.rateLimitError";
      else if (res.status === 503) errorKey = "errors.connectionError";
      throw new Error(t(locale, errorKey));
    }

    return data;
  }, [locale]);

  /* ─── Analyze Symptoms ─── */
  const handleAnalyze = useCallback(async () => {
    // Validation
    if (!symptoms.trim()) {
      setValidationMsg(t(locale, "input.validationEmpty"));
      return;
    }
    if (symptoms.trim().length < MIN_CHARS) {
      setValidationMsg(t(locale, "input.validationMin"));
      return;
    }
    if (isSubmittingRef.current) return;

    setValidationMsg("");
    isSubmittingRef.current = true;
    setLoading(true);
    setAnalysis(null);
    setLoadingStep(0);
    setConversation([]);
    setCurrentQuestion(null);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < 2 ? prev + 1 : prev));
    }, 1200);

    try {
      const data = await apiCall({
        symptoms: symptoms.trim(),
        conversation: [],
        language: currentLang.speechCode,
      });

      clearInterval(stepInterval);

      if (data.finished) {
        setAnalysis(data.analysis || {});
      } else {
        setCurrentQuestion(data.nextQuestion || "Can you tell me more?");
        setQuestionProgress({ current: data.questionNumber || 1, total: data.totalQuestions || 8 });
        setIsOptionalQuestion(data.isOptional || false);
      }
    } catch (err) {
      clearInterval(stepInterval);
      if (err.name === "AbortError") return;
      setAnalysis({ error: true, message: err.message || t(locale, "errors.connectionError") });
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  }, [symptoms, locale, currentLang.speechCode, apiCall]);

  /* ─── Submit Answer ─── */
  const submitAnswer = useCallback(async () => {
    if (!currentQuestion) return;
    if (!answerInput.trim() && !isOptionalQuestion) return;
    if (isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    const newConv = [...conversation, { question: currentQuestion, answer: answerInput || "No additional information" }];
    setConversation(newConv);
    setAnswerInput("");
    setCurrentQuestion(null);
    setIsOptionalQuestion(false);
    setLoading(true);

    try {
      const data = await apiCall({
        symptoms: symptoms.trim(),
        conversation: newConv,
        language: currentLang.speechCode,
      });

      if (data.finished) {
        setAnalysis(data.analysis || {});
      } else {
        setCurrentQuestion(data.nextQuestion || null);
        setQuestionProgress({ current: data.questionNumber || newConv.length + 1, total: data.totalQuestions || 8 });
        setIsOptionalQuestion(data.isOptional || false);
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      setAnalysis({ error: true, message: err.message || t(locale, "errors.connectionError") });
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  }, [currentQuestion, answerInput, isOptionalQuestion, conversation, symptoms, locale, currentLang.speechCode, apiCall]);

  /* ─── Skip optional question ─── */
  const skipQuestion = useCallback(async () => {
    if (!isOptionalQuestion) return;
    const newConv = [...conversation, { question: currentQuestion, answer: "Skipped" }];
    setConversation(newConv);
    setAnswerInput("");
    setCurrentQuestion(null);
    setIsOptionalQuestion(false);
    setLoading(true);

    try {
      const data = await apiCall({
        symptoms: symptoms.trim(),
        conversation: newConv,
        language: currentLang.speechCode,
      });
      setAnalysis(data.analysis || {});
    } catch (err) {
      if (err.name === "AbortError") return;
      setAnalysis({ error: true, message: err.message || t(locale, "errors.connectionError") });
    } finally {
      setLoading(false);
    }
  }, [isOptionalQuestion, conversation, currentQuestion, symptoms, locale, currentLang.speechCode, apiCall]);

  /* ─── Save / Navigation ─── */
  const saveAnalysis = useCallback(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    const saved = JSON.parse(localStorage.getItem("savedSymptomAnalyses")) || [];
    saved.push({
      id: Date.now(),
      symptoms,
      analysis,
      timestamp: new Date().toISOString(),
      userId: user?.email,
    });
    localStorage.setItem("savedSymptomAnalyses", JSON.stringify(saved));
    alert(t(locale, "result.saveBtn") + " ✓");
  }, [symptoms, analysis, locale]);

  const resetAnalysis = useCallback(() => {
    setSymptoms("");
    setAnalysis(null);
    setConversation([]);
    setCurrentQuestion(null);
    setValidationMsg("");
  }, []);

  /* ─── Loading steps text ─── */
  const loadingSteps = useMemo(() => [
    t(locale, "loading.step1"),
    t(locale, "loading.step2"),
    t(locale, "loading.step3"),
  ], [locale]);

  /* ═══════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════ */
  return (
    <div className="sc">
      {/* ── HERO ── */}
      <section className="sc-hero">
        <div className="sc-hero-inner">
          <span className="sc-eyebrow">{t(locale, "hero.eyebrow")}</span>
          <h1 className="sc-hero-title">{t(locale, "hero.title")}</h1>
          <p className="sc-hero-desc">{t(locale, "hero.description")}</p>

          <div className="sc-trust-strip">
            <span className="sc-trust-item"><FiLock size={14} /> {t(locale, "hero.trustSecure")}</span>
            <span className="sc-trust-dot">•</span>
            <span className="sc-trust-item"><FiGlobe size={14} /> {t(locale, "hero.trustMultilingual")}</span>
            <span className="sc-trust-dot">•</span>
            <span className="sc-trust-item"><FiZap size={14} /> {t(locale, "hero.trustFast")}</span>
          </div>

          {/* Language Selector — always visible */}
          <div className="sc-lang-wrap">
            <label className="sc-lang-label" htmlFor="sc-lang-select">
              <FiGlobe size={15} /> {t(locale, "language.label")}
            </label>
            <select
              id="sc-lang-select"
              className="sc-lang-select"
              value={langCode}
              onChange={(e) => setLangCode(e.target.value)}
              disabled={voiceState === VOICE_STATES.LISTENING}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ── */}
      <div className="sc-main">
        {/* ── SYMPTOM INPUT CARD ── */}
        <div className="sc-input-card">
          <h2 className="sc-input-heading">{t(locale, "input.heading")}</h2>

          <div className="sc-textarea-wrap">
            <textarea
              className="sc-textarea"
              placeholder={t(locale, "input.placeholder")}
              value={symptoms}
              onChange={(e) => {
                const val = e.target.value.slice(0, MAX_CHARS);
                setSymptoms(val);
                if (validationMsg) setValidationMsg("");
              }}
              disabled={loading}
              rows={5}
              aria-label={t(locale, "input.heading")}
            />
            {symptoms.length > 0 && !loading && (
              <button
                className="sc-clear-btn"
                onClick={() => { setSymptoms(""); setValidationMsg(""); }}
                aria-label={t(locale, "input.clear")}
                type="button"
              >
                <FiX size={16} />
              </button>
            )}
          </div>

          <div className="sc-textarea-meta">
            <span className="sc-example-text">{t(locale, "input.example")}</span>
            <span className="sc-char-count">{symptoms.length} / {MAX_CHARS}</span>
          </div>

          {validationMsg && (
            <p className="sc-validation" role="alert">{validationMsg}</p>
          )}

          {/* Actions row */}
          <div className="sc-actions-row">
            <button
              className="sc-analyze-btn"
              onClick={handleAnalyze}
              disabled={loading || !symptoms.trim()}
              aria-label={t(locale, "input.analyzeBtn")}
            >
              {loading ? (
                <>
                  <span className="sc-spinner-sm" />
                  {t(locale, "input.analyzing")}
                </>
              ) : (
                <>
                  {t(locale, "input.analyzeBtn")}
                  <FiChevronRight size={18} />
                </>
              )}
            </button>

            {/* Voice button */}
            {voiceSupported && (
              <button
                className={`sc-voice-btn ${voiceState === VOICE_STATES.LISTENING ? "sc-voice-btn--recording" : ""} ${voiceState === VOICE_STATES.COMPLETE ? "sc-voice-btn--done" : ""}`}
                onClick={() => {
                  if (voiceState === VOICE_STATES.LISTENING) {
                    stopVoice();
                  } else {
                    startVoice("symptoms");
                  }
                }}
                disabled={loading}
                aria-label={voiceState === VOICE_STATES.LISTENING ? t(locale, "voice.stopBtn") : t(locale, "voice.speakBtn")}
              >
                {voiceState === VOICE_STATES.LISTENING ? (
                  <>
                    <FiSquare size={16} />
                    <span>{t(locale, "voice.stopBtn")}</span>
                  </>
                ) : voiceState === VOICE_STATES.COMPLETE ? (
                  <>
                    <FiCheck size={16} />
                    <span>{t(locale, "voice.captured")}</span>
                  </>
                ) : (
                  <>
                    <FiMic size={16} />
                    <span>{t(locale, "voice.speakBtn")}</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Voice listening indicator */}
          {voiceState === VOICE_STATES.LISTENING && (
            <div className="sc-listening-indicator" role="status">
              <span className="sc-pulse-dot" />
              <span>{t(locale, "voice.listening")}</span>
            </div>
          )}

          {/* Voice unsupported notice */}
          {!voiceSupported && (
            <p className="sc-voice-unsupported">
              <FiMicOff size={14} /> {t(locale, "voice.unsupported")}
            </p>
          )}

          {/* Voice error */}
          {voiceState === VOICE_STATES.ERROR && voiceError && (
            <p className="sc-voice-error" role="alert">
              <FiAlertTriangle size={14} /> {voiceError}
            </p>
          )}

          {/* Voice trouble - collapsible */}
          {voiceSupported && (
            <div className="sc-voice-trouble">
              <button
                className="sc-trouble-toggle"
                onClick={() => setVoiceTroubleOpen(!voiceTroubleOpen)}
                type="button"
              >
                <FiHelpCircle size={14} />
                {t(locale, "voice.troubleTitle")}
                <FiChevronDown size={14} className={voiceTroubleOpen ? "sc-chevron-open" : ""} />
              </button>
              {voiceTroubleOpen && (
                <ul className="sc-trouble-list">
                  <li>{t(locale, "voice.tip1")}</li>
                  <li>{t(locale, "voice.tip2")}</li>
                  <li>{t(locale, "voice.tip3")}</li>
                  <li>{t(locale, "voice.tip4")}</li>
                </ul>
              )}
            </div>
          )}
        </div>

        {/* ── FOLLOW-UP QUESTION ── */}
        {currentQuestion && (
          <div className="sc-question-card">
            <div className="sc-question-header">
              <span className="sc-question-num">
                {t(locale, "question.questionOf")} {questionProgress.current} {t(locale, "question.of")} {questionProgress.total}
                {isOptionalQuestion && <span className="sc-optional-badge">{t(locale, "question.optional")}</span>}
              </span>
              <span className="sc-progress-pct">
                {Math.round((questionProgress.current / questionProgress.total) * 100)}% {t(locale, "question.complete")}
              </span>
            </div>

            <div className="sc-progress-bar">
              <div className="sc-progress-fill" style={{ width: `${(questionProgress.current / questionProgress.total) * 100}%` }} />
            </div>

            <p className="sc-question-text">{currentQuestion}</p>

            <div className="sc-answer-row">
              <input
                type="text"
                className="sc-answer-input"
                value={answerInput}
                placeholder={isOptionalQuestion ? t(locale, "question.typeOptional") : t(locale, "question.typeAnswer")}
                onChange={(e) => setAnswerInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitAnswer()}
                disabled={loading}
                aria-label={t(locale, "question.typeAnswer")}
              />

              {voiceSupported && (
                <button
                  className={`sc-answer-voice ${voiceState === VOICE_STATES.LISTENING && voiceModeRef.current === "answer" ? "sc-answer-voice--recording" : ""}`}
                  onClick={() => {
                    if (voiceState === VOICE_STATES.LISTENING && voiceModeRef.current === "answer") {
                      stopVoice();
                    } else {
                      startVoice("answer");
                    }
                  }}
                  disabled={loading}
                  aria-label={t(locale, "voice.speakBtn")}
                  type="button"
                >
                  {voiceState === VOICE_STATES.LISTENING && voiceModeRef.current === "answer" ? <FiSquare size={16} /> : <FiMic size={16} />}
                </button>
              )}

              <button
                className="sc-answer-submit"
                onClick={submitAnswer}
                disabled={loading || (!answerInput.trim() && !isOptionalQuestion)}
                type="button"
              >
                {loading ? <span className="sc-spinner-sm" /> : t(locale, "question.submit")}
              </button>

              {isOptionalQuestion && (
                <button className="sc-skip-btn" onClick={skipQuestion} disabled={loading} type="button">
                  {t(locale, "question.skip")}
                </button>
              )}
            </div>

            {voiceState === VOICE_STATES.LISTENING && voiceModeRef.current === "answer" && (
              <div className="sc-listening-indicator sc-listening-indicator--small" role="status">
                <span className="sc-pulse-dot" />
                <span>{t(locale, "voice.listening")}</span>
              </div>
            )}

            {conversation.length > 0 && (
              <p className="sc-prev-answers">{t(locale, "question.previousAnswers")} {conversation.length}</p>
            )}
          </div>
        )}

        {/* ── RESULTS / LOADING / EMPTY ── */}
        <div className="sc-result-container">
          {loading ? (
            /* Loading */
            <div className="sc-loading">
              <div className="sc-loading-spinner" />
              <h3 className="sc-loading-title">✨ {t(locale, "loading.title")}</h3>
              <div className="sc-loading-steps">
                {loadingSteps.map((step, i) => (
                  <div key={i} className={`sc-loading-step ${i <= loadingStep ? "sc-loading-step--active" : ""}`}>
                    {i <= loadingStep ? <FiCheck size={14} /> : <span className="sc-step-dot" />}
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : analysis ? (
            analysis.error ? (
              /* Error */
              <div className="sc-error">
                <FiAlertTriangle size={32} />
                <p>{analysis.message}</p>
                <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "12px" }}>
                  <button className="sc-btn-primary" onClick={handleAnalyze} style={{ padding: "8px 16px", fontSize: "13px" }}>
                    <FiRefreshCw size={14} /> Retry Analysis
                  </button>
                  <button className="sc-btn-outline" onClick={resetAnalysis} style={{ padding: "8px 16px", fontSize: "13px" }}>
                    {t(locale, "result.newBtn")}
                  </button>
                </div>
              </div>
            ) : (
              /* Analysis Result */
              <div className="sc-analysis">
                {/* Severity Badge */}
                <div className={`sc-severity sc-severity--${analysis.severity}`}>
                  <span className="sc-severity-icon">
                    {analysis.severity === "severe" ? "⚠️" : analysis.severity === "moderate" ? "⚡" : "✅"}
                  </span>
                  <span className="sc-severity-text">
                    {analysis.severity === "severe"
                      ? t(locale, "result.severeSevere")
                      : analysis.severity === "moderate"
                      ? t(locale, "result.severeModerate")
                      : t(locale, "result.severeMild")}
                  </span>
                </div>

                {/* Urgent warning */}
                {analysis.severity === "severe" && (
                  <div className="sc-urgent-banner">
                    <FiAlertTriangle size={20} />
                    <div>
                      <strong>{t(locale, "result.urgentTitle")}</strong>
                      <p>{t(locale, "result.urgentMessage")}</p>
                    </div>
                  </div>
                )}

                {/* Summary */}
                <div className="sc-section">
                  <h3 className="sc-section-title">
                    <FiBookOpen size={18} /> {t(locale, "result.summaryTitle")}
                  </h3>
                  <p className="sc-section-text">{analysis.summary}</p>
                </div>

                {/* Doctor Recommendation */}
                {(analysis.severity === "severe" || analysis.severity === "moderate") && (
                  <div className="sc-doctor-card">
                    <div className="sc-doctor-header">
                      <span className="sc-doctor-icon">👨‍⚕️</span>
                      <h3>{t(locale, "result.doctorRecommendation")}</h3>
                    </div>
                    <div className="sc-doctor-info">
                      <p className="sc-specialist-type">{analysis.doctorType}</p>
                      <p className="sc-specialist-reason">{analysis.reason}</p>
                    </div>
                    <div className="sc-doctor-actions">
                      <button className="sc-btn-primary" onClick={() => navigate("/user/dashboard/Appointments")}>
                        <FiCalendar size={16} /> {t(locale, "result.bookBtn")}
                      </button>
                      <button className="sc-btn-outline" onClick={() => navigate("/user/dashboard/Meetdoctor")}>
                        <FiUsers size={16} /> {t(locale, "result.viewDoctorsBtn")}
                      </button>
                    </div>
                  </div>
                )}

                {/* Home Remedies */}
                {analysis.severity === "mild" && (
                  <div className="sc-remedies-card">
                    <h3 className="sc-section-title">🏠 {t(locale, "result.homeRemedies")}</h3>
                    <p className="sc-section-text">{t(locale, "result.homeRemediesDesc")}</p>
                    {analysis.homeRemedies && (
                      <div className="sc-remedies-list">
                        {analysis.homeRemedies.split("\n").filter(Boolean).map((remedy, i) => (
                          <div key={i} className="sc-remedy-item">
                            <FiCheck size={14} className="sc-remedy-check" />
                            <span>{remedy}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <button className="sc-btn-primary sc-btn-primary--mt" onClick={() => navigate("/user/dashboard/ai-recommanded")}>
                      {t(locale, "result.viewRemediesBtn")}
                    </button>
                  </div>
                )}

                {/* Disclaimer */}
                <div className="sc-disclaimer">
                  <FiInfo size={16} />
                  <p>{t(locale, "result.disclaimer")}</p>
                </div>

                {/* Action buttons */}
                <div className="sc-result-actions">
                  <button className="sc-btn-outline" onClick={saveAnalysis}>
                    <FiSave size={16} /> {t(locale, "result.saveBtn")}
                  </button>
                  <button className="sc-btn-outline" onClick={resetAnalysis}>
                    <FiRefreshCw size={16} /> {t(locale, "result.newBtn")}
                  </button>
                </div>
              </div>
            )
          ) : (
            /* Empty state */
            <div className="sc-empty">
              <span className="sc-empty-icon">🩺</span>
              <h3>{t(locale, "ready.title")}</h3>
              <p>{t(locale, "ready.description")}</p>
            </div>
          )}
        </div>

        {/* ── PRIVACY NOTICE ── */}
        <div className="sc-privacy">
          <FiShield size={14} />
          <span>{t(locale, "privacy.notice")}</span>
        </div>

        {/* ── FEATURE CARDS ── */}
        <div className="sc-cards-grid">
          <div className="sc-feature-card">
            <div className="sc-feature-icon sc-feature-icon--green"><FiTarget size={22} /></div>
            <h4>{t(locale, "cards.card1Title")}</h4>
            <p>{t(locale, "cards.card1Desc")}</p>
          </div>
          <div className="sc-feature-card">
            <div className="sc-feature-icon sc-feature-icon--blue"><FiZap size={22} /></div>
            <h4>{t(locale, "cards.card2Title")}</h4>
            <p>{t(locale, "cards.card2Desc")}</p>
          </div>
          <div className="sc-feature-card">
            <div className="sc-feature-icon sc-feature-icon--purple"><FiLock size={22} /></div>
            <h4>{t(locale, "cards.card3Title")}</h4>
            <p>{t(locale, "cards.card3Desc")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
