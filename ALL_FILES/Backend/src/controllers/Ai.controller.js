import axios from "axios";

/* ─── Helpers & Configurations ─── */

// Strip HTML tags and limit length
function sanitize(text, maxLen = 2000) {
  if (!text || typeof text !== "string") return "";
  return text.replace(/<[^>]*>/g, "").trim().slice(0, maxLen);
}

// Supported languages mapping
const LANGUAGE_NAMES = {
  "en": "English",
  "en-US": "English",
  "en-GB": "English",
  "hi": "Hindi",
  "hi-IN": "Hindi",
  "pa": "Punjabi",
  "pa-IN": "Punjabi",
  "bn": "Bengali",
  "bn-IN": "Bengali",
  "mr": "Marathi",
  "mr-IN": "Marathi",
  "ta": "Tamil",
  "ta-IN": "Tamil",
  "te": "Telugu",
  "te-IN": "Telugu",
  "gu": "Gujarati",
  "gu-IN": "Gujarati",
  "kn": "Kannada",
  "kn-IN": "Kannada",
  "ml": "Malayalam",
  "ml-IN": "Malayalam",
  "ur": "Urdu",
  "ur-IN": "Urdu",
  "hinglish": "Hindi and English (Hinglish)",
  "es-ES": "Spanish",
  "fr-FR": "French",
  "de-DE": "German",
  "pt-BR": "Portuguese",
  "zh-CN": "Chinese",
  "ja-JP": "Japanese",
  "ar-SA": "Arabic",
};

// Axios defaults — 25s timeout
const API_TIMEOUT = 25000;

function getGroqApiKey() {
  return (
    process.env.GROQ_API_KEY ||
    process.env.GROQ_APIKEY ||
    process.env.GROQ_KEY ||
    process.env.GROQ_API_TOKEN ||
    process.env.GROQ
  )?.trim();
}

function getGroqHeaders() {
  const apiKey = getGroqApiKey();
  if (!apiKey) return null;
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

// In-memory duplicate request guard (per symptoms hash)
const recentRequests = new Map();
const DEDUP_WINDOW_MS = 1500;

function isDuplicate(key) {
  const now = Date.now();
  const last = recentRequests.get(key);
  if (last && now - last < DEDUP_WINDOW_MS) return true;
  recentRequests.set(key, now);
  if (recentRequests.size > 300) {
    for (const [k, v] of recentRequests) {
      if (now - v > 8000) recentRequests.delete(k);
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
  if (!text) return false;
  for (const pattern of EMERGENCY_PATTERNS) {
    if (pattern.test(text)) return true;
  }
  return false;
}

/* ─── Multi-Model Groq Chat Caller ─── */
const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "mixtral-8x7b-32768",
  "gemma2-9b-it",
];

async function callGroqChat(messages, options = {}) {
  const headers = getGroqHeaders();
  if (!headers) return null;

  for (const model of GROQ_MODELS) {
    try {
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          messages,
          model,
          temperature: options.temperature ?? 0.3,
          response_format: options.json ? { type: "json_object" } : undefined,
        },
        { headers, timeout: API_TIMEOUT }
      );

      const content = response.data.choices?.[0]?.message?.content;
      if (content) return content;
    } catch (err) {
      console.warn(`[Groq AI] Model ${model} failed (${err.response?.status || err.message}). Trying fallback...`);
      // If 401 unauthorized, API key is invalid — do not loop all models
      if (err.response?.status === 401) {
        console.error("[Groq AI] Invalid API Key. Falling back to internal clinical engine.");
        break;
      }
    }
  }
  return null;
}

/* ─── Localized Question & Clinical Rule Engine ─── */
const QUESTION_BANK = {
  English: [
    "How long have you been experiencing these symptoms?",
    "On a scale of 1 to 10, how severe is your discomfort or pain?",
    "Do you currently have a fever or elevated body temperature?",
    "Where exactly is the discomfort located, and does it spread elsewhere?",
    "Are you experiencing any other symptoms, such as nausea, dizziness, fatigue, or cough?",
    "Have you noticed anything that makes the symptoms better or worse?",
    "Do you have any existing medical conditions, or are you taking any medications?",
    "Is there any other important detail about how you feel that you'd like to share?"
  ],
  Hindi: [
    "आपको यह लक्षण कितने समय से महसूस हो रहे हैं?",
    "1 से 10 के पैमाने पर, आपकी परेशानी या दर्द कितना तीव्र है?",
    "क्या आपको बुखार या शरीर में अत्यधिक गर्माहट महसूस हो रही है?",
    "दर्द या असुविधा शरीर के किस हिस्से में है?",
    "क्या आपको चक्कर, जी मिचलाना, थकान या खांसी जैसी कोई अन्य समस्या भी है?",
    "क्या किसी विशेष गतिविधि या आराम से यह लक्षण कम या ज्यादा होते हैं?",
    "क्या आपको पहले से कोई बीमारी या एलर्जी है, या कोई दवा ले रहे हैं?",
    "क्या आप अपने स्वास्थ्य के बारे में कोई अन्य महत्वपूर्ण जानकारी साझा करना चाहते हैं?"
  ],
  Punjabi: [
    "ਤੁਹਾਨੂੰ ਇਹ ਲੱਛਣ ਕਿੰਨੇ ਸਮੇਂ ਤੋਂ ਮਹਿਸੂਸ ਹੋ ਰਹੇ ਹਨ?",
    "1 ਤੋਂ 10 ਦੇ ਪੈਮਾਨੇ 'ਤੇ, ਤੁਹਾਡਾ ਦਰਦ ਜਾਂ ਤਕਲੀਫ਼ ਕਿੰਨੀ ਹੈ?",
    "ਕੀ ਤੁਹਾਨੂੰ ਬੁਖਾਰ ਜਾਂ ਸਰੀਰ ਵਿੱਚ ਗਰਮੀ ਮਹਿਸੂਸ ਹੋ ਰਹੀ ਹੈ?",
    "ਦਰਦ ਜਾਂ ਤਕਲੀਫ਼ ਕਿਹੜੇ ਹਿੱਸੇ ਵਿੱਚ ਹੈ?",
    "ਕੀ ਤੁਹਾਨੂੰ ਚੱਕਰ, ਉਲਟੀ, ਕਮਜ਼ੋਰੀ ਜਾਂ ਖੰਘ ਵਰਗੀ ਕੋਈ ਹੋਰ ਸਮੱਸਿਆ ਹੈ?",
    "ਕੀ ਕਿਸੇ ਖਾਸ ਚੀਜ਼ ਨਾਲ ਇਹ ਲੱਛਣ ਵੱਧਦੇ ਜਾਂ ਘੱਟਦੇ ਹਨ?",
    "ਕੀ ਤੁਹਾਨੂੰ ਪਹਿਲਾਂ ਤੋਂ ਕੋਈ ਬਿਮਾਰੀ ਜਾਂ ਐਲਰਜੀ ਹੈ?",
    "ਕੀ ਤੁਸੀਂ ਕੋਈ ਹੋਰ ਜਾਣਕਾਰੀ ਸਾਂਝੀ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ?"
  ],
  Bengali: [
    "আপনি কতদিন ধরে এই লক্ষণগুলি অনুভব করছেন?",
    "১ থেকে ১০ এর মধ্যে, আপনার অস্বস্তি বা ব্যথার তীব্রতা কত?",
    "আপনার কি জ্বর বা শরীরের তাপমাত্রা বেশি আছে?",
    "ব্যথা বা অস্বস্তি ঠিক কোন জায়গায় অনুভূত হচ্ছে?",
    "আপনার কি মাথা ঘোরা, বমি ভাব বা কাশির মতো অন্য কোনো সমস্যা আছে?",
    "এমন কিছু কি আছে যা আপনার লক্ষণগুলিকে ভালো বা খারাপ করে?",
    "আপনার কি কোনো দীর্ঘস্থায়ী রোগ বা অ্যালার্জি আছে?",
    "আর কিছু কি আপনি আমাদের জানাতে চান?"
  ],
  Marathi: [
    "तुम्हाला ही लक्षणे किती दिवसांपासून जाणवत आहेत?",
    "१ ते १० च्या प्रमाणात, तुमचा त्रास किंवा वेदना किती तीव्र आहे?",
    "तुम्हाला ताप किंवा अंगात उष्णता जाणवत आहे का?",
    "वेदना किंवा त्रास नेमका कोणत्या भागात होत आहे?",
    "तुम्हाला चक्कर येणे, मळमळ किंवा खोकल्यासारखा इतर काही त्रास आहे का?",
    "कोणत्या गोष्टीने हे लक्षण कमी किंवा जास्त होते का?",
    "तुम्हाला आधीपासून काही आजार किंवा ॲलर्जी आहे का?",
    "तुम्हाला आरोग्याबाबत आणखी काही सांगायचे आहे का?"
  ],
  Tamil: [
    "இந்த அறிகுறிகள் உங்களுக்கு எவ்வளவு காலமாக உள்ளன?",
    "1 முதல் 10 வரை, உங்கள் வலி அல்லது அசௌகரியத்தின் அளவு என்ன?",
    "உங்களுக்கு காய்ச்சல் அல்லது உடல் சூடு அதிகமாக உள்ளதா?",
    "வலி அல்லது அசௌகரியம் உடலின் எந்த பகுதியில் உள்ளது?",
    "தலைசுற்றல், குமட்டல், இருமல் போன்ற வேறு ஏதேனும் அறிகுறிகள் உள்ளதா?",
    "எந்த செயலால் இந்த அறிகுறிகள் குறைகிறது அல்லது அதிகரிக்கிறது?",
    "உங்களுக்கு ஏதேனும் முந்தைய மருத்துவ பிரச்சனைகள் அல்லது ஒவ்வாமை உள்ளதா?",
    "வேறு ஏதேனும் தகவலை நீங்கள் பகிர விரும்புகிறீர்களா?"
  ],
  Telugu: [
    "ఈ లక్షణాలు మీకు ఎంత కాలంగా ఉన్నాయి?",
    "1 నుండి 10 స్కేలులో, మీ నొప్పి లేదా అసౌకర్యం ఎంత తీవ్రంగా ఉంది?",
    "మీకు జ్వరం లేదా శరీర ఉష్ణోగ్రత పెరిగిందా?",
    "నొప్పి లేదా అసౌకర్యం సరిగ్గా ఎక్కడ ఉంది?",
    "కళ్ళు తిరగడం, వికారం, దగ్గు వంటి ఇతర లక్షణాలు ఏమైనా ఉన్నాయా?",
    "ఏదైనా పని చేసినప్పుడు లక్షణాలు ఎక్కువ లేదా తక్కువ అవుతున్నాయా?",
    "మీకు గతంలో ఏదైనా అనారోగ్యం లేదా అలర్జీలు ఉన్నాయా?",
    "మీరు ఇంకేమైనా సమాచారం చెప్పాలనుకుంటున్నారా?"
  ],
  Gujarati: [
    "તમને આ લક્ષણો કેટલા સમયથી અનુભવાઈ રહ્યા છે?",
    "૧ થી ૧૦ ના સ્કેલ પર, તમારો દુખાવો કે અસ્વસ્થતા કેટલી તીવ્ર છે?",
    "શું તમને તાવ કે શરીર ગરમ લાગે છે?",
    "દુખાવો કે અસ્વસ્થતા શરીરના કયા ભાગમાં છે?",
    "શું તમને ચક્કર, ઉબકા કે ઉધરસ જેવી અન્ય કોઈ સમસ્યા છે?",
    "કોઈ બાબતથી આ લક્ષણો વધે કે ઘટે છે?",
    "તમને પહેલાંથી કોઈ બીમારી કે એલર્જી છે?",
    "તમે અન્ય કોઈ માહિતી શેર કરવા માંગો છો?"
  ],
  Kannada: [
    "ಈ ರೋಗಲಕ್ಷಣಗಳು ನಿಮಗೆ ಎಷ್ಟು ಸಮಯದಿಂದ ಕಂಡುಬರುತ್ತಿವೆ?",
    "1 ರಿಂದ 10 ರ ಪ್ರಮಾಣದಲ್ಲಿ, ನಿಮ್ಮ ನೋವು ಅಥವಾ ಅಸ್ವಸ್ಥತೆಯ ತೀವ್ರತೆ ಎಷ್ಟು?",
    "ನಿಮಗೆ ಜ್ವರ ಅಥವಾ ಮೈ ಬಿಸಿ ಇದೆಯೇ?",
    "ನೋವು ಅಥವಾ ಅಸ್ವಸ್ಥತೆ ನಿಖರವಾಗಿ ಎಲ್ಲಿದೆ?",
    "ತಲೆತಿರುಗುವಿಕೆ, ವಾಕರಿಕೆ, ಕೆಮ್ಮಿನಂತಹ ಇತರ ಲಕ್ಷಣಗಳಿವೆಯೇ?",
    "ಯಾವುದಾದರೂ ಕ್ರಿಯೆಯಿಂದ ರೋಗಲಕ್ಷಣಗಳು ಹೆಚ್ಚಾಗುತ್ತವೆಯೇ ಅಥವಾ ಕಡಿಮೆಯಾಗುತ್ತವೆಯೇ?",
    "ನಿಮಗೆ ಈ ಹಿಂದೆ ಯಾವುದಾದರೂ ಆರೋಗ್ಯ ಸಮಸ್ಯೆ ಅಥವಾ ಅಲರ್ಜಿ ಇದೆಯೇ?",
    "ನೀವು ಇನ್ನೇನಾದರೂ ಮಾಹಿತಿ ಹಂಚಿಕೊಳ್ಳಲು ಬಯಸುವಿರಾ?"
  ],
  Malayalam: [
    "ഈ ലക്ഷണങ്ങൾ എത്ര നാളായി അനുഭവപ്പെടുന്നു?",
    "1 മുതൽ 10 വരെയുള്ള സ്കെയിലിൽ, നിങ്ങളുടെ വേദനയുടെ തീവ്രത എത്രയാണ്?",
    "നിങ്ങൾക്ക് പനിയോ ശരീരത്തിൽ ചൂടോ ഉണ്ടോ?",
    "വേദന അല്ലെങ്കിൽ അസ്വസ്ഥത കൃത്യമായി എവിടെയാണ്?",
    "തലകറക്കം, ഛർദ്ദി, ചുമ തുടങ്ങിയ മറ്റ് ലക്ഷണങ്ങൾ ഉണ്ടോ?",
    "ഏതെങ്കിലും പ്രവർത്തനം കൊണ്ട് ലಕ್ಷಣങ്ങൾ കൂടുകയോ കുറയുകയോ ചെയ്യുന്നുണ്ടോ?",
    "നിങ്ങൾക്ക് മുൻപ് എന്തെങ്കിലും രോഗങ്ങളോ അലർജിയോ ഉണ്ടായിട്ടുണ്ടോ?",
    "മറ്റെന്തെങ്കിലും വിവരങ്ങൾ പങ്കുവെക്കാൻ ആഗ്രഹിക്കുന്നുണ്ടോ?"
  ],
  Urdu: [
    "آپ کو یہ علامات کتنے عرصے سے محسوس ہو رہی ہیں؟",
    "1 سے 10 کے پیمانے پر، آپ کی تکلیف یا درد کی شدت کتنی ہے؟",
    "کیا آپ کو بخار یا جسم میں حرارت محسوس ہو رہی ہے؟",
    "درد یا بے چینی جسم کے کس حصے میں ہے؟",
    "کیا آپ کو چکر آنا، متلی، کمزوری یا کھانسی کی شکایت بھی ہے؟",
    "کیا کسی خاص چیز سے علامات میں کمی یا زیادتی ہوتی ہے؟",
    "کیا آپ کو پہلے سے کوئی بیماری یا الرجی ہے؟",
    "کیا آپ اپنے بارے میں کوئی اور بات بتانا چاہتے ہیں؟"
  ]
};

// Fallback Clinical Diagnostic Engine based on reported symptoms & history
function getClinicalRuleAnalysis(symptomsText, conversationHistory = [], langName = "English") {
  const text = (symptomsText + " " + conversationHistory.map(c => c.question + " " + c.answer).join(" ")).toLowerCase();

  // 1. Emergency Detection
  if (checkEmergencySymptom(text)) {
    return {
      severity: "severe",
      summary: "Urgent clinical attention required. The reported symptoms may indicate an acute medical condition.",
      doctorType: "Emergency Medicine Physician / Immediate Care",
      reason: "Symptoms indicate potential red flags (cardiovascular, acute respiratory, or neurological warning signs) requiring direct medical evaluation.",
      homeRemedies: "Do not rely on home remedies for acute red-flag symptoms. Please seek immediate emergency medical care."
    };
  }

  // 2. Headache & Migraine
  if (/\b(headache|head ache|migraine|head throbbing|head pressure|temple pain)\b/i.test(text)) {
    const isSevere = /\b(severe|unbearable|vision loss|vomiting|stiff neck|worst headache)\b/i.test(text);
    if (isSevere) {
      return {
        severity: "moderate",
        summary: "The symptoms suggest significant headache or migraine discomfort that should be clinically evaluated.",
        doctorType: "Neurologist or General Physician",
        reason: "A clinical consultation helps determine if this is a tension-type headache, migraine, or requires imaging/prescription treatment.",
        homeRemedies: "Rest in a quiet, dark room\nApply a cool compress across your forehead\nStay well hydrated with electrolyte fluids\nAvoid bright screens and loud noises\nGentle neck and shoulder stretching"
      };
    }
    return {
      severity: "mild",
      summary: "Mild to moderate tension headache symptoms often associated with dehydration, eye fatigue, or stress.",
      doctorType: "General Physician",
      reason: "Consult a general physician if headaches become frequent, intensify, or fail to resolve within 48 hours.",
      homeRemedies: "Drink 2-3 large glasses of room temperature water\nRest in a calm, dim room for 20-30 minutes\nPlace a cool towel on your forehead or warm compress on the neck\nTake regular screen breaks (follow the 20-20-20 rule)\nSip herbal chamomile or ginger tea"
    };
  }

  // 3. Cold, Cough, Sore Throat, Flu, Fever
  if (/\b(cold|cough|sore throat|throat pain|fever|congestion|runny nose|sneezing|phlegm)\b/i.test(text)) {
    const hasHighFever = /\b(high fever|102|103|104|chills|shivering)\b/i.test(text);
    if (hasHighFever) {
      return {
        severity: "moderate",
        summary: "Upper respiratory symptoms accompanied by noticeable fever. Medical evaluation is advised to identify viral or bacterial causes.",
        doctorType: "General Physician / ENT Specialist",
        reason: "A physician can assess throat inflammation, check vitals, and determine if targeted medication is needed.",
        homeRemedies: "Warm salt water gargle 3 times daily\nSteam inhalation for 5-8 minutes\nHoney and ginger tea to soothe airway irritation\nFrequent hydration with warm water and clear broths\nAdequate bed rest"
      };
    }
    return {
      severity: "mild",
      summary: "Mild upper respiratory irritation consistent with a common cold or environmental throat irritation.",
      doctorType: "General Physician",
      reason: "Consult a physician if symptoms last more than 5 days or if breathing difficulty develops.",
      homeRemedies: "Warm salt water gargling (1/2 tsp salt in 1 cup warm water)\n1 tbsp raw honey with lemon in warm water\nFacial steam inhalation twice daily\nSip warm water and herbal teas frequently\nGet 8+ hours of restful sleep"
    };
  }

  // 4. Gastrointestinal / Stomach / Nausea / Acidity / Diarrhea
  if (/\b(stomach|abdominal|nausea|vomiting|acid reflux|heartburn|gas|bloating|diarrhea|loose motion|indigestion)\b/i.test(text)) {
    const isSevereStomach = /\b(severe pain|blood in stool|unable to keep fluids|fainting|high fever)\b/i.test(text);
    if (isSevereStomach) {
      return {
        severity: "severe",
        summary: "Severe abdominal discomfort requiring prompt in-person medical evaluation.",
        doctorType: "Gastroenterologist / General Surgeon",
        reason: "Acute severe abdominal pain requires clinical examination to rule out acute gastritis, appendicitis, or dehydration.",
        homeRemedies: "Do not eat heavy meals\nSip small amounts of oral rehydration solution (ORS)\nSeek immediate medical consultation"
      };
    }
    return {
      severity: "mild",
      summary: "Mild gastrointestinal upset, acidity, or dietary indigestion.",
      doctorType: "Gastroenterologist or General Physician",
      reason: "Consult a doctor if nausea, vomiting, or stomach pain persists beyond 48 hours.",
      homeRemedies: "Sip fresh ginger tea or warm chamomile infusion\nDrink Oral Rehydration Salts (ORS) or coconut water to maintain electrolytes\nFollow a gentle BRAT diet (Bananas, Rice, Applesauce, Toast)\nAvoid spicy, oily, acidic, and dairy-heavy foods\nEat small, light meals and remain upright for 1 hour after eating"
    };
  }

  // 5. Body Ache, Joint Pain, Muscle Stiffness, Sprains
  if (/\b(joint pain|knee|back pain|spine|muscle pain|body ache|sprain|stiffness|cramp)\b/i.test(text)) {
    return {
      severity: "mild",
      summary: "Musculoskeletal discomfort or mild strain typically relieved by rest, supportive positioning, and thermal therapy.",
      doctorType: "Orthopedic Specialist or Physiotherapist",
      reason: "Consult a specialist if there is noticeable joint swelling, inability to bear weight, or numbness radiating down limbs.",
      homeRemedies: "Apply an ice pack for 15 minutes if onset was recent (first 24-48h); warm compress for chronic stiffness\nRest the affected area and avoid strenuous lifting\nDrink warm turmeric milk (golden milk) before sleep\nPerform gentle, slow range-of-motion stretching\nMaintain supportive, ergonomic posture while sitting and resting"
    };
  }

  // 6. Skin Rash, Allergies, Itching
  if (/\b(rash|itching|skin|allergy|hives|redness|dry skin|eczema)\b/i.test(text)) {
    return {
      severity: "mild",
      summary: "Mild dermatological irritation or localized allergic sensitivity.",
      doctorType: "Dermatologist / Allergist",
      reason: "Consult a dermatologist if the rash spreads rapidly, becomes painful, or forms fluid-filled blisters.",
      homeRemedies: "Apply pure organic aloe vera gel or cool damp cloth to soothe itching\nTake lukewarm (not hot) baths and use mild, fragrance-free cleanser\nAvoid scratching to prevent secondary skin irritation\nWear loose-fitting, breathable cotton clothing\nIdentify and avoid recent cosmetic or chemical irritants"
    };
  }

  // Default Mild-Moderate Assessment
  return {
    severity: "mild",
    summary: "Mild general discomfort based on the provided symptom history. Supportive rest and self-care are recommended.",
    doctorType: "General Physician",
    reason: "A routine consultation with a general physician can provide tailored diagnosis and reassurance.",
    homeRemedies: "Stay well-hydrated by sipping water and herbal infusions regularly\nGet 7-9 hours of restful sleep in a comfortable room\nEat light, nutrient-rich, easily digestible meals\nAvoid physical overexertion until symptoms improve\nMonitor your symptoms and seek medical care if they worsen"
  };
}

/* ─── 1. getAIRecommendation (Home Remedies & Wellness) ─── */
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
    const emergencyResponse = {
      summary: "Based on the symptoms described, urgent professional medical evaluation is required. Home remedies are not appropriate.",
      severity: "emergency",
      isEmergency: true,
      remedies: [],
      selfCare: [
        "Seek emergency medical care immediately or call emergency services (e.g. 108 / 112 / 911).",
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
    const rawContent = await callGroqChat(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Patient symptoms: ${symptoms}` },
      ],
      { json: true, temperature: 0.3 }
    );

    if (rawContent) {
      let parsedData;
      try {
        parsedData = JSON.parse(rawContent);
      } catch {
        const cleaned = rawContent.replace(/```json/gi, "").replace(/```/g, "").trim();
        parsedData = JSON.parse(cleaned);
      }

      if (parsedData && (parsedData.summary || parsedData.remedies)) {
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

        const remediesSummary = structuredResult.remedies
          .map((r, i) => `${i + 1}. ${r.title}: ${r.description} (${r.howToUse})`)
          .join("\n\n");
        const textRecommendation = `${structuredResult.summary}\n\nRecommended Remedies:\n${remediesSummary}\n\nWhen to See a Doctor:\n${structuredResult.whenToSeeDoctor}`;

        return res.status(200).json({
          success: true,
          data: structuredResult,
          recommendation: textRecommendation,
        });
      }
    }
  } catch (err) {
    console.warn("[AI Controller] Groq call failed for recommendation:", err.message);
  }

  // Graceful Clinical Fallback
  const ruleResult = getClinicalRuleAnalysis(symptoms, [], targetLangName);
  const fallbackRemedies = ruleResult.homeRemedies
    .split("\n")
    .filter(Boolean)
    .map(rem => ({
      title: rem.split(":")[0]?.trim() || "Gentle Home Care",
      description: rem.split(":")[1]?.trim() || rem,
      howToUse: "Use as needed throughout the day for soothing comfort.",
      caution: "Discontinue if irritation occurs."
    }));

  const fallbackResponse = {
    summary: ruleResult.summary || "Gentle self-care and hydration are recommended for mild symptoms.",
    severity: ruleResult.severity || "mild",
    isEmergency: false,
    remedies: fallbackRemedies.length > 0 ? fallbackRemedies : [
      {
        title: "Warm Water & Hydration",
        description: "Adequate fluids maintain mucous membrane moisture and aid recovery.",
        howToUse: "Sip warm water or herbal tea throughout the day.",
        caution: "Avoid extremely hot liquids."
      },
      {
        title: "Rest & Sleep",
        description: "Rest allows the body to focus energy on natural healing.",
        howToUse: "Aim for 7-9 hours of restful sleep.",
        caution: "Avoid intense physical exertion until symptoms resolve."
      }
    ],
    selfCare: ["Drink warm water regularly", "Rest in a comfortable environment", "Maintain a balanced light diet"],
    avoid: ["Avoid smoking, cold drinks, and heavy fried meals"],
    warningSigns: ["Difficulty breathing", "High fever lasting > 3 days", "Severe worsening pain"],
    whenToSeeDoctor: ruleResult.reason || "Please consult a healthcare provider if symptoms worsen or do not improve.",
    recommendation: "Stay hydrated and get plenty of rest. If your symptoms worsen, please consult a qualified healthcare provider."
  };

  return res.status(200).json({
    success: true,
    data: fallbackResponse,
    recommendation: fallbackResponse.recommendation,
  });
};

/* ─── 2. analyzeSymptoms (Single Shot Severity Analysis) ─── */
export const analyzeSymptoms = async (req, res) => {
  const rawSymptoms = req.body?.symptoms;
  const symptoms = sanitize(rawSymptoms);

  if (!symptoms || symptoms.length === 0) {
    return res.status(400).json({ error: "Symptoms are required." });
  }

  // Emergency check
  if (checkEmergencySymptom(symptoms)) {
    return res.status(200).json({
      severity: "severe",
      summary: "Urgent clinical attention required. Reported symptoms suggest potential red flags.",
      doctorType: "Emergency Care / General Physician",
      reason: "Severe symptoms require immediate direct medical evaluation.",
      homeRemedies: "Do not delay seeking medical care for acute severe symptoms."
    });
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

Respond ONLY with valid JSON.`;

  try {
    const rawResponse = await callGroqChat(
      [
        { role: "system", content: "You are a medical AI assistant. Always respond with valid JSON format." },
        { role: "user", content: prompt },
      ],
      { json: true, temperature: 0.3 }
    );

    if (rawResponse) {
      let analysis;
      try {
        analysis = JSON.parse(rawResponse);
      } catch {
        const cleaned = rawResponse.replace(/```json/gi, "").replace(/```/g, "").trim();
        analysis = JSON.parse(cleaned);
      }

      if (analysis?.severity && analysis?.summary) {
        return res.status(200).json(analysis);
      }
    }
  } catch (err) {
    console.warn("[AI Controller] Groq call failed in analyzeSymptoms:", err.message);
  }

  // Fallback to Clinical Rule Engine
  const fallbackAnalysis = getClinicalRuleAnalysis(symptoms, [], "English");
  return res.status(200).json(fallbackAnalysis);
};

/* ─── 3. interactiveSymptomFlow (Interactive Symptom Q&A & Triage) ─── */
export const interactiveSymptomFlow = async (req, res) => {
  const rawSymptoms = req.body?.symptoms;
  const symptoms = sanitize(rawSymptoms);
  const conversation = Array.isArray(req.body?.conversation) ? req.body.conversation : [];
  const rawLang = req.body?.language || "en-US";

  if (!symptoms || symptoms.length === 0) {
    return res.status(400).json({ error: "Symptoms are required." });
  }

  // Duplicate request guard
  const dedupKey = `${symptoms.slice(0, 80)}-${conversation.length}`;
  if (isDuplicate(dedupKey)) {
    return res.status(429).json({ error: "Duplicate request. Please wait a moment." });
  }

  const targetLanguage = LANGUAGE_NAMES[rawLang] || LANGUAGE_NAMES["en-US"] || "English";
  const languageInstruction =
    targetLanguage !== "English"
      ? `\n\nIMPORTANT: Respond entirely in ${targetLanguage} language. All questions or text must be in ${targetLanguage}.`
      : "";

  // 1. Check emergency at beginning
  if (checkEmergencySymptom(symptoms)) {
    return res.status(200).json({
      finished: true,
      analysis: {
        severity: "severe",
        summary: "Urgent medical evaluation is strongly recommended based on the reported symptoms.",
        doctorType: "Emergency Physician / Immediate Care",
        reason: "The described symptoms contain critical clinical indicators that require immediate direct medical assessment.",
        homeRemedies: "Do not attempt home remedies for potentially acute symptoms. Please seek immediate medical attention or call emergency services (108 / 112 / 911)."
      }
    });
  }

  try {
    // Phase 1: Clarifying Follow-Up Questions (Up to 7 questions)
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
        "recent activities - Have you had any recent injuries, strain, or exposure?",
        "medical history - Do you have any pre-existing medical conditions or allergies?",
      ];

      const currentGuideline = questionGuidelines[conversation.length] || "overall feeling - How are you feeling overall right now?";

      const askPrompt = `You are a compassionate medical assistant collecting diagnostic information from a patient.

Initial symptoms reported: ${symptoms}

Previous conversation:
${prevQA || "None yet"}

This is question ${questionNumber} of 7. Focus on: ${currentGuideline}

Based on the patient's symptoms and previous answers, ask ONE clear, empathetic follow-up question that addresses the focus area above.
Keep the question conversational, brief, and easy to understand.${languageInstruction}
Return ONLY the question text, no additional commentary.`;

      const aiQuestion = await callGroqChat(
        [
          {
            role: "system",
            content: `You are a compassionate medical assistant. Ask clear, empathetic questions to understand the patient's condition.${languageInstruction}`,
          },
          { role: "user", content: askPrompt },
        ],
        { temperature: 0.3 }
      );

      if (aiQuestion && aiQuestion.trim()) {
        return res.status(200).json({
          nextQuestion: aiQuestion.trim().replace(/^["']|["']$/g, ""),
          finished: false,
          questionNumber,
          totalQuestions: 8,
          isOptional: false,
        });
      }

      // Offline / Clinical Rule Question Fallback
      const localizedQuestions = QUESTION_BANK[targetLanguage] || QUESTION_BANK["English"];
      const fallbackQ = localizedQuestions[conversation.length] || localizedQuestions[0];

      return res.status(200).json({
        nextQuestion: fallbackQ,
        finished: false,
        questionNumber,
        totalQuestions: 8,
        isOptional: false,
      });
    }

    // Phase 2: Optional 8th summary question
    if (conversation.length === 7) {
      const optionalQuestions = {
        English: "Thank you for providing all that information! Is there anything else you'd like to add that might help us understand your situation better?",
        Hindi: "यह सभी जानकारी देने के लिए धन्यवाद! क्या आप कुछ और जोड़ना चाहते हैं?",
        Punjabi: "ਇਹ ਸਾਰੀ ਜਾਣਕਾਰੀ ਦੇਣ ਲਈ ਧੰਨਵਾਦ! ਕੀ ਤੁਸੀਂ ਕੁਝ ਹੋਰ ਦੱਸਣਾ ਚਾਹੁੰਦੇ ਹੋ?",
        Bengali: "এই সমস্ত তথ্য দেওয়ার জন্য ধন্যবাদ! আর কিছু যোগ করতে চান?",
        Marathi: "ही सर्व माहिती दिल्याबद्दल धन्यवाद! आणखी काही सांगायचे आहे का?",
        Tamil: "இந்த தகவல்களை வழங்கியதற்கு நன்றி! வேறு ஏதாவது சேர்க்க விரும்புகிறீர்களா?",
        Telugu: "ఈ సమాచారం అందించినందుకు ధన్యవాଦాలు! మరేదైనా జోడించాలనుకుంటున్నారా?",
        Gujarati: "આ બધી માહિતી આપવા બદલ આભાર! બીજું કંઈ ઉમેરવા માંગો છો?",
        Kannada: "ಈ ಎಲ್ಲಾ ಮಾಹಿತಿ ನೀಡಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು! ಇನ್ನೇನಾದರೂ ಸೇರಿಸಬೇಕೇ?",
        Malayalam: "ഈ വിവരങ്ങൾ നൽകിയതിന് നന്ദി! മറ്റെന്തെങ്കിലും കൂട്ടിച്ചേർക്കാൻ ആഗ്രഹിക്കുന്നുണ്ടോ?",
        Urdu: "یہ تمام معلومات فراہم کرنے کا شکریہ! کیا آپ کچھ اور بتانا چاہتے ہیں؟",
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

    // Phase 3: Final Analysis & Diagnosis
    const combined = `${symptoms}\n\nFollow-up answers:\n${conversation
      .map((qa, i) => `${i + 1}. ${sanitize(qa.question, 500)} -> ${sanitize(qa.answer, 500)}`)
      .join("\n")}`;

    const prompt = `You are a medical AI assistant. Analyze the following symptoms and follow-up answers and provide a structured response in JSON format.

Symptoms and follow-ups: ${combined}

Analyze the severity and provide response in this exact JSON structure:
{
  "severity": "mild" or "moderate" or "severe",
  "summary": "A brief 2-3 sentence summary of the condition in ${targetLanguage}",
  "doctorType": "Type of doctor specialist needed (only if moderate or severe)",
  "reason": "Why this specialist is recommended (only if moderate or severe)",
  "homeRemedies": "List of practical home remedies separated by newlines (only if mild)"
}
${languageInstruction}

Respond ONLY with valid JSON.`;

    const aiFinalResponse = await callGroqChat(
      [
        {
          role: "system",
          content: `You are a medical AI assistant. Always respond with valid JSON format.${languageInstruction}`,
        },
        { role: "user", content: prompt },
      ],
      { json: true, temperature: 0.3 }
    );

    if (aiFinalResponse) {
      let analysis;
      try {
        analysis = JSON.parse(aiFinalResponse);
      } catch {
        const cleaned = aiFinalResponse.replace(/```json/gi, "").replace(/```/g, "").trim();
        analysis = JSON.parse(cleaned);
      }

      if (analysis?.severity && analysis?.summary) {
        return res.status(200).json({ analysis, finished: true });
      }
    }
  } catch (error) {
    console.warn("[AI Controller] Interactive flow encounter:", error.message);
  }

  // Guaranteed Clinical Rule Engine Fallback Result
  const fallbackAnalysis = getClinicalRuleAnalysis(symptoms, conversation, targetLanguage);
  return res.status(200).json({
    analysis: fallbackAnalysis,
    finished: true,
  });
};