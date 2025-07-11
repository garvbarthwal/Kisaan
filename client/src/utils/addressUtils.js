/**
 * Address utility functions for the Kisaan application
 * Provides helper functions for address initialization, comparison, and formatting
 */

/**
 * Initialize delivery address from user data
 * @param {Object} user - User object containing address information
 * @returns {Object} - Formatted address object with all required fields
 */
export const initializeAddressFromUser = (user) => {
    if (user?.address) {
        return {
            street: user.address.street || "",
            city: user.address.city || "",
            state: user.address.state || "",
            zipCode: user.address.zipCode || "",
            coordinates: user.address.coordinates || null,
            locationDetected: user.address.locationDetected || false,
        };
    }

    return createEmptyAddress();
};

/**
 * Create an empty address object with default values
 * @returns {Object} - Empty address object
 */
export const createEmptyAddress = () => ({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    coordinates: null,
    locationDetected: false,
});

/**
 * Update address with location data from GPS detection
 * @param {Object} currentAddress - Current address object
 * @param {Object} locationData - Location data from GPS detection
 * @returns {Object} - Updated address object
 */
export const updateAddressWithLocation = (currentAddress, locationData) => ({
    street: locationData.street || currentAddress.street,
    city: locationData.city,
    state: locationData.state,
    zipCode: locationData.zipCode,
    coordinates: locationData.coordinates,
    locationDetected: locationData.locationDetected,
});

/**
 * Check if two addresses are the same
 * @param {Object} address1 - First address object
 * @param {Object} address2 - Second address object
 * @returns {Boolean} - True if addresses are the same
 */
export const addressesAreEqual = (address1, address2) => {
    if (!address1 || !address2) return false;

    return (
        address1.street === address2.street &&
        address1.city === address2.city &&
        address1.state === address2.state &&
        address1.zipCode === address2.zipCode
    );
};

/**
 * Validate if an address has required fields
 * @param {Object} address - Address object to validate
 * @returns {Object} - Validation result with isValid flag and missing fields
 */
export const validateAddress = (address) => {
    const requiredFields = ['street', 'city', 'state'];
    const missingFields = requiredFields.filter(field => !address[field] || address[field].trim() === '');

    return {
        isValid: missingFields.length === 0,
        missingFields,
        hasCoordinates: !!(address.coordinates?.lat && address.coordinates?.lng)
    };
};

/**
 * Format address for display
 * @param {Object} address - Address object
 * @returns {String} - Formatted address string
 */
export const formatAddressForDisplay = (address) => {
    if (!address) return '';

    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.zipCode) parts.push(address.zipCode);

    return parts.join(', ');
};

/**
 * Get default date and time for orders (tomorrow at 10:00 AM)
 * @returns {Object} - Object containing default date and time strings
 */
export const getDefaultOrderDateTime = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    return {
        date: tomorrow.toISOString().split('T')[0],
        time: "10:00"
    };
};
