const Product = require("../models/ProductModel");
const User = require("../models/UserModel");
const { cloudinary } = require("../utils/cloudinary");
const mongoose = require("mongoose");

// @desc    Create a product
// @route   POST /api/products
// @access  Private (Farmer only)
exports.createProduct = async (req, res) => {
  try {
    req.body.farmer = req.user._id;

    // Handle image uploads if present
    if (req.files && req.files.length > 0) {
      const imageUrls = req.files.map(file => file.path);
      req.body.images = imageUrls;
    }

    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getAllProducts = async (req, res) => {
  try {
    const query = {};

    // Search filter by name
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i");
      query.$or = [{ name: searchRegex }];
    }

    if (req.query.category) {
      query.category = req.query.category;
    }

    if (req.query.farmer) {
      query.farmer = req.query.farmer;
    }

    query.isActive = true;

    const products = await Product.find(query)
      .populate("farmer", "name")
      .populate("category", "name");

    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }
    const product = await Product.findById(req.params.id)
      .populate("farmer", "name")
      .populate("category", "name");

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Farmer only)
exports.updateProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    if (
      product.farmer.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this product",
      });
    }

    // Handle image uploads if present
    if (req.files && req.files.length > 0) {
      const imageUrls = req.files.map(file => file.path);

      // If keepImages field is provided, combine with existing images
      if (req.body.keepImages && Array.isArray(req.body.keepImages)) {
        req.body.images = [...req.body.keepImages, ...imageUrls];
      } else {        // Delete old images from Cloudinary
        if (product.images && product.images.length > 0) {
          const { deleteMultipleImages } = require('../utils/cloudinary');
          try {
            // Use the enhanced deleteMultipleImages function
            await deleteMultipleImages(product.images, 'kisaan/products');
          } catch (deleteErr) {
            console.error("Failed to delete old images:", deleteErr);
          }
        }
        req.body.images = imageUrls;
      }
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Farmer only)
exports.deleteProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }    // Make sure user is the product owner
    if (
      product.farmer.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this product",
      });
    }    // Delete product images from Cloudinary
    if (product.images && product.images.length > 0) {
      const { deleteMultipleImages } = require('../utils/cloudinary');
      try {
        // Use the enhanced deleteMultipleImages function
        await deleteMultipleImages(product.images, 'kisaan/products');
      } catch (deleteErr) {
        console.error("Failed to delete images:", deleteErr);
      }
    }

    // Use findByIdAndDelete instead of the deprecated remove() method
    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Product removed",
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// @desc    Get farmer products
// @route   GET /api/products/farmer
// @access  Private (Farmer only)
exports.getFarmerProducts = async (req, res) => {
  try {
    const products = await Product.find({ farmer: req.user._id }).populate(
      "category",
      "name"
    );

    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};
