const express = require("express");
const {
    askFarmingQuery,
    getQueryHistory,
    getSupportedLanguages,
    getSampleQueries,
    textToSpeech,
    speechToText,
    generateSmartSpeechText
} = require("../controllers/aiController");
const { verifyToken, isFarmer } = require("../utils/authMiddleware");

const router = express.Router();

// Public routes
router.get("/languages", getSupportedLanguages);
router.get("/sample-queries", getSampleQueries);

// Protected routes (farmers only)
router.post("/ask", verifyToken, isFarmer, askFarmingQuery);
router.post("/tts", verifyToken, isFarmer, textToSpeech);
router.post("/stt", verifyToken, isFarmer, speechToText);
router.post("/generate-speech-text", verifyToken, isFarmer, generateSmartSpeechText);
router.get("/history", verifyToken, isFarmer, getQueryHistory);

module.exports = router;
