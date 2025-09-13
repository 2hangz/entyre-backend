const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');
require('./db/mongoose');
const app = express();
const PORT = 3001;
const ExcelFile = require('./models/ExcelFiles');

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

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
    
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    
    // 发送文件内容
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
app.use('/data', express.static(path.join(__dirname, 'data'))); // 保留原有的静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const excelRoutes = require('./routes/excelFiles');
app.use('/api/excel-files', excelRoutes);

app.get('/', (req, res) => {
    res.send('Welcome to the ENTYRE backend API!');
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Frontend compatibility routes active:');
  console.log('- GET /api/files (file list)');
  console.log('- GET /data/:filename (file download)');
});