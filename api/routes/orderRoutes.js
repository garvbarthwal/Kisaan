const express = require("express");
const {
  createOrder,
  getConsumerOrders,
  getFarmerOrders,
  getOrder,
  updateOrderStatus,
  getAllOrders,
  finalizeDeliveryDate,
  cancelOrder,
} = require("../controllers/orderController");
const {
  verifyToken,
  isConsumer,
  isFarmer,
  isAdmin,
} = require("../utils/authMiddleware");
const router = express.Router();

// Consumer routes
router.post("/", verifyToken, isConsumer, createOrder);
router.get("/consumer", verifyToken, isConsumer, getConsumerOrders);
router.put("/:id/cancel", verifyToken, isConsumer, cancelOrder);

// Farmer routes
router.get("/farmer", verifyToken, isFarmer, getFarmerOrders);
router.put("/:id/finalize-delivery", verifyToken, isFarmer, finalizeDeliveryDate);

// Shared routes
router.get("/:id", verifyToken, getOrder);
router.put("/:id", verifyToken, updateOrderStatus);

// Admin routes
router.get("/", verifyToken, isAdmin, getAllOrders);

module.exports = router;
