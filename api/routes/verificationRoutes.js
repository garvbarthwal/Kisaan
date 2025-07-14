const express = require("express");
const {
    verifyFarmer,
    verifyOTP,
    resendOTP,
    getVerificationStatus,
    requestManualVerification,
    getVerificationStats
} = require("../controllers/verificationController");
const { verifyToken, isFarmer, isAdmin } = require("../utils/authMiddleware");

const router = express.Router();

// Farmer verification routes
router.post("/verify-farmer", verifyToken, isFarmer, verifyFarmer);
router.post("/verify-otp", verifyToken, isFarmer, verifyOTP);
router.post("/resend-otp", verifyToken, isFarmer, resendOTP);
router.get("/status", verifyToken, isFarmer, getVerificationStatus);
router.post("/manual-request", verifyToken, isFarmer, requestManualVerification);

// Admin routes
router.get("/stats", verifyToken, isAdmin, getVerificationStats);

module.exports = router;
