const express = require("express");
const {
  getAllFarmers,
  getFarmerProfile,
  getMyFarmerProfile,
  updateFarmerProfile,
  updateUserProfile,
  getAllUsers,
  deleteUser,
} = require("../controllers/userController");
const { verifyToken, isAdmin, isFarmer } = require("../utils/authMiddleware");

const router = express.Router();

// Public routes
router.get("/farmers", getAllFarmers);

// Private routes (must come before parameterized routes)
router.get("/farmers/my-profile", verifyToken, isFarmer, getMyFarmerProfile);
router.put("/profile", verifyToken, updateUserProfile);
router.put("/farmers/profile", verifyToken, isFarmer, updateFarmerProfile);

// Public parameterized routes (must come after specific routes)
router.get("/farmers/:id", getFarmerProfile);

// Admin routes
router.get("/", verifyToken, isAdmin, getAllUsers);
router.delete("/:id", verifyToken, isAdmin, deleteUser);

module.exports = router;
