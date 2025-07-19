const User = require("../models/UserModel");
const FarmerProfile = require("../models/FarmerProfileModel");

// @desc    Get all farmers
// @route   GET /api/users/farmers
// @access  Public
exports.getAllFarmers = async (req, res) => {
  try {
    const { verified, search, sortBy = 'name', order = 'asc' } = req.query;

    // Build filter for farmers
    let userFilter = { role: "farmer" };

    // Add search filter if provided
    if (search) {
      userFilter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } },
        { 'address.state': { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    let sortObject = {};
    if (sortBy === 'name') {
      sortObject.name = order === 'desc' ? -1 : 1;
    } else if (sortBy === 'createdAt') {
      sortObject.createdAt = order === 'desc' ? -1 : 1;
    }

    const farmers = await User.find(userFilter)
      .select("-password")
      .sort(sortObject);

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

    // Apply verification filter after getting profiles
    let filteredFarmers = farmersWithProfiles;
    if (verified !== undefined) {
      const isVerifiedFilter = verified === 'true';

      filteredFarmers = farmersWithProfiles.filter(farmer => {
        const isActuallyVerified = farmer.farmerProfile?.isVerified === true;
        if (isVerifiedFilter) {
          // Show only verified farmers
          return isActuallyVerified;
        } else {
          // Show only unverified farmers
          return !isActuallyVerified;
        }
      });
    }

    // Sort by verification status if requested
    if (sortBy === 'verified') {
      filteredFarmers.sort((a, b) => {
        const aVerified = a.farmerProfile?.isVerified || false;
        const bVerified = b.farmerProfile?.isVerified || false;
        return order === 'desc' ? bVerified - aVerified : aVerified - bVerified;
      });
    }

    res.json({
      success: true,
      count: filteredFarmers.length,
      totalFarmers: farmersWithProfiles.length,
      filters: { verified, search, sortBy, order },
      data: filteredFarmers,
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
    const {
      farmName,
      description,
      farmImages,
      farmingPractices,
      establishedYear,
      socialMedia,
      businessHours,
      farmLocation,
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
      farmLocation,
    };

    let farmerProfile = await FarmerProfile.findOne({ user: req.user._id });

    if (farmerProfile) {
      farmerProfile = await FarmerProfile.findOneAndUpdate(
        { user: req.user._id },
        { $set: profileFields },
        { new: true, runValidators: true }
      );
    } else {
      farmerProfile = await FarmerProfile.create(profileFields);
    }

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
    const { name, address } = req.body;

    const user = await User.findById(req.user._id);

    if (user) {
      user.name = name || user.name;
      // Phone number is not updatable
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

// @desc    Create business hours for farmer
// @route   POST /api/users/farmers/business-hours
// @access  Private (Farmer only)
exports.createBusinessHours = async (req, res) => {
  try {
    const { businessHours } = req.body;

    // Validate that businessHours is provided
    if (!businessHours) {
      return res.status(400).json({
        success: false,
        message: "Business hours are required",
      });
    }

    // Check if farmer already has a profile
    let farmerProfile = await FarmerProfile.findOne({ user: req.user._id });

    if (farmerProfile) {
      // Update existing profile with business hours
      farmerProfile.businessHours = businessHours;
      await farmerProfile.save();
    } else {
      // Create a new profile with minimal required fields and business hours
      farmerProfile = await FarmerProfile.create({
        user: req.user._id,
        farmName: req.user.name + "'s Farm", // Default farm name
        description: "Farm description will be updated soon.", // Default description
        businessHours: businessHours,
      });
    }

    res.json({
      success: true,
      message: "Business hours saved successfully",
      data: farmerProfile,
    });
  } catch (error) {
    console.error("Error creating business hours:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get user's saved addresses
// @route   GET /api/users/saved-addresses
// @access  Private
exports.getSavedAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('savedAddresses');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      data: user.savedAddresses || []
    });
  } catch (error) {
    console.error("Error fetching saved addresses:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// @desc    Add a new saved address
// @route   POST /api/users/saved-addresses
// @access  Private
exports.addSavedAddress = async (req, res) => {
  try {
    const { name, street, city, state, zipCode, coordinates, locationDetected, isDefault } = req.body;

    // Validate required fields
    if (!city || !state || !zipCode) {
      return res.status(400).json({
        success: false,
        message: "City, state, and zip code are required"
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if address already exists
    const addressExists = user.savedAddresses.some(savedAddr =>
      savedAddr.street === street &&
      savedAddr.city === city &&
      savedAddr.state === state &&
      savedAddr.zipCode === zipCode
    );

    if (addressExists) {
      return res.status(400).json({
        success: false,
        message: "This address is already saved"
      });
    }

    // If this is set as default, remove default from other addresses
    if (isDefault) {
      user.savedAddresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    // Add new address
    const newAddress = {
      name: name || `Address ${user.savedAddresses.length + 1}`,
      street: street || "",
      city,
      state,
      zipCode,
      coordinates: coordinates || null,
      locationDetected: locationDetected || false,
      isDefault: isDefault || user.savedAddresses.length === 0, // First address becomes default
    };

    user.savedAddresses.push(newAddress);
    await user.save();

    res.status(201).json({
      success: true,
      message: "Address saved successfully",
      data: newAddress
    });
  } catch (error) {
    console.error("Error adding saved address:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// @desc    Update a saved address
// @route   PUT /api/users/saved-addresses/:addressId
// @access  Private
exports.updateSavedAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const { name, street, city, state, zipCode, coordinates, locationDetected, isDefault } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const addressIndex = user.savedAddresses.findIndex(addr => addr._id.toString() === addressId);

    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Address not found"
      });
    }

    // If this is set as default, remove default from other addresses
    if (isDefault) {
      user.savedAddresses.forEach((addr, index) => {
        if (index !== addressIndex) {
          addr.isDefault = false;
        }
      });
    }

    // Update the address
    const addressToUpdate = user.savedAddresses[addressIndex];
    addressToUpdate.name = name || addressToUpdate.name;
    addressToUpdate.street = street !== undefined ? street : addressToUpdate.street;
    addressToUpdate.city = city || addressToUpdate.city;
    addressToUpdate.state = state || addressToUpdate.state;
    addressToUpdate.zipCode = zipCode || addressToUpdate.zipCode;
    addressToUpdate.coordinates = coordinates !== undefined ? coordinates : addressToUpdate.coordinates;
    addressToUpdate.locationDetected = locationDetected !== undefined ? locationDetected : addressToUpdate.locationDetected;
    addressToUpdate.isDefault = isDefault !== undefined ? isDefault : addressToUpdate.isDefault;

    await user.save();

    res.json({
      success: true,
      message: "Address updated successfully",
      data: addressToUpdate
    });
  } catch (error) {
    console.error("Error updating saved address:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// @desc    Delete a saved address
// @route   DELETE /api/users/saved-addresses/:addressId
// @access  Private
exports.deleteSavedAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const addressIndex = user.savedAddresses.findIndex(addr => addr._id.toString() === addressId);

    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Address not found"
      });
    }

    const wasDefault = user.savedAddresses[addressIndex].isDefault;
    user.savedAddresses.splice(addressIndex, 1);

    // If the deleted address was default and there are other addresses, make the first one default
    if (wasDefault && user.savedAddresses.length > 0) {
      user.savedAddresses[0].isDefault = true;
    }

    await user.save();

    res.json({
      success: true,
      message: "Address deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting saved address:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// @desc    Update user preferred language
// @route   PUT /api/users/language
// @access  Private
exports.updatePreferredLanguage = async (req, res) => {
  try {
    const { language } = req.body;

    // Validate language
    const supportedLanguages = ["en", "hi", "bn", "te", "mr", "ta", "gu", "kn", "ml", "pa", "or", "as", "ur"];
    if (!language || !supportedLanguages.includes(language)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing language. Supported languages: " + supportedLanguages.join(", ")
      });
    }

    // Update user's preferred language
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { preferredLanguage: language },
      { new: true, runValidators: true }
    ).select("-password");

    res.json({
      success: true,
      message: "Preferred language updated successfully",
      data: {
        preferredLanguage: user.preferredLanguage
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};
