const express = require("express");
const {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
} = require("../controllers/notificationController");
const { verifyToken } = require("../utils/authMiddleware");

const router = express.Router();

// Get user notifications
router.get("/", verifyToken, getUserNotifications);

// Mark notification as read
router.put("/:id/read", verifyToken, markAsRead);

// Mark all notifications as read
router.put("/read-all", verifyToken, markAllAsRead);

// Create notification (admin/farmer only)
router.post("/", verifyToken, createNotification);

module.exports = router; 