// routes/auth.js - Secure version
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: { error: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Secure user store (use proper database in production)
const USERS = [
  { 
    id: 1, 
    username: 'admin', 
    // Hash of '1234' - replace with proper password in production
    password: '$2b$10$K1wIOhJ1FCZ6LIGNJJjkwed2OLeFRXvLn7QlcvJq5FqN7lYuQ2gIu',
    role: 'admin' 
  }
];

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Input validation middleware
const validateLoginInput = (req, res, next) => {
  const { username, password } = req.body;
  
  if (!username || typeof username !== 'string' || username.trim().length === 0) {
    return res.status(400).json({ error: 'Valid username is required' });
  }
  
  if (!password || typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({ error: 'Password is required' });
  }
  
  // Sanitize input
  req.body.username = username.trim().toLowerCase();
  next();
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Token verification failed:', err.message);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Optional authentication middleware
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
    });
  }
  next();
};

// Helper function to generate secure tokens
const generateTokens = (user) => {
  const payload = { 
    id: user.id, 
    username: user.username, 
    role: user.role 
  };
  
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  
  return { accessToken };
};

// Login route with security measures
router.post('/login', authLimiter, validateLoginInput, async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = USERS.find(u => u.username.toLowerCase() === username);

    if (!user) {
      // Use same timing as password check to prevent username enumeration
      await bcrypt.compare(password, '$2b$10$dummy.hash.to.prevent.timing.attacks');
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate tokens
    const { accessToken } = generateTokens(user);

    // Return success response
    res.json({
      message: 'Login successful',
      token: accessToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Token verification route
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    valid: true,
    user: req.user
  });
});

// Password change route (for future use)
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }
    
    // Find user
    const user = USERS.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update password (in production, update database)
    user.password = hashedNewPassword;
    
    res.json({ message: 'Password changed successfully' });
    
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout route
router.post('/logout', authenticateToken, (req, res) => {
  // In a production system, you might want to blacklist the token
  res.json({ message: 'Logged out successfully' });
});

// Utility function to hash passwords (for setup)
const hashPassword = async (plainPassword) => {
  const saltRounds = 12;
  return await bcrypt.hash(plainPassword, saltRounds);
};

module.exports = {
  router,
  authenticateToken,
  optionalAuth,
  hashPassword
};