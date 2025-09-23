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