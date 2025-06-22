const express = require("express");
const {
    askFarmingQuery,
    getQueryHistory,
    getSupportedLanguages
} = require("../controllers/aiController");
const { verifyToken, isFarmer } = require("../utils/authMiddleware");

const router = express.Router();

// Public route for supported languages
router.get("/languages", getSupportedLanguages);

// Protected routes (farmers only)
router.post("/ask", verifyToken, isFarmer, askFarmingQuery);
router.get("/history", verifyToken, isFarmer, getQueryHistory);

module.exports = router;
