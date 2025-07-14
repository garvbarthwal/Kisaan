// utils/objectId.js

/**
 * Checks if a string is a valid MongoDB ObjectId (24 hex chars)
 * @param {string} id
 * @returns {boolean}
 */
export function isValidObjectId(id) {
    return typeof id === "string" && /^[a-fA-F0-9]{24}$/.test(id);
}
