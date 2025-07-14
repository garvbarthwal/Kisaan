const express = require('express');
const { verifyToken } = require('../utils/authMiddleware');
const { uploadProductImages, uploadProfileImage, uploadFarmImages } = require('../utils/cloudinary');

const router = express.Router();

/**
 * @route   POST /api/upload/product-images
 * @desc    Upload product images to Cloudinary
 * @access  Private
 */
router.post('/product-images', verifyToken, (req, res) => {
    uploadProductImages(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: 'Error uploading images',
                error: err.message
            });
        }

        // Images uploaded successfully
        if (req.files && req.files.length > 0) {
            const imageUrls = req.files.map(file => file.path);
            return res.status(200).json({
                success: true,
                message: 'Images uploaded successfully',
                imageUrls
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'No images were uploaded'
            });
        }
    });
});

/**
 * @route   POST /api/upload/profile-image
 * @desc    Upload profile image to Cloudinary
 * @access  Private
 */
router.post('/profile-image', verifyToken, (req, res) => {
    uploadProfileImage(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: 'Error uploading profile image',
                error: err.message
            });
        }

        // Image uploaded successfully
        if (req.file) {
            return res.status(200).json({
                success: true,
                message: 'Profile image uploaded successfully',
                imageUrl: req.file.path
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'No profile image was uploaded'
            });
        }
    });
});

/**
 * @route   POST /api/upload/farm-images
 * @desc    Upload farm images to Cloudinary
 * @access  Private
 */
router.post('/farm-images', verifyToken, (req, res) => {
    uploadFarmImages(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: 'Error uploading farm images',
                error: err.message
            });
        }

        // Images uploaded successfully
        if (req.files && req.files.length > 0) {
            const imageUrls = req.files.map(file => file.path);
            return res.status(200).json({
                success: true,
                message: 'Farm images uploaded successfully',
                imageUrls
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'No farm images were uploaded'
            });
        }
    });
});

module.exports = router;
