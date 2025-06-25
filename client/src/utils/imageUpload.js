import axios from './axiosConfig';

/**
 * Validates images before upload
 * 
 * @param {File[]} files - The files to validate
 * @param {Object} options - Validation options
 * @param {number} options.maxSize - Maximum file size in bytes (default: 5MB)
 * @param {string[]} options.allowedTypes - Allowed MIME types (default: image/*)
 * @param {number} options.maxCount - Maximum number of files (default: 5)
 * @returns {Object} - Validation result { valid: boolean, errors: Array }
 */
export const validateImages = (files, options = {}) => {
    const {
        maxSize = 5 * 1024 * 1024, // 5MB default
        allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
        maxCount = 5
    } = options;

    const errors = [];

    // Check number of files
    if (files.length > maxCount) {
        errors.push(`You can upload maximum ${maxCount} images at once.`);
    }

    // Check each file
    for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Check file size
        if (file.size > maxSize) {
            errors.push(`${file.name} is too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`);
        }

        // Check file type
        if (!allowedTypes.includes(file.type)) {
            errors.push(`${file.name} has invalid type. Allowed types: JPG, PNG, WebP.`);
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
};

/**
 * Upload images to the server which will then upload to Cloudinary
 * 
 * @param {FileList|File[]} files - The files to upload
 * @param {Object} options - Upload options
 * @param {boolean} options.validate - Whether to validate images (default: true)
 * @param {Function} options.onProgress - Progress callback function
 * @param {Function} options.onUploadStart - Called when upload starts
 * @param {Function} options.onUploadComplete - Called when upload completes
 * @returns {Promise<string[]>} - Array of image URLs
 */
export const uploadProductImages = async (files, options = {}) => {
    const {
        validate = true,
        onProgress,
        onUploadStart,
        onUploadComplete
    } = options; try {
        // Call upload start callback
        if (onUploadStart) {
            onUploadStart();
        }

        // Convert FileList to array and filter out valid File objects only
        const fileArray = Array.from(files).filter(file => {
            // Only accept actual File objects, not blob URLs or other types
            return file instanceof File && file.size > 0 && file.type.startsWith('image/');
        });

        if (fileArray.length === 0) {
            throw new Error('No valid image files to upload');
        }

        // Validate images if needed
        if (validate) {
            const validation = validateImages(fileArray);
            if (!validation.valid) {
                throw new Error(validation.errors.join(', '));
            }
        }

        const formData = new FormData();

        // Append each file to the form data
        fileArray.forEach((file, index) => {
            formData.append('images', file, file.name);
        });

        const config = {
            headers: {
                // Don't set Content-Type manually for FormData
                // Let axios set it with the proper boundary
            },
            onUploadProgress: (progressEvent) => {
                if (onProgress) {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    onProgress(percentCompleted, progressEvent);
                }
            }
        };

        const res = await axios.post('/api/upload/product-images', formData, config);

        // Call upload complete callback
        if (onUploadComplete) {
            onUploadComplete();
        }

        if (res.data.success) {
            return res.data.imageUrls;
        } else {
            throw new Error(res.data.message || 'Failed to upload images');
        }
    } catch (error) {
        // Provide more specific error messages
        if (error.response) {
            const errorMsg = error.response.data?.message || error.response.statusText || 'Upload failed';
            throw new Error(`Upload failed: ${errorMsg}`);
        } else if (error.request) {
            throw new Error('Network error: Unable to reach the server');
        } else {
            throw new Error(error.message || 'Upload failed');
        }
    }
};

/**
 * Upload a single profile image
 * 
 * @param {File} file - The profile image to upload
 * @param {Object} options - Upload options
 * @param {boolean} options.validate - Whether to validate image (default: true)
 * @param {Function} options.onProgress - Progress callback function
 * @param {Function} options.onUploadStart - Called when upload starts
 * @param {Function} options.onUploadComplete - Called when upload completes
 * @returns {Promise<string>} - The profile image URL
 */
export const uploadProfileImage = async (file, options = {}) => {
    const {
        validate = true,
        onProgress,
        onUploadStart,
        onUploadComplete
    } = options;

    try {
        // Call upload start callback
        if (onUploadStart) {
            onUploadStart();
        }

        // Validate image if needed
        if (validate) {
            const validation = validateImages([file], {
                maxSize: 2 * 1024 * 1024, // 2MB for profile images
                maxCount: 1
            });

            if (!validation.valid) {
                throw new Error(validation.errors.join(', '));
            }
        }

        const formData = new FormData();
        formData.append('image', file);

        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                if (onProgress) {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    onProgress(percentCompleted, progressEvent);
                }
            }
        };

        const res = await axios.post('/api/upload/profile-image', formData, config);

        // Call upload complete callback
        if (onUploadComplete) {
            onUploadComplete();
        }

        if (res.data.success) {
            return res.data.imageUrl;
        } else {
            throw new Error(res.data.message || 'Failed to upload profile image');
        }
    } catch (error) {
        throw error;
    }
};

/**
 * Upload farm images
 * 
 * @param {FileList|File[]} files - The farm images to upload
 * @param {Object} options - Upload options
 * @param {boolean} options.validate - Whether to validate images (default: true)
 * @param {Function} options.onProgress - Progress callback function
 * @param {Function} options.onUploadStart - Called when upload starts
 * @param {Function} options.onUploadComplete - Called when upload completes
 * @returns {Promise<string[]>} - Array of farm image URLs
 */
export const uploadFarmImages = async (files, options = {}) => {
    const {
        validate = true,
        onProgress,
        onUploadStart,
        onUploadComplete
    } = options;

    try {
        // Call upload start callback
        if (onUploadStart) {
            onUploadStart();
        }

        // Convert FileList to array and filter out valid File objects only
        const fileArray = Array.from(files).filter(file => {
            // Only accept actual File objects, not blob URLs or other types
            return file instanceof File && file.size > 0 && file.type.startsWith('image/');
        });

        if (fileArray.length === 0) {
            throw new Error('No valid image files to upload');
        }

        // Validate images if needed
        if (validate) {
            const validation = validateImages(fileArray, {
                maxSize: 5 * 1024 * 1024, // 5MB for farm images
                maxCount: 10 // Allow up to 10 farm images
            });
            if (!validation.valid) {
                throw new Error(validation.errors.join(', '));
            }
        }

        const formData = new FormData();

        // Append each file to the form data
        fileArray.forEach((file, index) => {
            formData.append('images', file, file.name);
        });

        const config = {
            headers: {
                // Don't set Content-Type manually for FormData
                // Let axios set it with the proper boundary
            },
            onUploadProgress: (progressEvent) => {
                if (onProgress) {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    onProgress(percentCompleted, progressEvent);
                }
            }
        };

        const res = await axios.post('/api/upload/farm-images', formData, config);

        // Call upload complete callback
        if (onUploadComplete) {
            onUploadComplete();
        }

        if (res.data.success) {
            return res.data.imageUrls;
        } else {
            throw new Error(res.data.message || 'Failed to upload farm images');
        }
    } catch (error) {
        // Provide more specific error messages
        if (error.response) {
            const errorMsg = error.response.data?.message || error.response.statusText || 'Upload failed';
            throw new Error(`Upload failed: ${errorMsg}`);
        } else if (error.request) {
            throw new Error('Network error: Unable to reach the server');
        } else {
            throw new Error(error.message || 'Upload failed');
        }
    }
};
