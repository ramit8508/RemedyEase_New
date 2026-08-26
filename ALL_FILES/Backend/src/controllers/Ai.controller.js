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
  const apiKey = process.env.GROQ_API_KEY;
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

/* ─── getAIRecommendation (unchanged contract) ─── */
export const getAIRecommendation = async (req, res) => {
  const rawSymptoms = req.body?.symptoms;
  const symptoms = sanitize(rawSymptoms);

  if (!symptoms || symptoms.length === 0) {
    return res.status(400).json({ error: "Symptoms are required." });
  }

  const headers = getGroqHeaders();
  if (!headers) {
    return res.status(503).json({ error: "AI service is temporarily unavailable." });
  }

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        messages: [
          {
            role: "user",
            content: `Suggest a safe home remedy for these symptoms: ${symptoms}`,
          },
        ],
        model: "llama-3.1-8b-instant",
      },
      { headers, timeout: API_TIMEOUT }
    );

    const remedy = response.data.choices[0]?.message?.content || "No remedy suggestion found.";
    res.status(200).json({ recommendation: remedy.trim() });
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      return res.status(408).json({ error: "Request timed out. Please try again." });
    }
    if (error.response?.status === 429) {
      return res.status(429).json({ error: "Too many requests. Please wait a moment." });
    }
    console.error("Groq API Error:", error.response?.status || error.message);
    res.status(503).json({ error: "AI service is temporarily unavailable." });
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
    console.error("Groq API Error (interactive):", error.response?.status || error.message);
    res.status(503).json({ error: "AI service is temporarily unavailable. Please try again." });
  }
};