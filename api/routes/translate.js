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
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not configured");
    } const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    });

    const result = await model.generateContent(buildPrompt(text));

    if (!result || !result.response) {
      throw new Error("Empty response from Gemini API");
    }

    const response = await result.response;
    const translatedText = response.text().trim();

    // Remove quotes, asterisks, markdown artifacts if any
    const cleanText = translatedText.replace(/^["'*]+|["'*]+$/g, "").trim();

    res.json({ translated: cleanText || "Translation unavailable" });
  } catch (err) {
    console.error("Translation error:", err);

    // Add fallback translation for common errors
    if (err.message.includes("API key") ||
      err.message.includes("quota") ||
      err.message.includes("GEMINI_API_KEY")) {
      return res.json({ translated: "अनुवाद सेवा अस्थायी रूप से उपलब्ध नहीं है। (Translation service temporarily unavailable.)" });
    }

    res.status(500).json({
      error: "Translation failed",
      details: err.message,
    });
  }
});

module.exports = router;
