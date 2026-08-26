import axios from "axios";

/* ─── Helpers ─── */

// Strip HTML tags and limit length
function sanitize(text, maxLen = 2000) {
  if (!text || typeof text !== "string") return "";
  return text.replace(/<[^>]*>/g, "").trim().slice(0, maxLen);
}

// Language mapping (expanded with Indian languages)
const LANGUAGE_NAMES = {
  "en-US": "English",
  "en-GB": "English",
  "hi-IN": "Hindi",
  "pa-IN": "Punjabi",
  "bn-IN": "Bengali",
  "mr-IN": "Marathi",
  "ta-IN": "Tamil",
  "te-IN": "Telugu",
  "gu-IN": "Gujarati",
  "kn-IN": "Kannada",
  "ml-IN": "Malayalam",
  "ur-IN": "Urdu",
  "es-ES": "Spanish",
  "fr-FR": "French",
  "de-DE": "German",
  "pt-BR": "Portuguese",
  "zh-CN": "Chinese",
  "ja-JP": "Japanese",
  "ar-SA": "Arabic",
};

// Axios defaults — 30s timeout
const API_TIMEOUT = 30000;

function getGroqHeaders() {
  const apiKey = (
    process.env.GROQ_API_KEY ||
    process.env.GROQ_APIKEY ||
    process.env.GROQ_KEY ||
    process.env.GROQ_API_TOKEN ||
    process.env.GROQ
  )?.trim();

  if (!apiKey) return null;
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

// Simple in-memory duplicate request guard (per IP/symptoms hash)
const recentRequests = new Map();
const DEDUP_WINDOW_MS = 2000;

function isDuplicate(key) {
  const now = Date.now();
  const last = recentRequests.get(key);
  if (last && now - last < DEDUP_WINDOW_MS) return true;
  recentRequests.set(key, now);
  // Cleanup old entries periodically
  if (recentRequests.size > 500) {
    for (const [k, v] of recentRequests) {
      if (now - v > 10000) recentRequests.delete(k);
    }
  }
  return false;
}

/* ─── Emergency & Red-Flag Symptom Screener ─── */
const EMERGENCY_PATTERNS = [
  /\b(chest pain|heart attack|angina|pressure in chest|crushing pain)\b/i,
  /\b(shortness of breath|difficulty breathing|cannot breathe|suffocating|stridor|gasping for air)\b/i,
  /\b(stroke|facial droop|arm weakness|slurred speech|sudden paralysis|sudden numbness)\b/i,
  /\b(severe bleeding|uncontrolled bleeding|coughing blood|vomiting blood|heavy blood loss)\b/i,
  /\b(unconscious|loss of consciousness|passed out|fainting|blackout|seizure|convulsions)\b/i,
  /\b(anaphylaxis|swollen throat|throat closing|tongue swelling|severe allergic reaction)\b/i,
  /\b(sudden blindness|sudden vision loss|severe trauma|head injury)\b/i,
  /\b(poisoning|overdose|swallowed chemicals|toxic ingestion)\b/i,
  /\b(suicide|self harm|end my life)\b/i,
];

function checkEmergencySymptom(text) {
  for (const pattern of EMERGENCY_PATTERNS) {
    if (pattern.test(text)) return true;
  }
  return false;
}

/* ─── getAIRecommendation (Enhanced with Medical Safety & Structured JSON) ─── */
export const getAIRecommendation = async (req, res) => {
  const rawSymptoms = req.body?.symptoms;
  const rawLanguage = req.body?.language || req.body?.lang || "en-US";
  const userProfile = req.body?.userProfile || {};
  const symptoms = sanitize(rawSymptoms, 1000);

  if (!symptoms || symptoms.length === 0) {
    return res.status(400).json({ error: "Please describe your symptoms to receive recommendations." });
  }

  const targetLangName = LANGUAGE_NAMES[rawLanguage] || LANGUAGE_NAMES["en-US"] || "English";

  // 1. Immediate Emergency Detection
  if (checkEmergencySymptom(symptoms)) {
    console.log(`[AI SAFETY] Emergency detected for input: "${symptoms.slice(0, 60)}..."`);
    const emergencyResponse = {
      summary: "Based on the symptoms described, urgent professional medical evaluation is required. Home remedies are not appropriate.",
      severity: "emergency",
      isEmergency: true,
      remedies: [],
      selfCare: [
        "Seek emergency medical care immediately or call your local emergency services (e.g. 108 / 112 / 911).",
        "Stay calm and sit in a comfortable, safe resting position.",
        "Have a family member, friend, or caregiver stay with you while arranging immediate care."
      ],
      avoid: [
        "Do NOT attempt home remedies or delay professional medical evaluation.",
        "Do NOT drive yourself to the hospital if experiencing chest pain, dizziness, or shortness of breath."
      ],
      warningSigns: [
        "Chest pain radiating to arm, back, neck, or jaw",
        "Severe difficulty breathing or blue lips",
        "Sudden numbness, weakness, or difficulty speaking",
        "Loss of consciousness or severe confusion"
      ],
      whenToSeeDoctor: "Seek emergency medical attention or visit the nearest emergency department immediately.",
      recommendation: "⚠️ EMERGENCY WARNING: Based on the symptoms described, home remedies are not safe or appropriate. Please seek immediate professional medical attention or call emergency services."
    };

    return res.status(200).json({
      success: true,
      data: emergencyResponse,
      recommendation: emergencyResponse.recommendation
    });
  }

  const headers = getGroqHeaders();
  if (!headers) {
    return res.status(503).json({ error: "AI service is temporarily unavailable." });
  }

  // Profile safety context (e.g. allergies)
  let profileSafetyNotes = "";
  if (userProfile?.allergies && userProfile.allergies.trim()) {
    profileSafetyNotes += `\nPatient Known Allergies: ${sanitize(userProfile.allergies, 200)}. DO NOT recommend anything containing these allergens.`;
  }

  const systemPrompt = `You are RemedyEase Clinical AI, a healthcare assistant specializing in safe, non-invasive home remedies and self-care for mild, everyday symptoms.
Respond ENTIRELY in ${targetLangName}.
${profileSafetyNotes}

SAFETY RULES:
1. Only recommend safe, gentle, non-prescription home remedies (hydration, honey, ginger, salt water gargle, steam, chamomile, rest).
2. Clearly specify how to prepare and use each remedy safely.
3. List contraindications (e.g. "Do not give honey to infants under 1 year").
4. List clear warning signs indicating when to consult a doctor.
5. You MUST return ONLY a valid JSON object with the following schema:
{
  "summary": "1-2 sentence empathetic summary in ${targetLangName}",
  "severity": "mild" or "moderate",
  "isEmergency": false,
  "remedies": [
    {
      "title": "Remedy title in ${targetLangName}",
      "description": "Why it helps in ${targetLangName}",
      "howToUse": "Instructions and frequency in ${targetLangName}",
      "caution": "Precaution or contraindication in ${targetLangName}"
    }
  ],
  "selfCare": ["Self care tip 1", "Tip 2", "Tip 3"],
  "avoid": ["Avoid item 1", "Avoid item 2"],
  "warningSigns": ["Red flag sign 1", "Red flag sign 2"],
  "whenToSeeDoctor": "Advice on when to see a doctor in ${targetLangName}"
}`;

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Patient symptoms: ${symptoms}` },
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.3,
        response_format: { type: "json_object" },
      },
      { headers, timeout: API_TIMEOUT }
    );

    const rawContent = response.data.choices[0]?.message?.content || "{}";
    let parsedData;

    try {
      parsedData = JSON.parse(rawContent);
    } catch {
      // Clean markdown code blocks if any
      const cleaned = rawContent.replace(/```json/gi, "").replace(/```/g, "").trim();
      parsedData = JSON.parse(cleaned);
    }

    // Validate and structure fields
    const structuredResult = {
      summary: parsedData.summary || "Here are personalized home remedies based on your symptoms.",
      severity: parsedData.severity || "mild",
      isEmergency: Boolean(parsedData.isEmergency),
      remedies: Array.isArray(parsedData.remedies) ? parsedData.remedies : [],
      selfCare: Array.isArray(parsedData.selfCare) ? parsedData.selfCare : [
        "Get adequate rest and sleep.",
        "Stay well hydrated throughout the day."
      ],
      avoid: Array.isArray(parsedData.avoid) ? parsedData.avoid : [],
      warningSigns: Array.isArray(parsedData.warningSigns) ? parsedData.warningSigns : [
        "Symptoms worsen significantly or fail to improve after 3-5 days.",
        "High persistent fever develops."
      ],
      whenToSeeDoctor: parsedData.whenToSeeDoctor || "Consult a healthcare professional if symptoms persist beyond a few days or worsen.",
    };

    // Construct backward-compatible plain text recommendation string
    const remediesSummary = structuredResult.remedies
      .map((r, i) => `${i + 1}. ${r.title}: ${r.description} (${r.howToUse})`)
      .join("\n\n");
    const textRecommendation = `${structuredResult.summary}\n\nRecommended Remedies:\n${remediesSummary}\n\nWhen to See a Doctor:\n${structuredResult.whenToSeeDoctor}`;

    return res.status(200).json({
      success: true,
      data: structuredResult,
      recommendation: textRecommendation,
    });
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      return res.status(408).json({ error: "Analysis timed out. Please try again." });
    }
    if (error.response?.status === 429) {
      return res.status(429).json({ error: "High request volume. Please wait a moment and try again." });
    }
    console.error("Groq AI Recommendation Error:", error.response?.status || error.message);

    // Provide safe structured fallback instead of breaking
    const fallbackResponse = {
      summary: "Gentle self-care and hydration are recommended for mild symptoms.",
      severity: "mild",
      isEmergency: false,
      remedies: [
        {
          title: "Warm Water & Hydration",
          description: "Adequate fluids maintain mucous membrane moisture and aid recovery.",
          howToUse: "Sip warm water or herbal tea throughout the day.",
          caution: "Avoid extremely hot liquids which can irritate throat tissues."
        },
        {
          title: "Rest & Sleep",
          description: "Rest allows the immune system to focus energy on natural healing.",
          howToUse: "Aim for 7-9 hours of restful sleep in a well-ventilated room.",
          caution: "Avoid intense physical exertion until symptoms resolve."
        }
      ],
      selfCare: ["Drink warm water regularly", "Rest in a comfortable environment"],
      avoid: ["Avoid smoking and cold drinks"],
      warningSigns: ["Difficulty breathing", "High fever lasting > 3 days"],
      whenToSeeDoctor: "Please consult a healthcare provider if symptoms worsen or do not improve.",
      recommendation: "Stay hydrated and get plenty of rest. If your symptoms worsen, please consult a qualified healthcare provider."
    };

    return res.status(200).json({
      success: true,
      data: fallbackResponse,
      recommendation: fallbackResponse.recommendation,
    });
  }
};

/* ─── analyzeSymptoms (unchanged contract) ─── */
export const analyzeSymptoms = async (req, res) => {
  const rawSymptoms = req.body?.symptoms;
  const symptoms = sanitize(rawSymptoms);

  if (!symptoms || symptoms.length === 0) {
    return res.status(400).json({ error: "Symptoms are required." });
  }

  const headers = getGroqHeaders();
  if (!headers) {
    return res.status(503).json({ error: "AI service is temporarily unavailable." });
  }

  const prompt = `You are a medical AI assistant. Analyze the following symptoms and provide a structured response in JSON format.

Symptoms: ${symptoms}

Analyze the severity and provide response in this exact JSON structure:
{
  "severity": "mild" or "moderate" or "severe",
  "summary": "A brief 2-3 sentence summary of the condition",
  "doctorType": "Type of doctor specialist needed (only if moderate or severe)",
  "reason": "Why this specialist is recommended (only if moderate or severe)",
  "homeRemedies": "List of home remedies separated by newlines (only if mild)"
}

Severity Guidelines:
- "mild": Common conditions like mild cold, minor headache, slight fever (<100°F), minor stomach upset
- "moderate": Persistent symptoms, moderate pain, fever 100-102°F, symptoms lasting 3+ days
- "severe": High fever (>102°F), severe pain, difficulty breathing, chest pain, severe bleeding, sudden vision changes

For mild cases, suggest 3-5 practical home remedies.
For moderate/severe cases, recommend the appropriate specialist (e.g., "General Physician", "Cardiologist", "Dermatologist", etc.)

Respond ONLY with valid JSON, no additional text.`;

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        messages: [
          {
            role: "system",
            content: "You are a medical AI assistant. Always respond with valid JSON format.",
          },
          { role: "user", content: prompt },
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.3,
      },
      { headers, timeout: API_TIMEOUT }
    );

    const aiResponse = response.data.choices[0]?.message?.content || "{}";

    try {
      const analysis = JSON.parse(aiResponse);
      if (!analysis.severity || !analysis.summary) {
        throw new Error("Invalid response structure");
      }
      res.status(200).json(analysis);
    } catch (parseError) {
      res.status(200).json({
        severity: "moderate",
        summary:
          "Unable to fully analyze symptoms. Please consult with a healthcare professional for proper evaluation.",
        doctorType: "General Physician",
        reason:
          "A general physician can evaluate your symptoms and provide appropriate guidance or referral to a specialist if needed.",
      });
    }
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      return res.status(408).json({ error: "Analysis timed out. Please try again." });
    }
    if (error.response?.status === 429) {
      return res.status(429).json({ error: "Too many requests. Please wait a moment." });
    }
    console.error("Groq API Error:", error.response?.status || error.message);
    res.status(503).json({ error: "AI service is temporarily unavailable." });
  }
};

/* ─── interactiveSymptomFlow (unchanged contract, hardened) ─── */
export const interactiveSymptomFlow = async (req, res) => {
  const rawSymptoms = req.body?.symptoms;
  const symptoms = sanitize(rawSymptoms);
  const conversation = Array.isArray(req.body?.conversation) ? req.body.conversation : [];
  const language = req.body?.language || "en-US";

  if (!symptoms || symptoms.length === 0) {
    return res.status(400).json({ error: "Symptoms are required." });
  }

  // Duplicate request guard
  const dedupKey = `${symptoms.slice(0, 100)}-${conversation.length}`;
  if (isDuplicate(dedupKey)) {
    return res.status(429).json({ error: "Duplicate request. Please wait a moment." });
  }

  const headers = getGroqHeaders();
  if (!headers) {
    return res.status(503).json({ error: "AI service is temporarily unavailable." });
  }

  const targetLanguage = LANGUAGE_NAMES[language] || "English";
  const languageInstruction =
    targetLanguage !== "English"
      ? `\n\nIMPORTANT: Respond in ${targetLanguage} language. All questions must be in ${targetLanguage}.`
      : "";

  try {
    // If we have fewer than 7 follow-up answers, ask the next clarifying question
    if (conversation.length < 7) {
      const prevQA = conversation
        .map((qa, idx) => `Q${idx + 1}: ${sanitize(qa.question, 500)} / A${idx + 1}: ${sanitize(qa.answer, 500)}`)
        .join("\n");

      const questionNumber = conversation.length + 1;

      const questionGuidelines = [
        "duration - How long have these symptoms been present?",
        "severity - On a scale of 1-10, how severe is your discomfort?",
        "fever - Do you have a fever? If yes, what is your temperature?",
        "pain location - Where exactly do you feel the pain or discomfort?",
        "additional symptoms - Are you experiencing any other symptoms like nausea, dizziness, or fatigue?",
        "recent activities - Have you had any recent injuries, travel, or exposure to sick people?",
        "medical history - Do you have any pre-existing medical conditions or allergies?",
      ];

      const currentGuideline =
        questionGuidelines[conversation.length] || "overall feeling - How are you feeling overall right now?";

      const askPrompt = `You are a compassionate medical assistant collecting diagnostic information from a patient.

Initial symptoms reported: ${symptoms}

Previous conversation:
${prevQA || "None yet"}

This is question ${questionNumber} of 7. Focus on: ${currentGuideline}

Based on the patient's symptoms and previous answers, ask ONE clear, empathetic follow-up question that addresses the focus area above.
Keep the question conversational and easy to understand.${languageInstruction}
Return ONLY the question text, no additional commentary.`;

      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          messages: [
            {
              role: "system",
              content: `You are a compassionate medical assistant. Ask clear, empathetic questions to understand the patient's condition.${languageInstruction}`,
            },
            { role: "user", content: askPrompt },
          ],
          model: "llama-3.1-8b-instant",
          temperature: 0.3,
        },
        { headers, timeout: API_TIMEOUT }
      );

      const nextQuestion =
        response.data.choices[0]?.message?.content?.trim() || "Can you tell me more about how you're feeling?";

      return res.status(200).json({
        nextQuestion,
        finished: false,
        questionNumber,
        totalQuestions: 8,
        isOptional: false,
      });
    }

    // After 7 questions, ask an optional summary question
    if (conversation.length === 7) {
      const optionalQuestions = {
        English:
          "Thank you for providing all that information! Is there anything else you'd like to add that might help us understand your situation better?",
        Hindi:
          "यह सभी जानकारी देने के लिए धन्यवाद! क्या आप कुछ और जोड़ना चाहते हैं?",
        Punjabi:
          "ਇਹ ਸਾਰੀ ਜਾਣਕਾਰੀ ਦੇਣ ਲਈ ਧੰਨਵਾਦ! ਕੀ ਤੁਸੀਂ ਕੁਝ ਹੋਰ ਦੱਸਣਾ ਚਾਹੁੰਦੇ ਹੋ?",
        Bengali:
          "এই সমস্ত তথ্য দেওয়ার জন্য ধন্যবাদ! আর কিছু যোগ করতে চান?",
        Marathi:
          "ही सर्व माहिती दिल्याबद्दल धन्यवाद! आणखी काही सांगायचे आहे का?",
        Tamil:
          "இந்த தகவல்களை வழங்கியதற்கு நன்றி! வேறு ஏதாவது சேர்க்க விரும்புகிறீர்களா?",
        Telugu:
          "ఈ సమాచారం అందించినందుకు ధన్యవాదాలు! మరేదైనా జోడించాలనుకుంటున్నారా?",
        Gujarati:
          "આ બધી માહિતી આપવા બદલ આભાર! બીજું કંઈ ઉમેરવા માંગો છો?",
        Kannada:
          "ಈ ಎಲ್ಲಾ ಮಾಹಿತಿ ನೀಡಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು! ಇನ್ನೇನಾದರೂ ಸೇರಿಸಬೇಕೇ?",
        Malayalam:
          "ഈ വിവരങ്ങൾ നൽകിയതിന് നന്ദി! മറ്റെന്തെങ്കിലും കൂട്ടിച്ചേർക്കാൻ ആഗ്രഹിക്കുന്നുണ്ടോ?",
        Urdu:
          "یہ تمام معلومات فراہم کرنے کا شکریہ! کیا آپ کچھ اور بتانا چاہتے ہیں؟",
        Spanish:
          "¡Gracias por toda esa información! ¿Hay algo más que le gustaría agregar?",
        French:
          "Merci pour toutes ces informations ! Y a-t-il autre chose que vous aimeriez ajouter ?",
        German:
          "Vielen Dank für all diese Informationen! Gibt es noch etwas, das Sie hinzufügen möchten?",
        Portuguese:
          "Obrigado por todas essas informações! Há mais alguma coisa que você gostaria de adicionar?",
        Chinese: "感谢您提供所有这些信息！您还有什么要补充的吗？",
        Japanese: "すべての情報を提供していただきありがとうございます！他に追加したいことはありますか？",
        Arabic: "شكراً لتقديم كل هذه المعلومات! هل هناك أي شيء آخر تريد إضافته؟",
      };

      const optionalQuestion = optionalQuestions[targetLanguage] || optionalQuestions["English"];

      return res.status(200).json({
        nextQuestion: optionalQuestion,
        finished: false,
        questionNumber: 8,
        totalQuestions: 8,
        isOptional: true,
      });
    }

    // Final analysis — produce structured result
    const combined = `${symptoms}\n\nFollow-up answers:\n${conversation
      .map((qa, i) => `${i + 1}. ${sanitize(qa.question, 500)} -> ${sanitize(qa.answer, 500)}`)
      .join("\n")}`;

    const prompt = `You are a medical AI assistant. Analyze the following symptoms and follow-up answers and provide a structured response in JSON format.

Symptoms and follow-ups: ${combined}

Analyze the severity and provide response in this exact JSON structure:
{
  "severity": "mild" or "moderate" or "severe",
  "summary": "A brief 2-3 sentence summary of the condition",
  "doctorType": "Type of doctor specialist needed (only if moderate or severe)",
  "reason": "Why this specialist is recommended (only if moderate or severe)",
  "homeRemedies": "List of home remedies separated by newlines (only if mild)"
}
${languageInstruction}

Respond ONLY with valid JSON, no additional text.`;

    const finalResp = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        messages: [
          {
            role: "system",
            content: `You are a medical AI assistant. Always respond with valid JSON format.${languageInstruction}`,
          },
          { role: "user", content: prompt },
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.3,
      },
      { headers, timeout: API_TIMEOUT }
    );

    const aiResponse = finalResp.data.choices[0]?.message?.content || "{}";

    try {
      const analysis = JSON.parse(aiResponse);
      if (!analysis.severity || !analysis.summary) {
        throw new Error("Invalid response structure");
      }
      return res.status(200).json({ analysis, finished: true });
    } catch (parseError) {
      return res.status(200).json({
        analysis: {
          severity: "moderate",
          summary:
            "Unable to fully analyze symptoms after follow-ups. Please consult a healthcare professional.",
          doctorType: "General Physician",
          reason:
            "A general physician can evaluate your symptoms and provide appropriate guidance or referral.",
        },
        finished: true,
      });
    }
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      return res.status(408).json({ error: "Analysis timed out. Please try again." });
    }
    if (error.response?.status === 429) {
      return res.status(429).json({ error: "Too many requests. Please wait a moment." });
    }
    console.error("Groq API Error (interactive):", error.response?.data || error.message);
    const details = error.response?.data?.error?.message || error.message;
    res.status(503).json({ 
      error: "AI service is temporarily unavailable. Please try again.",
      details: process.env.NODE_ENV !== "production" ? details : undefined
    });
  }
};