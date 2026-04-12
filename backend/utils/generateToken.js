const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Generates a signed JWT token for a given user payload.
 * @param {Object} payload - Data to encode (e.g., { id, username, email })
 * @param {string} [expiresIn='7d'] - Token expiry duration
 * @returns {string} Signed JWT token
 */
const generateToken = (payload, expiresIn = '7d') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

/**
 * Verifies and decodes a JWT token.
 * @param {string} token - The JWT to verify
 * @returns {Object} Decoded payload
 * @throws {Error} If token is invalid or expired
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateToken, verifyToken };
