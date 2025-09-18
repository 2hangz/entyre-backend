const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');
require('./db/mongoose');
const app = express();
const PORT = process.env.PORT || 3001;

// Import ExcelFile model
const ExcelFile = require('./models/ExcelFiles');

// CORS configuration - allow all development environments explicitly
const corsOptions = {
  origin: function (origin, callback) {
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',  // Vite default port
      'http://localhost:4173',  // Vite preview port
      'https://ceees-entyre.github.io',
      'https://entyre-backend.onrender.com'
    ];

    // In development, also allow requests without an origin (e.g., Postman)
    if (process.env.NODE_ENV === 'development' && !origin) {
      return callback(null, true);
    }

    // Check if the origin is in the allowed list
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      console.warn('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('.'));

// Health check endpoint - placed at the top
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    cors: 'enabled'
  });
});

// ===== Frontend ComparePathways compatibility routes =====

// 1. /api/files endpoint as expected by frontend
app.get('/api/files', async (req, res) => {
  try {
    console.log('Frontend requesting file list...');

    const files = await ExcelFile.find({ isActive: true }).sort({ createdAt: -1 });
    const fileNames = files.map(file => file.originalName);

    console.log('Available files:', fileNames);
    res.json(fileNames);

  } catch (err) {
    console.error('Error fetching files for frontend:', err);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// 2. /data/:filename endpoint as expected by frontend
app.get('/data/:filename', async (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    console.log(`Frontend requesting file: ${filename}`);

    const file = await ExcelFile.findOne({
      originalName: filename,
      isActive: true
    });

    if (!file) {
      console.log(`File not found in database: ${filename}`);
      return res.status(404).json({ error: `File "${filename}" not found` });
    }

    console.log(`Found file in database, Cloudinary URL: ${file.fileUrl}`);

    const response = await fetch(file.fileUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch file from Cloudinary: ${response.status} ${response.statusText}`);
    }

    const fileBuffer = await response.buffer();

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.send(fileBuffer);
    console.log(`Successfully served file: ${filename}`);

  } catch (err) {
    console.error('Error serving file to frontend:', err);
    res.status(500).json({
      error: 'Failed to serve file',
      details: err.message
    });
  }
});

// ===== Existing routes =====

const articleRoutes = require('./routes/articles');
const videoRoutes = require('./routes/videos');
const bannerRoutes = require('./routes/banners');
const filesRouter = require('./routes/files');
const markdownRoutes = require('./routes/markdown');
const workflowRoutes = require('./routes/workflow');
const uploadRoutes = require('./routes/uploadNodes');
const { router, checkImagesExist, runPythonScripts } = require('./routes/checkImage');

app.use('/api/articles', articleRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api', uploadRoutes);
app.use('/api', filesRouter);
app.use('/api', router);
app.use('/api/markdown', markdownRoutes);
app.use('/api/workflow', workflowRoutes);
app.use('/api/check-images', checkImagesExist);
app.use('/api/run-script', runPythonScripts);
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use('/data', express.static(path.join(__dirname, 'data')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// CMS-managed Excel file routes
const excelRoutes = require('./routes/excelFiles');
app.use('/api/excel-files', excelRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the ENTYRE backend API!',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /health - Health check',
      'GET /api/files - File list (frontend compatible)',
      'GET /data/:filename - File download (frontend compatible)',
      'GET /api/excel-files - Excel file management'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS policy violation',
      origin: req.headers.origin
    });
  }

  res.status(500).json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('🔧 Frontend compatibility routes active:');
  console.log('   - GET /api/files (file list)');
  console.log('   - GET /data/:filename (file download)');
  console.log('🌐 CORS enabled for:');
  console.log('   - http://localhost:3000');
  console.log('   - http://localhost:5173');
  console.log('   - https://ceees-entyre.github.io');
  console.log('📊 Health check: GET /health');
});