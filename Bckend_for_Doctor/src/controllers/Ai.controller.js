import axios from "axios";
console.log("[SERVER LOG] 3. Ai.controller.js is being imported.")

export const getAIDoctorSuggestion = async (req, res) => {
  const { symptoms, history } = req.body;

  // 1. Input Validation
  if (!symptoms || !history) {
    return res.status(400).json({ error: "Symptoms and history are required." });
  }

  // 2. Use the GROQ_API_KEY from your .env file
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("Groq API key is not set in environment variables.");
    return res.status(500).json({ error: "Server configuration error." });
  }

  // 3. Construct the detailed prompt for the doctor
  const prompt = `
    You are a clinical assistant AI. Analyze the following patient symptoms and medical history to provide structured, actionable suggestions for a doctor.

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

    Format the response clearly for quick reading by a medical professional.
  `;

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        // 4. Use a powerful model suitable for complex medical summaries
        model: "llama-3.1-8b-instant",
        temperature: 0.3, // Lower temperature for more factual, clinical output
      },
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    // 5. Correctly parse the response from the Groq API
    const suggestion = response.data.choices[0]?.message?.content;
    
    res.status(200).json({ suggestion: suggestion.trim() });

  } catch (error) {
    console.error("Groq API Error:", error.response?.data || error.message);
    res.status(500).json({ 
      error: "Failed to get AI doctor suggestion.",
      details: error.response?.data?.error?.message || "An unknown error occurred."
    });
  }
};