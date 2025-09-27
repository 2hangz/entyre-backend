const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Generate a JWT token
 * @param {Object} payload - Data to encode
 * @returns {string} JWT token
 */
const generateToken = (payload) => {
  try {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'entyre-cms',
      audience: 'entyre-users'
    });
  } catch (error) {
    throw new Error('Failed to generate token');
  }
};

/**
 * Verify a JWT token
 * @param {string} token - Token to verify
 * @returns {Object} Decoded data
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'entyre-cms',
      audience: 'entyre-users'
    });
  } catch (error) {
    throw error; // Let the caller handle the specific error type
  }
};

/**
 * Decode a token (does not verify signature, only for extracting information)
 * @param {string} token - Token to decode
 * @returns {Object} Decoded data
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    throw new Error('Failed to decode token');
  }
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken
};