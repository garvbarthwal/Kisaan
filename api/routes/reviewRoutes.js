const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../utils/authMiddleware");
const {
  createReview,
  getFarmerReviews,
  getOrderReview,
  updateReview,
  deleteReview,
} = require("../controllers/reviewController");

// Create a review - consumer only
router.post("/", protect, authorize("consumer"), createReview);

// Get reviews for a farmer - public
router.get("/farmer/:farmerId", getFarmerReviews);

// Get review for a specific order - private
router.get("/order/:orderId", protect, getOrderReview);

// Update a review - consumer only
router.put("/:id", protect, authorize("consumer"), updateReview);

// Delete a review - consumer or admin
router.delete("/:id", protect, deleteReview);

module.exports = router; 