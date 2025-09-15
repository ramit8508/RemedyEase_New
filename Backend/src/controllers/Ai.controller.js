import axios from "axios";
export const getAIRecommendation = async (req, res) => {
  const { symptoms } = req.body;
  try {
    const response = await axios.post(
      "https://api.cohere.ai/v1/generate",
      {
        model: "command",
        prompt: `Suggest a safe home remedy for these symptoms: ${symptoms}`,
        max_tokens: 100,
        temperature: 0.7,
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.COHERE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    res.json({ recommendation: response.data.generations[0].text.trim() });
  } catch (error) {
    res.status(500).json({ error: "Failed to get AI recommendation." });
  }
};