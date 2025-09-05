// server.js - Improved version with security and error handling
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
require('./db/mongoose');

const app = express();
const PORT = process.env.PORT || 3001;

// Import authentication middleware
const { router: authRouter, authenticateToken, optionalAuth } = require('./routes/auth');

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
app.use(generalLimiter);

// More restrictive rate limiting for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Too many API requests, please try again later' },
});

app.use('/api', apiLimiter);

// CORS configuration with environment-based origins
const allowedOrigins = [
  'http://localhost:3000', 
  'http://localhost:5173',
  'http://localhost:3001',
  process.env.FRONTEND_URL, // Add production frontend URL
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours
}));

// Body parsing middleware with size limits
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Static file serving with security checks
const serveStatic = (directory, route) => {
  const fullPath = path.join(__dirname, directory);
  
  if (fs.existsSync(fullPath)) {
    app.use(route, express.static(fullPath, {
      maxAge: '1d', // Cache static files for 1 day
      etag: true,
      lastModified: true,
      setHeaders: (res, path) => {
        // Security headers for static files
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
      }
    }));
    console.log(`Static files served from ${route} -> ${fullPath}`);
  } else {
    console.warn(`Warning: Static directory not found: ${fullPath}`);
  }
};

// Serve static files
serveStatic('public/images', '/images');
serveStatic('data', '/data');
serveStatic('uploads', '/uploads');
app.use(express.static('.'));

// Route imports with error handling
const loadRoute = (routePath, routeName) => {
  try {
    return require(routePath);
  } catch (err) {
    console.error(`Failed to load ${routeName} routes:`, err.message);
    return null;
  }
};

// Load routes
const articleRoutes = loadRoute('./routes/articles', 'articles');
const videoRoutes = loadRoute('./routes/videos', 'videos');
const bannerRoutes = loadRoute('./routes/banners', 'banners');
const filesRouter = loadRoute('./routes/files', 'files');
const markdownRoutes = loadRoute('./routes/markdown', 'markdown');
const workflowRoutes = loadRoute('./routes/workflow', 'workflow');
const uploadRoutes = loadRoute('./routes/uploadNodes', 'upload nodes');
const checkImageResult = loadRoute('./routes/checkImage', 'check image');
const checkImageRouter = checkImageResult?.router;

// Authentication routes (public)
app.use('/api/auth', authRouter);

// Protected routes (require authentication)
if (articleRoutes) app.use('/api/articles', authenticateToken, articleRoutes);
if (videoRoutes) app.use('/api/videos', authenticateToken, videoRoutes);
if (bannerRoutes) app.use('/api/banners', authenticateToken, bannerRoutes);
if (markdownRoutes) app.use('/api/markdown', authenticateToken, markdownRoutes);
if (workflowRoutes) app.use('/api/workflow', authenticateToken, workflowRoutes);
if (uploadRoutes) app.use('/api/upload-nodes', authenticateToken, uploadRoutes);

// Optional auth routes (work with or without authentication)
if (filesRouter) app.use('/api', optionalAuth, filesRouter);
if (checkImageRouter) app.use('/api', optionalAuth, checkImageRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const healthStatus = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  };

  res.json(healthStatus);
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Welcome to the ENTYRE backend API!',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        verify: 'GET /api/auth/verify',
        logout: 'POST /api/auth/logout'
      },
      protected: {
        articles: 'CRUD /api/articles',
        videos: 'CRUD /api/videos',
        banners: 'CRUD /api/banners',
        markdown: 'CRUD /api/markdown',
        workflow: 'CRUD /api/workflow',
        uploadNodes: 'POST /api/upload-nodes'
      },
      public: {
        health: 'GET /api/health',
        files: 'GET /api/files',
        checkImages: 'GET /api/check-images'
      }
    },
    documentation: 'See README.md for detailed API documentation'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'ENTYRE Backend API Server',
    status: 'Running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Custom error classes
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.message
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid ID format',
      details: err.message
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      error: 'Duplicate entry',
      details: 'Resource already exists'
    });
  }

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS policy violation',
      details: 'Origin not allowed'
    });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Request too large',
      details: 'File or request body exceeds size limit'
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal server error';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err.message 
    })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    suggestion: 'Check the API documentation at /api'
  });
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
  
  // Close server
  server.close(() => {
    console.log('HTTP server closed');
    
    // Close database connections
    require('mongoose').connection.close(() => {
      console.log('Database connection closed');
      process.exit(0);
    });
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 Security: Helmet enabled, CORS configured`);
  console.log('📚 Available endpoints:');
  console.log('   - POST /api/auth/login');
  console.log('   - GET  /api/auth/verify');
  console.log('   - GET  /api/health');
  console.log('   - GET  /api (documentation)');
  console.log('   - CRUD /api/markdown (protected)');
  console.log('   - CRUD /api/banners (protected)');
  console.log('   - CRUD /api/articles (protected)');
  console.log('   - CRUD /api/videos (protected)');
  console.log('   - CRUD /api/workflow (protected)');
});

// Handle graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = { app, server };