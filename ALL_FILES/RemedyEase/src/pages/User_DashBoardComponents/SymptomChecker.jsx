import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../../Css_for_all/SymptomChecker.css";

export default function SymptomChecker() {
  const [symptoms, setSymptoms] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const recognitionRef = useRef(null);
  const [recognizeMode, setRecognizeMode] = useState(null); // 'symptoms' or 'answer'
  const [conversation, setConversation] = useState([]); // {question, answer}[]
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answerInput, setAnswerInput] = useState("");
  const [questionProgress, setQuestionProgress] = useState({ current: 0, total: 8 });
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isOptionalQuestion, setIsOptionalQuestion] = useState(false);
  const navigate = useNavigate();

  // Supported languages
  const languages = [
    { code: 'en-US', name: '🇺🇸 English (US)', label: 'English' },
    { code: 'en-GB', name: '🇬🇧 English (UK)', label: 'English UK' },
    { code: 'hi-IN', name: '🇮🇳 हिन्दी (Hindi)', label: 'Hindi' },
    { code: 'es-ES', name: '🇪🇸 Español (Spanish)', label: 'Spanish' },
    { code: 'fr-FR', name: '🇫🇷 Français (French)', label: 'French' },
    { code: 'de-DE', name: '🇩🇪 Deutsch (German)', label: 'German' },
    { code: 'pt-BR', name: '🇧🇷 Português (Portuguese)', label: 'Portuguese' },
    { code: 'zh-CN', name: '🇨🇳 中文 (Chinese)', label: 'Chinese' },
    { code: 'ja-JP', name: '🇯🇵 日本語 (Japanese)', label: 'Japanese' },
    { code: 'ar-SA', name: '🇸🇦 العربية (Arabic)', label: 'Arabic' },
  ];

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

    // start interactive flow
    setLoading(true);
    setAnalysis(null);
    setLoadingStep(0);
    setConversation([]);
    setCurrentQuestion(null);

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
      const res = await fetch("/api/v1/ai/interactive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms, conversation: [] }),
      });

      const data = await res.json();
      clearInterval(stepInterval);

      if (res.ok) {
        if (data.finished) {
          setAnalysis(data.analysis || {});
          setLoading(false);
        } else {
          setCurrentQuestion(data.nextQuestion || "Can you tell me more about the symptom duration?");
          setQuestionProgress({
            current: data.questionNumber || 1,
            total: data.totalQuestions || 8
          });
          setIsOptionalQuestion(data.isOptional || false);
          setLoading(false);
        }
      } else {
        setAnalysis({ error: true, message: data.message || "Failed to analyze symptoms" });
        setLoading(false);
      }
    } catch (err) {
      clearInterval(stepInterval);
      setAnalysis({ error: true, message: "Cannot connect to server. Please try again." });
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!currentQuestion) return;
    if (!answerInput.trim() && !isOptionalQuestion) {
      alert("Please answer the question");
      return;
    }

    const newConv = [...conversation, { question: currentQuestion, answer: answerInput || "No additional information" }];
    setConversation(newConv);
    setAnswerInput("");
    setCurrentQuestion(null);
    setIsOptionalQuestion(false);
    setLoading(true);

    try {
      const res = await fetch("/api/v1/ai/interactive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms, conversation: newConv }),
      });

      const data = await res.json();
      if (res.ok) {
        if (data.finished) {
          setAnalysis(data.analysis || {});
          setLoading(false);
        } else {
          setCurrentQuestion(data.nextQuestion || null);
          setQuestionProgress({
            current: data.questionNumber || newConv.length + 1,
            total: data.totalQuestions || 8
          });
          setIsOptionalQuestion(data.isOptional || false);
          setLoading(false);
        }
      } else {
        setAnalysis({ error: true, message: data.message || "Failed to continue interactive flow" });
        setLoading(false);
      }
    } catch (err) {
      setAnalysis({ error: true, message: "Cannot connect to server. Please try again." });
      setLoading(false);
    }
  };

  // Skip function for optional question
  const skipQuestion = async () => {
    if (!isOptionalQuestion) return;
    
    const newConv = [...conversation, { question: currentQuestion, answer: "Skipped - no additional information" }];
    setConversation(newConv);
    setAnswerInput("");
    setCurrentQuestion(null);
    setIsOptionalQuestion(false);
    setLoading(true);

    try {
      const res = await fetch("/api/v1/ai/interactive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms, conversation: newConv }),
      });

      const data = await res.json();
      if (res.ok) {
        setAnalysis(data.analysis || {});
        setLoading(false);
      } else {
        setAnalysis({ error: true, message: data.message || "Failed to complete analysis" });
        setLoading(false);
      }
    } catch (err) {
      setAnalysis({ error: true, message: "Cannot connect to server. Please try again." });
      setLoading(false);
    }
  };

  // Speech recognition setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setRecognitionSupported(false);
      return;
    }

    setRecognitionSupported(true);
    const recog = new SpeechRecognition();
    recog.lang = selectedLanguage;
    recog.interimResults = true; // Enable interim results for real-time feedback
    recog.maxAlternatives = 1;
    recog.continuous = false; // Don't auto-restart to prevent glitching

    recog.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      // Show interim results in real-time
      if (interim) {
        setInterimTranscript(interim);
      }

      // Add final transcript to the appropriate field
      if (final) {
        if (recognizeMode === 'symptoms') {
          setSymptoms(prev => {
            const newText = prev ? prev + ' ' + final : final;
            return newText.trim();
          });
        } else if (recognizeMode === 'answer') {
          setAnswerInput(prev => {
            const newText = prev ? prev + ' ' + final : final;
            return newText.trim();
          });
        }
        setInterimTranscript('');
      }
    };

    recog.onerror = (e) => {
      console.error('Speech recognition error', e);
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        setIsRecording(false);
        setRecognizeMode(null);
        setInterimTranscript('');
        if (e.error === 'not-allowed') {
          alert('Microphone access denied. Please allow microphone permissions in browser settings.');
        }
      }
    };

    recog.onend = () => {
      // Simply clear the recording state when recognition ends
      setIsRecording(false);
      setRecognizeMode(null);
      setInterimTranscript('');
    };

    recognitionRef.current = recog;

    return () => {
      try { 
        if (recog) {
          recog.stop(); 
        }
      } catch (e) {}
      recognitionRef.current = null;
    };
  }, [selectedLanguage]);

  const startRecording = (mode) => {
    if (!recognitionRef.current || isRecording) return;
    
    setRecognizeMode(mode);
    setInterimTranscript('');
    setIsRecording(true);
    
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.log('Recognition start error:', e);
      setIsRecording(false);
      setRecognizeMode(null);
    }
  };

  const stopRecording = () => {
    if (!recognitionRef.current || !isRecording) return;
    
    // Save any remaining interim transcript before stopping
    if (interimTranscript.trim()) {
      if (recognizeMode === 'symptoms') {
        setSymptoms(prev => {
          const newText = prev ? prev + ' ' + interimTranscript : interimTranscript;
          return newText.trim();
        });
      } else if (recognizeMode === 'answer') {
        setAnswerInput(prev => {
          const newText = prev ? prev + ' ' + interimTranscript : interimTranscript;
          return newText.trim();
        });
      }
    }
    
    setInterimTranscript('');
    setIsRecording(false);
    setRecognizeMode(null);
    
    try { 
      recognitionRef.current.stop(); 
    } catch (e) {
      console.log('Recognition stop error:', e);
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
        <div className="survey-title">📋 Fill the Survey to Get Cared</div>
        <h2 className="checker-subtitle">🤖 AI-Powered Health Assistant</h2>
        <h1 className="checker-title">Smart Symptom Checker</h1>
        <p className="checker-description">
          Describe your symptoms and get instant AI analysis. We'll determine if you need 
          to see a doctor or if home remedies can help you feel better.
        </p>
        
        {/* Language Selector */}
        {recognitionSupported && (
          <div className="language-selector-wrapper">
            <label className="language-label">
              🌐 Select Language:
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              disabled={isRecording}
              className="language-select"
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="symptom-input-section">
        <textarea
          className="symptom-textarea"
          placeholder="Describe your symptoms in detail... 
          
For example: 'I have a fever of 101°F, sore throat, body aches, and feeling very weak since yesterday'"
          value={symptoms + (isRecording && recognizeMode === 'symptoms' && interimTranscript ? ' ' + interimTranscript : '')}
          onChange={(e) => setSymptoms(e.target.value)}
          disabled={loading}
          rows={6}
        />
        <div className="symptom-actions-row">
          <button
            className="analyze-btn"
            onClick={handleAnalyze}
            disabled={loading || !symptoms.trim()}
          >
            {loading ? "Analyzing..." : "🔍 Analyze Symptoms"}
          </button>

          {recognitionSupported ? (
            <>
              <button
                className={`voice-btn ${isRecording && recognizeMode === 'symptoms' ? 'recording' : ''}`}
                onClick={() => {
                  if (isRecording && recognizeMode === 'symptoms') {
                    stopRecording();
                  } else if (!isRecording) {
                    startRecording('symptoms');
                  }
                }}
                disabled={loading}
              >
                {isRecording && recognizeMode === 'symptoms' ? '⏹️ Stop Recording' : '🎙️ Use Voice Input'}
              </button>
              {isRecording && recognizeMode === 'symptoms' && (
                <span className="recording-indicator">
                  <span className="recording-pulse"></span>
                  🔴 Listening in {languages.find(l => l.code === selectedLanguage)?.label}...
                </span>
              )}
            </>
          ) : (
            <span className="unsupported-voice-notice">Voice input not supported in this browser</span>
          )}
        </div>

        {/* Show follow-up question area when present */}
        {currentQuestion && (
          <div className="follow-up-question">
            <div className="question-progress-header">
              <div className="question-number">
                Question {questionProgress.current} of {questionProgress.total}
                {isOptionalQuestion && <span className="optional-badge">Optional</span>}
              </div>
              <div className="progress-badge">
                {Math.round((questionProgress.current / questionProgress.total) * 100)}% Complete
              </div>
            </div>
            
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{width: `${(questionProgress.current / questionProgress.total) * 100}%`}}></div>
            </div>

            <div className="question-text">
              {isOptionalQuestion ? '💬' : '🩺'} {currentQuestion}
            </div>
            
            <div className="answer-input-wrapper">
              <div className="answer-input-row">
                <input
                  type="text"
                  value={answerInput + (isRecording && recognizeMode === 'answer' && interimTranscript ? ' ' + interimTranscript : '')}
                  placeholder={isOptionalQuestion ? "Optional - Type anything else you'd like to share..." : "Type your answer here or use voice..."}
                  onChange={(e) => setAnswerInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && submitAnswer()}
                  disabled={loading}
                  className="answer-input-field"
                />
                {recognitionSupported && (
                  <button
                    onClick={() => {
                      if (isRecording && recognizeMode === 'answer') {
                        stopRecording();
                      } else if (!isRecording) {
                        startRecording('answer');
                      }
                    }}
                    disabled={loading}
                    className={`answer-voice-btn ${isRecording && recognizeMode === 'answer' ? 'recording' : ''}`}
                  >
                    {isRecording && recognizeMode === 'answer' ? '⏹️ Stop' : '🎙️ Voice'}
                  </button>
                )}
                {isOptionalQuestion ? (
                  <>
                    <button 
                      onClick={submitAnswer} 
                      disabled={loading || !answerInput.trim()}
                      className="answer-submit-btn"
                    >
                      {loading ? '⏳' : '✓ Submit'}
                    </button>
                    <button 
                      onClick={skipQuestion} 
                      disabled={loading}
                      className="skip-btn"
                    >
                      ⏭️ Skip
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={submitAnswer} 
                    disabled={loading || !answerInput.trim()}
                    className="answer-submit-btn"
                  >
                    {loading ? '⏳' : '✓ Submit'}
                  </button>
                )}
              </div>
              
              {isRecording && recognizeMode === 'answer' && (
                <div className="answer-recording-indicator">
                  <span className="answer-recording-pulse"></span>
                  Recording... Speak clearly into your microphone
                </div>
              )}

              {conversation.length > 0 && (
                <div className="conversation-counter">
                  💬 Previous answers recorded: {conversation.length}
                </div>
              )}
            </div>
          </div>
        )}
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
                      <h3>Home Remedies Can Help</h3>
                    </div>
                    <div className="remedies-info">
                      <p className="remedies-description">
                        Your symptoms appear to be mild and can be treated with home remedies. 
                        Click below to explore our comprehensive home remedies section for natural 
                        treatments and wellness tips.
                      </p>
                    </div>
                    <div className="action-buttons-group">
                      <button className="view-remedies-btn" onClick={() => navigate('/user/dashboard/ai-recommanded')}>
                        🌿 View Home Remedies
                      </button>
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
