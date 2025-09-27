// routes/auth.js
const express = require('express');
const rateLimit = require('express-rate-limit');
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Login rate limiting: max 5 attempts per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max 5 attempts per IP
  message: { 
    message: 'Too many login attempts. Please try again in 15 minutes.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Limit based on IP and username combination
  keyGenerator: (req) => {
    return `${req.ip}:${req.body.username || 'unknown'}`;
  }
});

// 🔐 POST /api/auth/login - User login
router.post('/login', loginLimiter, AuthController.login);

// 🔍 GET /api/auth/verify - Verify token
router.get('/verify', AuthController.verify);

// 🚪 POST /api/auth/logout - User logout
router.post('/logout', authenticateToken, AuthController.logout);

// 👤 GET /api/auth/me - Get current user info
router.get('/me', authenticateToken, AuthController.getCurrentUser);

// 🏠 GET /api/auth/protected - Example protected route
router.get('/protected', authenticateToken, (req, res) => {
  res.json({
    message: `Hello ${req.user.username}! This is a protected route.`,
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;