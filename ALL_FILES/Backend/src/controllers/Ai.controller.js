import axios from "axios";

export const getAIRecommendation = async (req, res) => {
  const { symptoms } = req.body;

  if (!symptoms || symptoms.trim().length === 0) {
    return res.status(400).json({ error: "Symptoms are required." });
  }

  const apiKey = process.env.GROQ_API_KEY; 
  if (!apiKey) {
    console.error("ERROR: GROQ_API_KEY is not set in the .env file.");
    return res.status(500).json({ error: "Server configuration error." });
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
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    // 4. Extract the remedy from the correct location in the response
    const remedy = response.data.choices[0]?.message?.content || "No remedy suggestion found.";

    // 5. Send the successful response back
    res.status(200).json({ recommendation: remedy.trim() });

  } catch (error) {
    // This will now give you a more detailed error message from the API
    console.error("Groq API Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to get AI recommendation." });
  }
};

export const analyzeSymptoms = async (req, res) => {
  const { symptoms } = req.body;

  if (!symptoms || symptoms.trim().length === 0) {
    return res.status(400).json({ error: "Symptoms are required." });
  }

  const apiKey = process.env.GROQ_API_KEY; 
  if (!apiKey) {
    console.error("ERROR: GROQ_API_KEY is not set in the .env file.");
    return res.status(500).json({ error: "Server configuration error." });
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
            content: "You are a medical AI assistant. Always respond with valid JSON format."
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.3,
      },
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const aiResponse = response.data.choices[0]?.message?.content || "{}";
    
    try {
      // Try to parse the JSON response
      const analysis = JSON.parse(aiResponse);
      
      // Validate the response structure
      if (!analysis.severity || !analysis.summary) {
        throw new Error("Invalid response structure");
      }

      // Send the structured response
      res.status(200).json(analysis);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      // Fallback response if JSON parsing fails
      res.status(200).json({
        severity: "moderate",
        summary: "Unable to fully analyze symptoms. Please consult with a healthcare professional for proper evaluation.",
        doctorType: "General Physician",
        reason: "A general physician can evaluate your symptoms and provide appropriate guidance or referral to a specialist if needed."
      });
    }

  } catch (error) {
    console.error("Groq API Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to analyze symptoms. Please try again." });
  }
};