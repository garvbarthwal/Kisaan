const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Flag to track if Cloudinary is configured
let isConfigured = false;

// Configure Cloudinary (lazy initialization)
const configureCloudinary = () => {
    if (!isConfigured) {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        // Log Cloudinary configuration for debugging (without sensitive info)
        console.log('Cloudinary configured with cloud_name:', process.env.CLOUDINARY_CLOUD_NAME);
        console.log('Cloudinary API key set:', !!process.env.CLOUDINARY_API_KEY);
        console.log('Cloudinary API secret set:', !!process.env.CLOUDINARY_API_SECRET);

        isConfigured = true;
    }
    return cloudinary;
};

// Function to get configured cloudinary instance
const getCloudinary = () => {
    return configureCloudinary();
};

// Function to get product storage (lazy initialization)
const getProductStorage = () => {
    const cloudinary = getCloudinary();
    return new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: 'kisaan/products',
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
            transformation: [
                { width: 800, height: 800, crop: 'limit', quality: 'auto:good' },
                { fetch_format: 'auto' }
            ],
            format: 'webp', // Convert all images to WebP for better performance
            resource_type: 'auto' // Auto-detect resource type
        }
    });
};

// Function to get profile storage (lazy initialization)
const getProfileStorage = () => {
    const cloudinary = getCloudinary();
    return new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: 'kisaan/profiles',
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
            transformation: [
                { width: 500, height: 500, crop: 'limit', quality: 'auto:good' },
                { fetch_format: 'auto' }
            ],
            format: 'webp', // Convert all images to WebP
            resource_type: 'auto' // Auto-detect resource type
        }
    });
};

// Create upload middleware functions (lazy initialization)
const uploadProductImages = (req, res, callback) => {
    const upload = multer({
        storage: getProductStorage(),
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
        fileFilter: (req, file, cb) => {
            // Check if the file is an image
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('Only image files are allowed!'), false);
            }
        }
    }).array('images', 5); // Max 5 images

    upload(req, res, callback);
};

const uploadProfileImage = (req, res, callback) => {
    const upload = multer({
        storage: getProfileStorage(),
        limits: { fileSize: 2 * 1024 * 1024 } // 2MB max file size
    }).single('image');

    upload(req, res, callback);
};

/**
 * Extract Cloudinary public ID from a Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @param {string} folder - Folder name (e.g., 'kisaan/products')
 * @returns {string} Public ID with folder
 */
const getPublicIdFromUrl = (url, folder) => {
    try {
        // Parse URL to extract the file name without extension
        const parts = url.split('/');
        const nameWithExtension = parts.pop();
        const nameWithoutExtension = nameWithExtension.split('.')[0]; return `${folder}/${nameWithoutExtension}`;
    } catch (error) {
        return null;
    }
};

/**
 * Delete an image from Cloudinary
 * @param {string} publicIdOrUrl - Cloudinary public ID or URL
 * @param {string} folder - Optional folder name if URL is provided
 * @returns {Promise<{success: boolean, error?: any}>}
 */
const deleteImage = async (publicIdOrUrl, folder) => {
    try {
        const cloudinary = getCloudinary(); // Ensure Cloudinary is configured
        let publicId = publicIdOrUrl;

        // If a URL is provided instead of a public ID, extract the public ID
        if (publicIdOrUrl.startsWith('http') && folder) {
            publicId = getPublicIdFromUrl(publicIdOrUrl, folder);
        }

        // Skip if unable to determine publicId
        if (!publicId) {
            return { success: false, error: 'Invalid public ID or URL' };
        } const result = await cloudinary.uploader.destroy(publicId);
        return { success: result.result === 'ok', result };
    } catch (error) {
        return { success: false, error };
    }
};

/**
 * Delete multiple images from Cloudinary
 * @param {string[]} urls - Array of Cloudinary URLs
 * @param {string} folder - Folder name (e.g., 'kisaan/products')
 * @returns {Promise<{success: boolean, results: any[], error?: any}>}
 */
const deleteMultipleImages = async (urls, folder) => {
    try {
        const results = await Promise.all(
            urls.map(url => deleteImage(url, folder))
        ); const success = results.every(result => result.success);
        return { success, results };
    } catch (error) {
        return { success: false, error };
    }
};

module.exports = {
    cloudinary: getCloudinary,
    uploadProductImages,
    uploadProfileImage,
    deleteImage,
    deleteMultipleImages,
    getPublicIdFromUrl
};
