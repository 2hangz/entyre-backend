const express = require('express');
const cors = require('cors');
const path = require('path');
require('./db/mongoose');

const app = express();
const PORT = 3001;

// Import authentication middleware
const { router: authRouter, authenticateToken, optionalAuth } = require('./routes/auth');

// CORS configuration - more specific for security
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:5173',
    'http://localhost:3001',
    'https://entyre-frontend.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.static('.'));

// Route imports
const articleRoutes = require('./routes/articles');
const videoRoutes = require('./routes/videos');
const bannerRoutes = require('./routes/banners');
const filesRouter = require('./routes/files');
const markdownRoutes = require('./routes/markdown');
const workflowRoutes = require('./routes/workflow');
const uploadRoutes = require('./routes/uploadNodes');
const { router: checkImageRouter, checkImagesExist, runPythonScripts } = require('./routes/checkImage');

// Authentication routes (public)
app.use('/api/auth', authRouter);

// Protected routes (require authentication)
app.use('/api/articles', authenticateToken, articleRoutes);
app.use('/api/videos', authenticateToken, videoRoutes);
app.use('/api/banners', authenticateToken, bannerRoutes);
app.use('/api/markdown', authenticateToken, markdownRoutes);
app.use('/api/workflow', authenticateToken, workflowRoutes);
app.use('/api/upload-nodes', authenticateToken, uploadRoutes);

// Optional auth routes (work with or without authentication)
app.use('/api', optionalAuth, filesRouter);
app.use('/api', optionalAuth, checkImageRouter);

// Static file serving
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use('/data', express.static(path.join(__dirname, 'data')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the ENTYRE backend API!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      articles: '/api/articles',
      videos: '/api/videos',
      banners: '/api/banners',
      markdown: '/api/markdown',
      workflow: '/api/workflow',
      health: '/api/health'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('- POST /api/auth/login');
  console.log('- GET /api/auth/verify');
  console.log('- GET /api/markdown (protected)');
  console.log('- GET /api/banners (protected)');
  console.log('- GET /api/health');
});

module.exports = app;