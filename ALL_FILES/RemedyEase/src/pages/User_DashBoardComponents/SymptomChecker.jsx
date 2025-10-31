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
  const currentModeRef = useRef(null); // Track current mode to prevent state issues
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

  // Translations for UI
  const translations = {
    'en-US': {
      surveyTitle: '📋 Fill the Survey to Get Cared',
      subtitle: '🤖 AI-Powered Health Assistant',
      title: 'Smart Symptom Checker',
      description: 'Describe your symptoms and get instant AI analysis. We\'ll determine if you need to see a doctor or if home remedies can help you feel better.',
      languageLabel: '🌐 Select Language:',
      placeholder: 'Describe your symptoms in detail...\n\nFor example: \'I have a fever of 101°F, sore throat, body aches, and feeling very weak since yesterday\'',
      analyzeBtn: '🔍 Analyze Symptoms',
      analyzing: 'Analyzing...',
      voiceBtn: '🎙️ Use Voice Input',
      stopRecording: '⏹️ Stop Recording',
      listening: 'Listening in',
      speakTip: '💡 Tip: Speak clearly, reduce background noise',
      voiceNotAvailable: '🎤 Voice input not available',
      httpsRequired: 'Requires HTTPS connection',
      browserNotSupported: 'Not supported in this browser. Try Chrome or Edge.',
      tipsTitle: '🎯 For Best Voice Recognition Results:',
      tip1: 'Use a quiet environment or close to microphone',
      tip2: 'Speak clearly and at a moderate pace',
      tip3: 'Use Chrome or Edge browser (best support)',
      tip4: 'Ensure stable internet connection',
      tip5: 'Grant microphone permissions when prompted',
      questionOf: 'Question',
      of: 'of',
      optional: 'Optional',
      complete: 'Complete',
      typeAnswer: 'Type your answer here or use voice...',
      typeOptional: 'Optional - Type anything else you\'d like to share...',
      submit: '✓ Submit',
      skip: '⏭️ Skip',
      previousAnswers: '💬 Previous answers recorded:',
      analyzing: 'Analyzing your health...',
      saveAnalysis: '💾 Save Analysis',
      newAnalysis: '🔄 New Analysis',
      bookAppointment: '📅 Book Appointment Now',
      viewDoctors: '👥 View Available Doctors',
      viewRemedies: '🌿 View Home Remedies',
      readyTitle: 'Ready to Help',
      readyDesc: 'Describe your symptoms above to get started with AI-powered health analysis',
      card1Title: 'Accurate Analysis',
      card1Desc: 'AI-powered symptom evaluation with medical database',
      card2Title: 'Instant Results',
      card2Desc: 'Get immediate recommendations for your health concerns',
      card3Title: 'Private & Secure',
      card3Desc: 'Your health information is kept confidential',
    },
    'hi-IN': {
      surveyTitle: '📋 देखभाल पाने के लिए सर्वेक्षण भरें',
      subtitle: '🤖 AI-संचालित स्वास्थ्य सहायक',
      title: 'स्मार्ट लक्षण जांचकर्ता',
      description: 'अपने लक्षणों का वर्णन करें और तुरंत AI विश्लेषण प्राप्त करें। हम निर्धारित करेंगे कि आपको डॉक्टर को दिखाने की आवश्यकता है या घरेलू उपचार मदद कर सकते हैं।',
      languageLabel: '🌐 भाषा चुनें:',
      placeholder: 'अपने लक्षणों का विस्तार से वर्णन करें...\n\nउदाहरण के लिए: \'मुझे 101°F बुखार है, गले में खराश, शरीर में दर्द, और कल से बहुत कमजोर महसूस कर रहा हूं\'',
      analyzeBtn: '🔍 लक्षणों का विश्लेषण करें',
      analyzing: 'विश्लेषण हो रहा है...',
      voiceBtn: '🎙️ वॉइस इनपुट का उपयोग करें',
      stopRecording: '⏹️ रिकॉर्डिंग बंद करें',
      listening: 'सुन रहा है',
      speakTip: '💡 टिप: स्पष्ट बोलें, पृष्ठभूमि शोर कम करें',
      voiceNotAvailable: '🎤 वॉइस इनपुट उपलब्ध नहीं है',
      httpsRequired: 'HTTPS कनेक्शन की आवश्यकता है',
      browserNotSupported: 'इस ब्राउज़र में समर्थित नहीं है। Chrome या Edge आज़माएं।',
      tipsTitle: '🎯 सर्वोत्तम वॉइस पहचान परिणामों के लिए:',
      tip1: 'शांत वातावरण का उपयोग करें या माइक्रोफोन के पास रहें',
      tip2: 'स्पष्ट और मध्यम गति से बोलें',
      tip3: 'Chrome या Edge ब्राउज़र का उपयोग करें (सर्वोत्तम समर्थन)',
      tip4: 'स्थिर इंटरनेट कनेक्शन सुनिश्चित करें',
      tip5: 'संकेत मिलने पर माइक्रोफोन अनुमतियां दें',
      questionOf: 'प्रश्न',
      of: 'का',
      optional: 'वैकल्पिक',
      complete: 'पूर्ण',
      typeAnswer: 'अपना उत्तर यहां टाइप करें या वॉइस का उपयोग करें...',
      typeOptional: 'वैकल्पिक - आप जो कुछ भी साझा करना चाहते हैं वह टाइप करें...',
      submit: '✓ जमा करें',
      skip: '⏭️ छोड़ें',
      previousAnswers: '💬 पिछले उत्तर रिकॉर्ड किए गए:',
      analyzing: 'आपके स्वास्थ्य का विश्लेषण कर रहे हैं...',
      saveAnalysis: '💾 विश्लेषण सहेजें',
      newAnalysis: '🔄 नया विश्लेषण',
      bookAppointment: '📅 अभी अपॉइंटमेंट बुक करें',
      viewDoctors: '👥 उपलब्ध डॉक्टर देखें',
      viewRemedies: '🌿 घरेलू उपचार देखें',
      readyTitle: 'मदद के लिए तैयार',
      readyDesc: 'AI-संचालित स्वास्थ्य विश्लेषण शुरू करने के लिए ऊपर अपने लक्षणों का वर्णन करें',
      card1Title: 'सटीक विश्लेषण',
      card1Desc: 'चिकित्सा डेटाबेस के साथ AI-संचालित लक्षण मूल्यांकन',
      card2Title: 'तत्काल परिणाम',
      card2Desc: 'अपनी स्वास्थ्य चिंताओं के लिए तत्काल सिफारिशें प्राप्त करें',
      card3Title: 'निजी और सुरक्षित',
      card3Desc: 'आपकी स्वास्थ्य जानकारी गोपनीय रखी जाती है',
    },
    'es-ES': {
      surveyTitle: '📋 Complete la encuesta para recibir atención',
      subtitle: '🤖 Asistente de salud impulsado por IA',
      title: 'Verificador inteligente de síntomas',
      description: 'Describa sus síntomas y obtenga un análisis instantáneo de IA. Determinaremos si necesita ver a un médico o si los remedios caseros pueden ayudarlo a sentirse mejor.',
      languageLabel: '🌐 Seleccionar idioma:',
      placeholder: 'Describa sus síntomas en detalle...\n\nPor ejemplo: \'Tengo fiebre de 101°F, dolor de garganta, dolores corporales y me siento muy débil desde ayer\'',
      analyzeBtn: '🔍 Analizar síntomas',
      analyzing: 'Analizando...',
      voiceBtn: '🎙️ Usar entrada de voz',
      stopRecording: '⏹️ Detener grabación',
      listening: 'Escuchando en',
      speakTip: '💡 Consejo: Hable claramente, reduzca el ruido de fondo',
      voiceNotAvailable: '🎤 Entrada de voz no disponible',
      httpsRequired: 'Requiere conexión HTTPS',
      browserNotSupported: 'No compatible con este navegador. Pruebe Chrome o Edge.',
      tipsTitle: '🎯 Para mejores resultados de reconocimiento de voz:',
      tip1: 'Use un ambiente tranquilo o cerca del micrófono',
      tip2: 'Hable claramente y a un ritmo moderado',
      tip3: 'Use el navegador Chrome o Edge (mejor soporte)',
      tip4: 'Asegure una conexión a Internet estable',
      tip5: 'Otorgue permisos de micrófono cuando se solicite',
      questionOf: 'Pregunta',
      of: 'de',
      optional: 'Opcional',
      complete: 'Completo',
      typeAnswer: 'Escriba su respuesta aquí o use voz...',
      typeOptional: 'Opcional - Escriba cualquier otra cosa que desee compartir...',
      submit: '✓ Enviar',
      skip: '⏭️ Omitir',
      previousAnswers: '💬 Respuestas anteriores registradas:',
      analyzing: 'Analizando su salud...',
      saveAnalysis: '💾 Guardar análisis',
      newAnalysis: '🔄 Nuevo análisis',
      bookAppointment: '📅 Reservar cita ahora',
      viewDoctors: '👥 Ver médicos disponibles',
      viewRemedies: '🌿 Ver remedios caseros',
      readyTitle: 'Listo para ayudar',
      readyDesc: 'Describa sus síntomas arriba para comenzar con el análisis de salud impulsado por IA',
      card1Title: 'Análisis preciso',
      card1Desc: 'Evaluación de síntomas impulsada por IA con base de datos médica',
      card2Title: 'Resultados instantáneos',
      card2Desc: 'Obtenga recomendaciones inmediatas para sus preocupaciones de salud',
      card3Title: 'Privado y seguro',
      card3Desc: 'Su información de salud se mantiene confidencial',
    },
  };

  // Get translation based on selected language
  const getTranslation = (key) => {
    const langCode = selectedLanguage.split('-')[0] + '-' + selectedLanguage.split('-')[1];
    return translations[langCode]?.[key] || translations['en-US'][key];
  };

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
        body: JSON.stringify({ 
          symptoms, 
          conversation: [],
          language: selectedLanguage 
        }),
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
        body: JSON.stringify({ 
          symptoms, 
          conversation: newConv,
          language: selectedLanguage 
        }),
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
        body: JSON.stringify({ 
          symptoms, 
          conversation: newConv,
          language: selectedLanguage 
        }),
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
      const mode = currentModeRef.current;
      if (!mode) return;

      let interimText = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;
        
        if (event.results[i].isFinal) {
          console.log('Final speech (confidence:', confidence, '):', transcript);
          finalText += transcript;
        } else {
          interimText += transcript;
        }
      }

      // Update interim display for visual feedback
      if (interimText) {
        setInterimTranscript(interimText);
      }

      // Immediately save final transcript to the field
      if (finalText) {
        const trimmedFinal = finalText.trim();
        if (trimmedFinal) {
          console.log('💾 Saving final text to', mode, ':', trimmedFinal);
          
          if (mode === 'symptoms') {
            setSymptoms(prev => {
              const newText = prev ? `${prev} ${trimmedFinal}` : trimmedFinal;
              console.log('Updated symptoms:', newText);
              return newText.trim();
            });
          } else if (mode === 'answer') {
            setAnswerInput(prev => {
              const newText = prev ? `${prev} ${trimmedFinal}` : trimmedFinal;
              console.log('Updated answer:', newText);
              return newText.trim();
            });
          }
        }
        // Clear interim after final is saved
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
      console.log('🔴 Recognition ended, isRecording:', isRecording, 'mode:', currentModeRef.current);
      
      // CRITICAL: Save any remaining interim text before doing anything else
      const remainingInterim = interimTranscript.trim();
      const mode = currentModeRef.current;
      
      if (remainingInterim && mode) {
        console.log('💾 Saving remaining interim on end:', remainingInterim);
        
        if (mode === 'symptoms') {
          setSymptoms(prev => {
            const newText = prev ? `${prev} ${remainingInterim}` : remainingInterim;
            return newText.trim();
          });
        } else if (mode === 'answer') {
          setAnswerInput(prev => {
            const newText = prev ? `${prev} ${remainingInterim}` : remainingInterim;
            return newText.trim();
          });
        }
      }
      
      // Clear interim display
      setInterimTranscript('');
      
      // Auto-restart if still in recording mode
      if (isRecording && mode) {
        console.log('🔄 Auto-restarting recognition...');
        setTimeout(() => {
          if (recognitionRef.current && isRecording && currentModeRef.current) {
            try {
              recognitionRef.current.start();
              console.log('✅ Recognition restarted');
            } catch (e) {
              console.log('⚠️ Could not restart:', e.message);
              // If it fails to restart, it's probably already running or stopped by user
            }
          }
        }, 100);
      } else {
        console.log('⏹️ Not restarting - recording stopped');
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
      currentModeRef.current = null;
    };
  }, [selectedLanguage, recognizeMode]);

  const startRecording = (mode) => {
    if (!recognitionRef.current || isRecording) return;
    
    console.log('Starting recording in mode:', mode);
    
    // Request microphone permission explicitly
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => {
          setRecognizeMode(mode);
          currentModeRef.current = mode; // Set ref immediately
          setInterimTranscript('');
          setIsRecording(true);
          
          try {
            recognitionRef.current.lang = selectedLanguage; // Update language before starting
            recognitionRef.current.start();
          } catch (e) {
            console.log('Recognition start error:', e);
            setIsRecording(false);
            setRecognizeMode(null);
            currentModeRef.current = null;
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
      currentModeRef.current = mode;
      setInterimTranscript('');
      setIsRecording(true);
      
      try {
        recognitionRef.current.lang = selectedLanguage;
        recognitionRef.current.start();
      } catch (e) {
        console.log('Recognition start error:', e);
        setIsRecording(false);
        setRecognizeMode(null);
        currentModeRef.current = null;
      }
    }
  };

  const stopRecording = () => {
    if (!recognitionRef.current) return;
    
    console.log('🛑 Manually stopping recording...');
    
    const mode = currentModeRef.current;
    const remainingInterim = interimTranscript.trim();
    
    // CRITICAL: Save any remaining interim text FIRST before changing any state
    if (remainingInterim && mode) {
      console.log('💾 Saving interim on manual stop:', remainingInterim);
      
      if (mode === 'symptoms') {
        setSymptoms(prev => {
          const newText = prev ? `${prev} ${remainingInterim}` : remainingInterim;
          return newText.trim();
        });
      } else if (mode === 'answer') {
        setAnswerInput(prev => {
          const newText = prev ? `${prev} ${remainingInterim}` : remainingInterim;
          return newText.trim();
        });
      }
    }
    
    // Clear interim display
    setInterimTranscript('');
    
    // THEN update states to stop recording (order matters!)
    setIsRecording(false);
    setRecognizeMode(null);
    currentModeRef.current = null;
    
    // Finally stop the recognition
    setTimeout(() => {
      try { 
        if (recognitionRef.current) {
          recognitionRef.current.stop();
          console.log('✅ Recognition stopped successfully');
        }
      } catch (e) {
        console.log('⚠️ Recognition stop error:', e.message);
      }
    }, 50);
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
        <div className="survey-title">{getTranslation('surveyTitle')}</div>
        <h2 className="checker-subtitle">{getTranslation('subtitle')}</h2>
        <h1 className="checker-title">{getTranslation('title')}</h1>
        <p className="checker-description">
          {getTranslation('description')}
        </p>
        
        {/* Language Selector */}
        {recognitionSupported && (
          <div className="language-selector-wrapper">
            <label className="language-label">
              {getTranslation('languageLabel')}
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
        <div style={{ position: 'relative' }}>
          <textarea
            className="symptom-textarea"
            placeholder={getTranslation('placeholder')}
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            disabled={loading}
            rows={6}
          />
          {isRecording && recognizeMode === 'symptoms' && interimTranscript && (
            <div style={{
              position: 'absolute',
              bottom: '8px',
              right: '8px',
              background: 'rgba(102, 126, 234, 0.1)',
              border: '1px solid rgba(102, 126, 234, 0.3)',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '0.9em',
              color: '#667eea',
              fontStyle: 'italic',
              maxWidth: '200px',
              pointerEvents: 'none'
            }}>
              🎤 "{interimTranscript}"...
            </div>
          )}
        </div>
        <div className="symptom-actions-row">
          <button
            className="analyze-btn"
            onClick={handleAnalyze}
            disabled={loading || !symptoms.trim()}
          >
            {loading ? getTranslation('analyzing') : getTranslation('analyzeBtn')}
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
                {isRecording && recognizeMode === 'symptoms' ? getTranslation('stopRecording') : getTranslation('voiceBtn')}
              </button>
              {isRecording && recognizeMode === 'symptoms' && (
                <span className="recording-indicator">
                  <span className="recording-pulse"></span>
                  🔴 {getTranslation('listening')} {languages.find(l => l.code === selectedLanguage)?.label}...
                  <span style={{display: 'block', fontSize: '0.85em', marginTop: '4px', opacity: '0.9'}}>
                    {getTranslation('speakTip')}
                  </span>
                </span>
              )}
            </>
          ) : (
            <div className="unsupported-voice-notice">
              <span style={{display: 'block', marginBottom: '5px'}}>{getTranslation('voiceNotAvailable')}</span>
              <span style={{fontSize: '0.85em', opacity: '0.8'}}>
                {window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' 
                  ? getTranslation('httpsRequired')
                  : getTranslation('browserNotSupported')}
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
              {getTranslation('tipsTitle')}
            </div>
            <ul style={{margin: '0', paddingLeft: '20px', lineHeight: '1.6'}}>
              <li>{getTranslation('tip1')}</li>
              <li>{getTranslation('tip2')}</li>
              <li>{getTranslation('tip3')}</li>
              <li>{getTranslation('tip4')}</li>
              <li>{getTranslation('tip5')}</li>
            </ul>
          </div>
        )}

        {/* Show follow-up question area when present */}
        {currentQuestion && (
          <div className="follow-up-question">
            <div className="question-progress-header">
              <div className="question-number">
                {getTranslation('questionOf')} {questionProgress.current} {getTranslation('of')} {questionProgress.total}
                {isOptionalQuestion && <span className="optional-badge">{getTranslation('optional')}</span>}
              </div>
              <div className="progress-badge">
                {Math.round((questionProgress.current / questionProgress.total) * 100)}% {getTranslation('complete')}
              </div>
            </div>
            
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{width: `${(questionProgress.current / questionProgress.total) * 100}%`}}></div>
            </div>

            <div className="question-text">
              {isOptionalQuestion ? '💬' : '🩺'} {currentQuestion}
            </div>
            
            <div className="answer-input-wrapper">
              <div className="answer-input-row" style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={answerInput}
                  placeholder={isOptionalQuestion ? getTranslation('typeOptional') : getTranslation('typeAnswer')}
                  onChange={(e) => setAnswerInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && submitAnswer()}
                  disabled={loading}
                  className="answer-input-field"
                />
                {isRecording && recognizeMode === 'answer' && interimTranscript && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    right: '100px',
                    transform: 'translateY(-50%)',
                    background: 'rgba(102, 126, 234, 0.1)',
                    border: '1px solid rgba(102, 126, 234, 0.3)',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '0.85em',
                    color: '#667eea',
                    fontStyle: 'italic',
                    pointerEvents: 'none',
                    whiteSpace: 'nowrap',
                    maxWidth: '150px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    🎤 "{interimTranscript}"
                  </div>
                )}
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
                    {isRecording && recognizeMode === 'answer' ? '⏹️' : '🎙️'}
                  </button>
                )}
                {isOptionalQuestion ? (
                  <>
                    <button 
                      onClick={submitAnswer} 
                      disabled={loading || !answerInput.trim()}
                      className="answer-submit-btn"
                    >
                      {loading ? '⏳' : getTranslation('submit')}
                    </button>
                    <button 
                      onClick={skipQuestion} 
                      disabled={loading}
                      className="skip-btn"
                    >
                      {getTranslation('skip')}
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={submitAnswer} 
                    disabled={loading || !answerInput.trim()}
                    className="answer-submit-btn"
                  >
                    {loading ? '⏳' : getTranslation('submit')}
                  </button>
                )}
              </div>
              
              {isRecording && recognizeMode === 'answer' && (
                <div className="answer-recording-indicator">
                  <span className="answer-recording-pulse"></span>
                  {getTranslation('listening')}... {getTranslation('speakTip')}
                </div>
              )}

              {conversation.length > 0 && (
                <div className="conversation-counter">
                  {getTranslation('previousAnswers')} {conversation.length}
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
            <p className="loading-text">{getTranslation('analyzing')}</p>
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
                        {getTranslation('bookAppointment')}
                      </button>
                      <button className="view-doctors-btn" onClick={handleViewDoctors}>
                        {getTranslation('viewDoctors')}
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
                        {getTranslation('viewRemedies')}
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
                    {getTranslation('saveAnalysis')}
                  </button>
                  <button className="new-analysis-btn" onClick={() => {
                    setSymptoms("");
                    setAnalysis(null);
                  }}>
                    {getTranslation('newAnalysis')}
                  </button>
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🩺</div>
            <h3>{getTranslation('readyTitle')}</h3>
            <p>{getTranslation('readyDesc')}</p>
          </div>
        )}
      </div>

      <div className="info-cards">
        <div className="info-card">
          <div className="card-icon">🎯</div>
          <h4>{getTranslation('card1Title')}</h4>
          <p>{getTranslation('card1Desc')}</p>
        </div>
        <div className="info-card">
          <div className="card-icon">⚡</div>
          <h4>{getTranslation('card2Title')}</h4>
          <p>{getTranslation('card2Desc')}</p>
        </div>
        <div className="info-card">
          <div className="card-icon">🔒</div>
          <h4>{getTranslation('card3Title')}</h4>
          <p>{getTranslation('card3Desc')}</p>
        </div>
      </div>
    </div>
  );
}
