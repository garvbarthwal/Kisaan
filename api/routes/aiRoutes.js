const express = require("express");
const {
    askFarmingQuery,
    getQueryHistory,
    getSupportedLanguages,
    getSampleQueries
} = require("../controllers/aiController");
const { verifyToken, isFarmer } = require("../utils/authMiddleware");

const router = express.Router();

// Public routes
router.get("/languages", getSupportedLanguages);
router.get("/sample-queries", getSampleQueries);

// Protected routes (farmers only)
router.post("/ask", verifyToken, isFarmer, askFarmingQuery);
router.get("/history", verifyToken, isFarmer, getQueryHistory);

module.exports = router;
