/**
 * Utility functions to clean up image URLs and remove blob URLs
 */

/**
 * Filters out blob URLs from an array of image URLs
 * @param {string[]} imageUrls - Array of image URLs
 * @returns {string[]} - Filtered array with only valid HTTP/HTTPS URLs
 */
export const filterValidImageUrls = (imageUrls) => {
    if (!Array.isArray(imageUrls)) {
        return [];
    }

    return imageUrls.filter(url => {
        if (typeof url !== 'string') {
            return false;
        }

        // Only allow HTTP/HTTPS URLs, no blob URLs
        return (url.startsWith('http://') || url.startsWith('https://')) &&
            !url.startsWith('blob:');
    });
};

/**
 * Cleans product data to remove any blob URLs
 * @param {Object} product - Product object
 * @returns {Object} - Cleaned product object
 */
export const cleanProductImages = (product) => {
    if (!product || typeof product !== 'object') {
        return product;
    }

    return {
        ...product,
        images: filterValidImageUrls(product.images || [])
    };
};

/**
 * Cleans an array of products to remove any blob URLs
 * @param {Object[]} products - Array of product objects
 * @returns {Object[]} - Array of cleaned product objects
 */
export const cleanProductsImages = (products) => {
    if (!Array.isArray(products)) {
        return [];
    }

    return products.map(cleanProductImages);
};

/**
 * Checks if a URL is a blob URL
 * @param {string} url - URL to check
 * @returns {boolean} - True if it's a blob URL
 */
export const isBlobUrl = (url) => {
    return typeof url === 'string' && url.startsWith('blob:');
};

/**
 * Checks if a URL is a valid image URL (HTTP/HTTPS and not blob)
 * @param {string} url - URL to check
 * @returns {boolean} - True if it's a valid image URL
 */
export const isValidImageUrl = (url) => {
    return typeof url === 'string' &&
        (url.startsWith('http://') || url.startsWith('https://')) &&
        !url.startsWith('blob:');
};
