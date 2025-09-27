const User = require('../models/User');
const { generateToken, verifyToken } = require('../utils/jwt');

const loginAttempts = new Map();

class AuthController {
  // User login
  static async login(req, res) {
    try {
      const { username, password } = req.body;

      // Input validation
      if (!username || !password) {
        return res.status(400).json({ 
          message: 'Username and password are required.' 
        });
      }

      const clientIP = req.ip || req.connection.remoteAddress;
      const attemptKey = `${clientIP}:${username}`;

      // Check failed login attempts
      const attempts = loginAttempts.get(attemptKey) || { count: 0, lastAttempt: 0 };
      const now = Date.now();
      
      if (attempts.count >= 5 && now - attempts.lastAttempt < 5 * 60 * 1000) {
        return res.status(429).json({ 
          message: 'Too many failed login attempts. Please try again in 5 minutes.' 
        });
      }

      // Find user
      const user = await User.findByUsername(username.trim());
      if (!user) {
        // Record failed attempt
        loginAttempts.set(attemptKey, { count: attempts.count + 1, lastAttempt: now });
        return res.status(401).json({ message: 'Invalid username or password.' });
      }

      // Validate password
      const isValidPassword = await User.validatePassword(password, user.passwordHash);
      if (!isValidPassword) {
        // Record failed attempt
        loginAttempts.set(attemptKey, { count: attempts.count + 1, lastAttempt: now });
        return res.status(401).json({ message: 'Invalid username or password.' });
      }

      // Login successful, clear failed attempts
      loginAttempts.delete(attemptKey);

      // Update last login time
      await User.updateLastLogin(user.id);

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        username: user.username,
        role: user.role
      });

      // Log login event
      console.log(`User ${username} logged in successfully`, {
        ip: clientIP,
        timestamp: new Date().toISOString()
      });

      // Send response
      res.json({
        message: 'Login successful',
        token,
        user: User.getSafeUserData(user)
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Verify token
  static async verify(req, res) {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({ message: 'No authentication token provided.' });
      }

      const decoded = verifyToken(token);
      
      // Optionally: check if user still exists and is active
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({ message: 'User does not exist.' });
      }

      res.json({
        valid: true,
        user: User.getSafeUserData(user)
      });

    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired. Please log in again.' });
      }
      
      return res.status(401).json({ message: 'Invalid token.' });
    }
  }

  // User logout
  static async logout(req, res) {
    try {
      // In a real project, you can add the token to a blacklist
      // await tokenBlacklist.add(req.token);
      
      res.json({ message: 'Logout successful' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Get current user info
  static async getCurrentUser(req, res) {
    try {
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: 'User does not exist.' });
      }

      res.json({
        user: User.getSafeUserData(user)
      });
    } catch (error) {
      console.error('Error getting user info:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}

module.exports = AuthController;