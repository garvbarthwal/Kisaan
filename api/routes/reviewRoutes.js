const express = require("express");
const router = express.Router();
const { verifyToken, isConsumer, isAdmin } = require("../utils/authMiddleware");
const {
  createReview,
  getFarmerReviews,
  getOrderReview,
  updateReview,
  deleteReview,
} = require("../controllers/reviewController");

// Create a review - consumer only
router.post("/", verifyToken, isConsumer, createReview);

// Get reviews for a farmer - public
router.get("/farmer/:farmerId", getFarmerReviews);

// Get review for a specific order - private
router.get("/order/:orderId", verifyToken, getOrderReview);

// Update a review - consumer only
router.put("/:id", verifyToken, isConsumer, updateReview);

// Delete a review - consumer or admin
router.delete("/:id", verifyToken, deleteReview);

module.exports = router; 