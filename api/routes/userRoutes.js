const express = require("express");
const {
  getAllFarmers,
  getFarmerProfile,
  getMyFarmerProfile,
  updateFarmerProfile,
  createBusinessHours,
  updateUserProfile,
  getAllUsers,
  deleteUser,
  getSavedAddresses,
  addSavedAddress,
  updateSavedAddress,
  deleteSavedAddress,
} = require("../controllers/userController");
const { verifyToken, isAdmin, isFarmer } = require("../utils/authMiddleware");

const router = express.Router();

// Public routes
router.get("/farmers", getAllFarmers);

// Private routes (must come before parameterized routes)
router.get("/farmers/my-profile", verifyToken, isFarmer, getMyFarmerProfile);
router.post("/farmers/business-hours", verifyToken, isFarmer, createBusinessHours);
router.put("/profile", verifyToken, updateUserProfile);
router.put("/farmers/profile", verifyToken, isFarmer, updateFarmerProfile);

// Saved addresses routes
router.get("/saved-addresses", verifyToken, getSavedAddresses);
router.post("/saved-addresses", verifyToken, addSavedAddress);
router.put("/saved-addresses/:addressId", verifyToken, updateSavedAddress);
router.delete("/saved-addresses/:addressId", verifyToken, deleteSavedAddress);

// Public parameterized routes (must come after specific routes)
router.get("/farmers/:id", getFarmerProfile);

// Admin routes
router.get("/", verifyToken, isAdmin, getAllUsers);
router.delete("/:id", verifyToken, isAdmin, deleteUser);

module.exports = router;
