// routes/auth.js
const express = require('express');
const rateLimit = require('express-rate-limit');
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
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

router.post('/login', loginLimiter, AuthController.login);

router.get('/verify', AuthController.verify);

router.post('/logout', authenticateToken, AuthController.logout);

router.get('/me', authenticateToken, AuthController.getCurrentUser);

router.get('/protected', authenticateToken, (req, res) => {
  res.json({
    message: `Hello ${req.user.username}! This is a protected route.`,
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;