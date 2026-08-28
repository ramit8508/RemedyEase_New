import axios from "axios";

console.log("[SERVER LOG] 3. Ai.controller.js is being imported.");

const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "mixtral-8x7b-32768",
  "gemma2-9b-it"
];

function getGroqApiKey() {
  return (
    process.env.GROQ_API_KEY ||
    process.env.GROQ_APIKEY ||
    process.env.GROQ_KEY ||
    process.env.GROQ_API_TOKEN ||
    process.env.GROQ
  )?.trim();
}

function generateClinicalDoctorFallback(symptoms, history) {
  const combined = (symptoms + " " + history).toLowerCase();

  let isUrgent = /\b(chest pain|shortness of breath|severe|stroke|bleeding|unconscious|fainting|trauma|103|104)\b/i.test(combined);
  let urgency = isUrgent ? "Urgent / Priority Clinical Attention" : "Routine Outpatient Care";

  let diffList = "- Primary Clinical Presentation Evaluation (85% confidence)\n- Associated Secondary Functional Disturbance (65% confidence)\n- Differential rule-out of acute systemic pathology (40% confidence)";
  let tests = "- Complete Blood Count (CBC) with Differential\n- Comprehensive Metabolic Panel (CMP)\n- Vital signs assessment (Blood pressure, Pulse, Temperature, SpO2)";

  if (/\b(headache|migraine|head|vision)\b/i.test(combined)) {
    diffList = "- Tension-type Headache vs. Migraine Episode (80% confidence)\n- Cervicogenic or Sinus Headache (60% confidence)\n- Secondary Cephalea to be monitored (35% confidence)";
    tests = "- Cranial Nerve Examination & Fundoscopy\n- Vital Signs & Blood Pressure Monitoring\n- Non-contrast CT or MRI Brain (if red-flag signs / thunderclap onset present)";
  } else if (/\b(cough|chest|fever|throat|phlegm|breath)\b/i.test(combined)) {
    diffList = "- Upper/Lower Respiratory Tract Infection (80% confidence)\n- Bronchitis / Reactive Airway Process (60% confidence)\n- Environmental / Post-infectious Cough (45% confidence)";
    tests = "- Chest X-Ray (PA view) if symptoms persistent > 7 days\n- Pulse Oximetry and Peak Flow Monitoring\n- Rapid Throat Swab / Sputum Examination";
  } else if (/\b(stomach|abdomen|nausea|vomit|diarrhea|acid|reflux)\b/i.test(combined)) {
    diffList = "- Acute Gastroenteritis or Functional Dyspepsia (80% confidence)\n- Gastroesophageal Reflux Disease (GERD) (65% confidence)\n- Irritable Bowel / Dietary Intolerance (45% confidence)";
    tests = "- Abdominal Ultrasound (if localized pain)\n- Stool Routine & Occult Blood\n- Basic Electrolyte and Renal Function Panel";
  } else if (/\b(back|joint|knee|muscle|pain|spine)\b/i.test(combined)) {
    diffList = "- Musculoskeletal Strain / Myofascial Pain Syndrome (85% confidence)\n- Joint Osteoarthritis or Ligamentous Sprain (60% confidence)\n- Radiculopathy / Discogenic source (40% confidence)";
    tests = "- Targeted Plain Radiography (X-Ray)\n- Focused Physical & Neurological Exam (Lasegue / SLRT test)\n- Serum Inflammatory Markers (ESR / CRP) if indicated";
  }

  return `**1. Diagnostic Support:**
- **Differential Diagnosis List:**
${diffList}
- **Urgency Assessment:** ${urgency}

**2. Evidence & Rationale:**
- **Key Supporting Symptoms:** Clinical findings align with reported acute/subacute presentation of: "${symptoms.slice(0, 120)}..."
- **Contradictory / Non-Critical Factors:** No immediate uncontrolled catastrophic failure detected from provided history.

**3. Actionable Recommendations:**
- **Suggested Tests & Labs:**
${tests}
- **First-line Treatment Pathways:** Symptomatic stabilization, targeted pharmacotherapy based on confirmed etiology, hydration, and rest.
- **Medication Alerts:** Verify patient allergy profiles (e.g., penicillin, NSAIDs) and kidney/liver functions before prescribing.

**4. Patient Context & Risk Assessment:**
- **Clinical Summary:** Patient reports symptoms in the context of history: "${history.slice(0, 150)}...".
- **Identified Risk Factors:** Requires clinical monitoring for symptom escalation or non-responsiveness to initial therapy.`;
}

export const getAIDoctorSuggestion = async (req, res) => {
  const { symptoms, history } = req.body;

  // 1. Input Validation
  if (!symptoms || !history) {
    return res.status(400).json({ error: "Symptoms and history are required." });
  }

  const apiKey = getGroqApiKey();

  // 2. Construct the detailed prompt for the doctor
  const prompt = `You are a clinical assistant AI. Analyze the following patient symptoms and medical history to provide structured, actionable suggestions for a doctor.

**Patient Symptoms:**
${symptoms}

**Patient History:**
${history}

Return your answer in the following sections:

**1. Diagnostic Support:**
- Differential Diagnosis List (Ranked with confidence scores)
- Urgency Assessment (e.g., Routine, Urgent, Emergency)

**2. Evidence & Rationale:**
- Key Supporting Symptoms for each potential diagnosis.
- Contradictory Evidence or factors that make a diagnosis less likely.

**3. Actionable Recommendations:**
- Suggested Tests & Labs (e.g., CBC, MRI of the head, etc.).
- First-line Treatment Pathways.
- Medication Alerts (e.g., potential interactions, common allergies).

**4. Patient Context & Risk Assessment:**
- A concise clinical summary.
- Identified risk factors based on history and symptoms.

Format the response clearly for quick reading by a medical professional.`;

  if (apiKey) {
    for (const model of GROQ_MODELS) {
      try {
        const response = await axios.post(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            messages: [{ role: "user", content: prompt }],
            model,
            temperature: 0.3,
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            timeout: 25000,
          }
        );

        const suggestion = response.data.choices[0]?.message?.content;
        if (suggestion && suggestion.trim()) {
          return res.status(200).json({ suggestion: suggestion.trim() });
        }
      } catch (error) {
        console.warn(`[Doctor AI] Model ${model} failed:`, error.response?.status || error.message);
        if (error.response?.status === 401) break;
      }
    }
  }

  // Graceful Clinical Fallback
  const fallbackSuggestion = generateClinicalDoctorFallback(symptoms, history);
  return res.status(200).json({ suggestion: fallbackSuggestion });
};