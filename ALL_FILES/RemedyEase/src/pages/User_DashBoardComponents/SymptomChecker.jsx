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
    // Check for HTTPS in production
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname === '';
    
    const isSecure = window.location.protocol === 'https:' || isLocalhost;
    
    if (!isSecure) {
      console.warn('⚠️ Microphone requires HTTPS connection');
      setRecognitionSupported(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('⚠️ Speech Recognition not supported in this browser');
      setRecognitionSupported(false);
      return;
    }

    setRecognitionSupported(true);
    const recog = new SpeechRecognition();
    recog.lang = selectedLanguage;
    recog.interimResults = true; // Enable interim results for real-time feedback
    recog.maxAlternatives = 3; // Get multiple alternatives for better accuracy
    recog.continuous = true; // Keep listening continuously
    
    // These settings help with noise handling
    if ('webkitSpeechRecognition' in window) {
      // Chrome-specific optimizations
      recog.continuous = true;
      recog.interimResults = true;
    }

    recog.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;
        
        // Log confidence for debugging
        if (event.results[i].isFinal) {
          console.log('Speech confidence:', confidence);
        }
        
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

      // Add final transcript to the appropriate field immediately
      if (final) {
        const trimmedFinal = final.trim();
        if (trimmedFinal) {
          if (recognizeMode === 'symptoms') {
            setSymptoms(prev => {
              const newText = prev ? prev + ' ' + trimmedFinal : trimmedFinal;
              return newText.trim();
            });
          } else if (recognizeMode === 'answer') {
            setAnswerInput(prev => {
              const newText = prev ? prev + ' ' + trimmedFinal : trimmedFinal;
              return newText.trim();
            });
          }
        }
        // Clear interim after saving final
        setInterimTranscript('');
      }
    };

    recog.onerror = (e) => {
      console.error('Speech recognition error:', e.error, e.message);
      
      if (e.error === 'not-allowed' || e.error === 'permission-denied') {
        alert('🎤 Microphone access denied.\n\nPlease:\n1. Click the 🔒 lock icon in your browser address bar\n2. Allow microphone permissions\n3. Refresh the page and try again');
        setIsRecording(false);
        setRecognizeMode(null);
        setInterimTranscript('');
      } else if (e.error === 'no-speech') {
        console.log('No speech detected, continuing to listen...');
        // Don't stop recording, just continue listening
      } else if (e.error === 'network') {
        alert('Network error. Please check your internet connection.');
        setIsRecording(false);
        setRecognizeMode(null);
        setInterimTranscript('');
      } else if (e.error === 'aborted') {
        // Ignore aborted errors - normal when stopping
      } else {
        console.log('Speech recognition error:', e.error);
      }
    };

    recog.onend = () => {
      // Auto-restart if still in recording mode (handles interruptions)
      if (isRecording && recognizeMode) {
        console.log('Recognition ended, restarting...');
        try {
          setTimeout(() => {
            if (recognitionRef.current && isRecording) {
              recognitionRef.current.start();
            }
          }, 100);
        } catch (e) {
          console.log('Failed to restart recognition:', e);
        }
      }
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
  }, [selectedLanguage, recognizeMode]);

  const startRecording = (mode) => {
    if (!recognitionRef.current || isRecording) return;
    
    // Request microphone permission explicitly
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => {
          setRecognizeMode(mode);
          setInterimTranscript('');
          setIsRecording(true);
          
          try {
            recognitionRef.current.lang = selectedLanguage; // Update language before starting
            recognitionRef.current.start();
          } catch (e) {
            console.log('Recognition start error:', e);
            setIsRecording(false);
            setRecognizeMode(null);
            if (e.name === 'InvalidStateError') {
              // Recognition already started, stop and restart
              recognitionRef.current.stop();
              setTimeout(() => {
                try {
                  recognitionRef.current.start();
                } catch (err) {
                  console.error('Failed to restart recognition:', err);
                }
              }, 100);
            }
          }
        })
        .catch((err) => {
          console.error('Microphone permission error:', err);
          alert('🎤 Unable to access microphone.\n\nPlease:\n1. Check browser permissions\n2. Ensure you\'re using HTTPS\n3. Allow microphone access when prompted');
        });
    } else {
      // Fallback for browsers without getUserMedia
      setRecognizeMode(mode);
      setInterimTranscript('');
      setIsRecording(true);
      
      try {
        recognitionRef.current.lang = selectedLanguage;
        recognitionRef.current.start();
      } catch (e) {
        console.log('Recognition start error:', e);
        setIsRecording(false);
        setRecognizeMode(null);
      }
    }
  };

  const stopRecording = () => {
    if (!recognitionRef.current || !isRecording) return;
    
    // Save any remaining interim transcript FIRST
    const currentInterim = interimTranscript.trim();
    if (currentInterim) {
      if (recognizeMode === 'symptoms') {
        setSymptoms(prev => {
          const newText = prev ? prev + ' ' + currentInterim : currentInterim;
          return newText.trim();
        });
      } else if (recognizeMode === 'answer') {
        setAnswerInput(prev => {
          const newText = prev ? prev + ' ' + currentInterim : currentInterim;
          return newText.trim();
        });
      }
    }
    
    // Clear interim transcript
    setInterimTranscript('');
    
    // Stop recognition
    try { 
      recognitionRef.current.stop(); 
    } catch (e) {
      console.log('Recognition stop error:', e);
    }
    
    // Update states
    setIsRecording(false);
    setRecognizeMode(null);
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
                  <span style={{display: 'block', fontSize: '0.85em', marginTop: '4px', opacity: '0.9'}}>
                    💡 Tip: Speak clearly, reduce background noise
                  </span>
                </span>
              )}
            </>
          ) : (
            <div className="unsupported-voice-notice">
              <span style={{display: 'block', marginBottom: '5px'}}>🎤 Voice input not available</span>
              <span style={{fontSize: '0.85em', opacity: '0.8'}}>
                {window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' 
                  ? 'Requires HTTPS connection' 
                  : 'Not supported in this browser. Try Chrome or Edge.'}
              </span>
            </div>
          )}
        </div>

        {/* Voice Recording Tips */}
        {recognitionSupported && (
          <div style={{
            marginTop: '12px', 
            padding: '12px', 
            background: 'linear-gradient(135deg, #667eea22 0%, #764ba222 100%)',
            borderRadius: '8px',
            fontSize: '0.9em',
            border: '1px solid #667eea33'
          }}>
            <div style={{fontWeight: '600', marginBottom: '6px', color: '#667eea'}}>
              🎯 For Best Voice Recognition Results:
            </div>
            <ul style={{margin: '0', paddingLeft: '20px', lineHeight: '1.6'}}>
              <li>Use a quiet environment or close to microphone</li>
              <li>Speak clearly and at a moderate pace</li>
              <li>Use Chrome or Edge browser (best support)</li>
              <li>Ensure stable internet connection</li>
              <li>Grant microphone permissions when prompted</li>
            </ul>
          </div>
        )}

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
