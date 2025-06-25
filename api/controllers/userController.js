const User = require("../models/UserModel");
const FarmerProfile = require("../models/FarmerProfileModel");

// @desc    Get all farmers
// @route   GET /api/users/farmers
// @access  Public
exports.getAllFarmers = async (req, res) => {
  try {
    console.log("Fetching all farmers with profiles...");
    const farmers = await User.find({ role: "farmer" }).select("-password");

    // Get farmer profiles for each farmer
    const farmersWithProfiles = await Promise.all(
      farmers.map(async (farmer) => {
        const farmerProfile = await FarmerProfile.findOne({ user: farmer._id });
        return {
          ...farmer.toObject(),
          farmerProfile: farmerProfile || null,
        };
      })
    );

    console.log(`Returning ${farmersWithProfiles.length} farmers with profiles`);
    res.json({
      success: true,
      count: farmersWithProfiles.length,
      data: farmersWithProfiles,
    });
  } catch (error) {
    console.error("Error fetching farmers:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// @desc    Get farmer profile
// @route   GET /api/users/farmers/:id
// @access  Public
exports.getFarmerProfile = async (req, res) => {
  try {
    const farmer = await User.findOne({
      _id: req.params.id,
      role: "farmer",
    }).select("-password");

    if (!farmer) {
      return res
        .status(404)
        .json({ success: false, message: "Farmer not found" });
    }

    const farmerProfile = await FarmerProfile.findOne({ user: req.params.id });

    // Use consistent data structure with getAllFarmers
    res.json({
      success: true,
      data: {
        ...farmer.toObject(),
        farmerProfile: farmerProfile || null,
      },
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// @desc    Get current user's farmer profile
// @route   GET /api/users/farmers/my-profile
// @access  Private (Farmer only)
exports.getMyFarmerProfile = async (req, res) => {
  try {
    const farmerProfile = await FarmerProfile.findOne({ user: req.user._id });

    if (!farmerProfile) {
      return res.json({
        success: true,
        data: null,
      });
    }

    res.json({
      success: true,
      data: farmerProfile,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// @desc    Create or update farmer profile
// @route   PUT /api/users/farmers/profile
// @access  Private (Farmer only)
exports.updateFarmerProfile = async (req, res) => {
  try {
    console.log("Updating farmer profile for user:", req.user._id);
    console.log("Profile data received:", JSON.stringify(req.body, null, 2));

    const {
      farmName,
      description,
      farmImages,
      farmingPractices,
      establishedYear,
      socialMedia,
      businessHours,
      acceptsPickup,
      acceptsDelivery,
      deliveryRadius,
    } = req.body;

    const profileFields = {
      user: req.user._id,
      farmName,
      description,
      farmImages,
      farmingPractices,
      establishedYear,
      socialMedia,
      businessHours,
      acceptsPickup,
      acceptsDelivery,
      deliveryRadius,
    };

    let farmerProfile = await FarmerProfile.findOne({ user: req.user._id });

    if (farmerProfile) {
      console.log("Updating existing farmer profile:", farmerProfile._id);
      farmerProfile = await FarmerProfile.findOneAndUpdate(
        { user: req.user._id },
        { $set: profileFields },
        { new: true, runValidators: true }
      );
    } else {
      console.log("Creating new farmer profile");
      farmerProfile = await FarmerProfile.create(profileFields);
    }

    console.log("Farmer profile saved successfully:", farmerProfile._id);

    res.json({
      success: true,
      data: farmerProfile,
    });
  } catch (error) {
    console.error("Error updating farmer profile:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    const user = await User.findById(req.user._id);

    if (user) {
      user.name = name || user.name;
      user.phone = phone || user.phone;
      user.address = address || user.address;

      const updatedUser = await user.save();

      res.json({
        success: true,
        data: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          phone: updatedUser.phone,
          address: updatedUser.address,
        },
      });
    } else {
      res.status(404).json({ success: false, message: "User not found" });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private (Admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");

    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// @desc    Delete user (admin only)
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    await user.remove();

    res.json({
      success: true,
      message: "User removed",
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};
