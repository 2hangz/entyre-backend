// middleware/auth.js
const { verifyToken } = require('../utils/jwt');
const User = require('../models/login');

/**
 * JWT authentication middleware.
 * Verifies the token in the Authorization header and attaches user info to req.user.
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        message: 'Access denied. No authentication token provided.'
      });
    }

    // Verify token
    const decoded = verifyToken(token);

    // Optionally: Check if user still exists (e.g., user deleted but token still valid)
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        message: 'User account does not exist or has been disabled.'
      });
    }

    // Attach user info to request object
    req.user = decoded;
    req.token = token; // May be used for logout/blacklist

    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Token expired. Please log in again.'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: 'Invalid token format.'
      });
    } else {
      console.error('Token verification error:', error);
      return res.status(401).json({
        message: 'Token verification failed.'
      });
    }
  }
};

/**
 * Role-based authorization middleware.
 * Checks if the user has one of the required roles.
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required.'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: 'Insufficient permissions to access this resource.'
      });
    }

    next();
  };
};

/**
 * Optional authentication middleware.
 * If a token is provided, verifies it, but does not require authentication.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = verifyToken(token);
      req.user = decoded;
    }

    next();
  } catch (error) {
    // Optional authentication: failure does not block the request
    next();
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  optionalAuth
};