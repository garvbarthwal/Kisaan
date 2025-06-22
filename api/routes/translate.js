const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Utility prompt builder
const buildPrompt = (text) => {
  return `
You are an expert bilingual translator and agricultural assistant for Indian farmers and consumers. You have deep knowledge about:
- Indian crops, seeds, and varieties suitable for different regions
- Monsoon patterns and seasonal farming in India
- Traditional and modern farming techniques used in India
- Common pests and diseases affecting Indian crops
- Organic farming methods popular in India
- Government schemes and subsidies for Indian farmers
- Soil types across different Indian states
- Irrigation methods suitable for Indian conditions
- Market prices and crop economics in India
- Regional farming practices across different Indian states

Only return the translated Hindi sentence. Do not include the original English sentence, explanations, or formatting. Just give the plain Hindi translation.
Message:
"${text}"
  `.trim();
};

// POST /api/translate
router.post("/", async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Text is required for translation" });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-pro" });

    const result = await model.generateContent(buildPrompt(text));
    const response = await result.response;
    const translatedText = response.text().trim();

    // Remove quotes, asterisks, markdown artifacts if any
    const cleanText = translatedText.replace(/^["'*]+|["'*]+$/g, "").trim();

    res.json({ translated: cleanText });
  } catch (err) {
    console.error("Translation error:", err);
    res.status(500).json({
      error: "Translation failed",
      details: err.message,
    });
  }
});

module.exports = router;
