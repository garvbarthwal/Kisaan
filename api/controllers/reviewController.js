const Review = require("../models/ReviewModel");
const Order = require("../models/OrderModel");
const FarmerProfile = require("../models/FarmerProfileModel");
const mongoose = require("mongoose");

// @desc    Create a new review
// @route   POST /api/reviews
// @access  Private (Consumer only)
exports.createReview = async (req, res) => {
  try {
    const { orderId, rating, comment } = req.body;
    
    if (!orderId || !rating || !comment) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    // Check if order exists and belongs to the consumer
    const order = await Order.findById(orderId)
      .populate("farmer", "name")
      .populate("consumer", "name");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Verify the order belongs to the current user
    if (order.consumer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to review this order" });
    }

    // Check if order is completed
    if (order.status !== "completed") {
      return res.status(400).json({ message: "You can only review completed orders" });
    }

    // Check if review already exists for this order
    const existingReview = await Review.findOne({ order: orderId });
    if (existingReview) {
      return res.status(400).json({ message: "You have already reviewed this order" });
    }

    // Create the review
    const review = await Review.create({
      order: orderId,
      consumer: req.user._id,
      farmer: order.farmer._id,
      rating,
      comment,
    });

    // Update farmer's rating statistics
    const farmerProfile = await FarmerProfile.findOne({ user: order.farmer._id });
    
    if (farmerProfile) {
      // Calculate new average
      const currentTotal = farmerProfile.ratings.average * farmerProfile.ratings.count;
      const newCount = farmerProfile.ratings.count + 1;
      const newAverage = (currentTotal + rating) / newCount;
      
      // Update farmer profile with new rating stats
      farmerProfile.ratings.average = newAverage;
      farmerProfile.ratings.count = newCount;
      await farmerProfile.save();
    }

    res.status(201).json({
      success: true,
      review,
    });
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get reviews for a farmer
// @route   GET /api/reviews/farmer/:farmerId
// @access  Public
exports.getFarmerReviews = async (req, res) => {
  try {
    const { farmerId } = req.params;
    
    const reviews = await Review.find({ farmer: farmerId })
      .populate("consumer", "name")
      .populate("order", "createdAt products.name")
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    console.error("Error fetching farmer reviews:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get review for a specific order
// @route   GET /api/reviews/order/:orderId
// @access  Private
exports.getOrderReview = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const review = await Review.findOne({ order: orderId })
      .populate("consumer", "name")
      .populate("farmer", "name");
    
    if (!review) {
      return res.status(404).json({ message: "No review found for this order" });
    }
    
    // Check if the user is authorized to view this review
    if (
      review.consumer._id.toString() !== req.user._id.toString() &&
      review.farmer._id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized to view this review" });
    }
    
    res.status(200).json({
      success: true,
      review,
    });
  } catch (error) {
    console.error("Error fetching order review:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private (Consumer only)
exports.updateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const { id } = req.params;
    
    // Find the review
    const review = await Review.findById(id);
    
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    
    // Check if the user is the owner of the review
    if (review.consumer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this review" });
    }
    
    // Get the old rating for recalculation
    const oldRating = review.rating;
    
    // Update the review
    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    await review.save();
    
    // Update farmer's rating statistics if rating changed
    if (oldRating !== rating && rating) {
      const farmerProfile = await FarmerProfile.findOne({ user: review.farmer });
      
      if (farmerProfile && farmerProfile.ratings.count > 0) {
        // Calculate new average by removing old rating and adding new one
        const currentTotal = farmerProfile.ratings.average * farmerProfile.ratings.count;
        const newTotal = currentTotal - oldRating + rating;
        const newAverage = newTotal / farmerProfile.ratings.count;
        
        // Update farmer profile with new average
        farmerProfile.ratings.average = newAverage;
        await farmerProfile.save();
      }
    }
    
    res.status(200).json({
      success: true,
      review,
    });
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private (Consumer or Admin)
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the review
    const review = await Review.findById(id);
    
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    
    // Check if the user is authorized to delete the review
    if (
      review.consumer.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized to delete this review" });
    }
    
    // Update farmer's rating statistics
    const farmerProfile = await FarmerProfile.findOne({ user: review.farmer });
    
    if (farmerProfile && farmerProfile.ratings.count > 1) {
      // Calculate new average by removing this rating
      const currentTotal = farmerProfile.ratings.average * farmerProfile.ratings.count;
      const newCount = farmerProfile.ratings.count - 1;
      const newAverage = (currentTotal - review.rating) / newCount;
      
      // Update farmer profile with new rating stats
      farmerProfile.ratings.average = newAverage;
      farmerProfile.ratings.count = newCount;
      await farmerProfile.save();
    } else if (farmerProfile && farmerProfile.ratings.count === 1) {
      // Reset to default if this is the only review
      farmerProfile.ratings.average = 0;
      farmerProfile.ratings.count = 0;
      await farmerProfile.save();
    }
    
    // Delete the review
    await Review.findByIdAndDelete(id);
    
    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}; 