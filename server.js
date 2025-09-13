const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');
require('./db/mongoose');
const app = express();
const PORT = process.env.PORT || 3001;

// 导入 ExcelFile 模型
const ExcelFile = require('./models/ExcelFiles');

// 配置 CORS - 明确允许所有开发环境
const corsOptions = {
  origin: function (origin, callback) {
    // 允许的域名列表
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',  // Vite 默认端口
      'http://localhost:4173',  // Vite preview 端口
      'https://ceees-entyre.github.io',
      'https://entyre-backend.onrender.com'
    ];
    
    // 如果是开发环境，也允许没有 origin 的请求（如 Postman）
    if (process.env.NODE_ENV === 'development' && !origin) {
      return callback(null, true);
    }
    
    // 检查 origin 是否在允许列表中
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

// 预检请求处理
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('.'));

// 健康检查端点 - 放在最前面
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    cors: 'enabled'
  });
});

// ===== 兼容前端 ComparePathways 的路由 =====

// 1. 兼容前端期望的 /api/files 接口
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

// 2. 兼容前端期望的 /data/:filename 接口
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
    
    // 设置 CORS 头
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

// ===== 现有路由 =====

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

// CMS 管理的 Excel 文件路由
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

// 全局错误处理
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

// 404 处理
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