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

// New interactive flow: ask follow-up questions (up to 3) before producing final analysis
export const interactiveSymptomFlow = async (req, res) => {
  const { symptoms, conversation = [], language = 'en-US' } = req.body;

  if (!symptoms || symptoms.trim().length === 0) {
    return res.status(400).json({ error: "Symptoms are required." });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("ERROR: GROQ_API_KEY is not set in the .env file.");
    return res.status(500).json({ error: "Server configuration error." });
  }

  // Language mapping for instructions
  const languageNames = {
    'en-US': 'English',
    'en-GB': 'English',
    'hi-IN': 'Hindi',
    'es-ES': 'Spanish',
    'fr-FR': 'French',
    'de-DE': 'German',
    'pt-BR': 'Portuguese',
    'zh-CN': 'Chinese',
    'ja-JP': 'Japanese',
    'ar-SA': 'Arabic'
  };

  const targetLanguage = languageNames[language] || 'English';
  const languageInstruction = targetLanguage !== 'English' 
    ? `\n\nIMPORTANT: Respond in ${targetLanguage} language. All questions must be in ${targetLanguage}.`
    : '';

  try {
    // If we have fewer than 7 follow-up answers, ask the next clarifying question
    if (!Array.isArray(conversation) || conversation.length < 7) {
      const prevQA = (conversation || [])
        .map((qa, idx) => `Q${idx + 1}: ${qa.question} / A${idx + 1}: ${qa.answer}`)
        .join("\n");

      const questionNumber = conversation.length + 1;
      
      // Define structured question topics to ensure comprehensive assessment
      const questionGuidelines = [
        "duration - How long have these symptoms been present?",
        "severity - On a scale of 1-10, how severe is your discomfort?",
        "fever - Do you have a fever? If yes, what is your temperature?",
        "pain location - Where exactly do you feel the pain or discomfort?",
        "additional symptoms - Are you experiencing any other symptoms like nausea, dizziness, or fatigue?",
        "recent activities - Have you had any recent injuries, travel, or exposure to sick people?",
        "medical history - Do you have any pre-existing medical conditions or allergies?"
      ];

      const currentGuideline = questionGuidelines[conversation.length] || "overall feeling - How are you feeling overall right now?";

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
            { role: "system", content: `You are a compassionate medical assistant. Ask clear, empathetic questions to understand the patient's condition.${languageInstruction}` },
            { role: "user", content: askPrompt }
          ],
          model: "llama-3.1-8b-instant",
          temperature: 0.3,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      const nextQuestion = response.data.choices[0]?.message?.content?.trim() || "Can you tell me more about how you're feeling?";

      return res.status(200).json({ 
        nextQuestion, 
        finished: false,
        questionNumber,
        totalQuestions: 8,
        isOptional: false
      });
    }

    // After 7 questions, ask an optional summary question
    if (conversation.length === 7) {
      const optionalQuestions = {
        'English': "Thank you for providing all that information! 😊 Is there anything else you'd like to add or any other detail that might help us understand your situation better? (Feel free to skip this if you've covered everything)",
        'Hindi': "यह सभी जानकारी देने के लिए धन्यवाद! 😊 क्या आप कुछ और जोड़ना चाहते हैं या कोई अन्य विवरण जो हमें आपकी स्थिति को बेहतर ढंग से समझने में मदद कर सकता है? (यदि आपने सब कुछ कवर कर लिया है तो इसे छोड़ने के लिए स्वतंत्र महसूस करें)",
        'Spanish': "¡Gracias por proporcionar toda esa información! 😊 ¿Hay algo más que le gustaría agregar o algún otro detalle que pueda ayudarnos a entender mejor su situación? (Siéntase libre de omitir esto si ya ha cubierto todo)",
        'French': "Merci d'avoir fourni toutes ces informations ! 😊 Y a-t-il autre chose que vous aimeriez ajouter ou tout autre détail qui pourrait nous aider à mieux comprendre votre situation ? (N'hésitez pas à sauter ceci si vous avez tout couvert)",
        'German': "Vielen Dank für all diese Informationen! 😊 Gibt es noch etwas, das Sie hinzufügen möchten, oder irgendein anderes Detail, das uns helfen könnte, Ihre Situation besser zu verstehen? (Sie können dies gerne überspringen, wenn Sie alles abgedeckt haben)",
        'Portuguese': "Obrigado por fornecer todas essas informações! 😊 Há mais alguma coisa que você gostaria de adicionar ou qualquer outro detalhe que possa nos ajudar a entender melhor sua situação? (Sinta-se à vontade para pular isso se você já cobriu tudo)",
        'Chinese': "感谢您提供所有这些信息！😊 您还有什么要补充的吗，或者有任何其他细节可以帮助我们更好地了解您的情况？（如果您已经涵盖了所有内容，请随时跳过）",
        'Japanese': "すべての情報を提供していただきありがとうございます！😊 他に追加したいことや、状況をより良く理解するのに役立つ詳細はありますか？（すべてカバーしている場合は、これをスキップしてください）",
        'Arabic': "شكراً لك على تقديم كل هذه المعلومات! 😊 هل هناك أي شيء آخر تريد إضافته أو أي تفاصيل أخرى قد تساعدنا على فهم حالتك بشكل أفضل؟ (لا تتردد في تخطي هذا إذا كنت قد غطيت كل شيء)"
      };
      
      const optionalQuestion = optionalQuestions[targetLanguage] || optionalQuestions['English'];
      
      return res.status(200).json({ 
        nextQuestion: optionalQuestion, 
        finished: false,
        questionNumber: 8,
        totalQuestions: 8,
        isOptional: true
      });
    }

    // Otherwise, produce final structured analysis by reusing the analyzeSymptoms prompt but include follow-ups
    const combined = `${symptoms}\n\nFollow-up answers:\n${(conversation || [])
      .map((qa, i) => `${i + 1}. ${qa.question} -> ${qa.answer}`)
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
          { role: "system", content: `You are a medical AI assistant. Always respond with valid JSON format.${languageInstruction}` },
          { role: "user", content: prompt },
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.3,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const aiResponse = finalResp.data.choices[0]?.message?.content || "{}";

    try {
      const analysis = JSON.parse(aiResponse);
      if (!analysis.severity || !analysis.summary) {
        throw new Error("Invalid response structure");
      }
      return res.status(200).json({ analysis, finished: true });
    } catch (parseError) {
      console.error("JSON Parse Error (interactive):", parseError);
      return res.status(200).json({ analysis: {
        severity: "moderate",
        summary: "Unable to fully analyze symptoms after follow-ups. Please consult a healthcare professional.",
        doctorType: "General Physician",
        reason: "A general physician can evaluate your symptoms and provide appropriate guidance or referral.",
      }, finished: true });
    }

  } catch (error) {
    console.error("Groq API Error (interactive):", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to run interactive symptom flow. Please try again." });
  }
};