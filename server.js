const express = require('express');
const cors = require('cors');
const path = require('path');
require('./db/mongoose');
const app = express();
const PORT = 3001;
require('dotenv').config();


//app.use(cors());
app.use(express.json());
app.use(express.static('.'));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

const articleRoutes = require('./routes/articles');
const videoRoutes = require('./routes/videos');
const bannerRoutes = require('./routes/banners');
const filesRouter = require('./routes/files');
const markdownRoutes = require('./routes/markdown');
const workflowRoutes = require('./routes/workflow');
const uploadRoutes = require('./routes/uploadNodes');
const { router, checkImagesExist, runPythonScripts } = require('./routes/checkImage');
const excelRoutes = require('./routes/excelFiles');
const authRoutes = require('./routes/login');

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
app.use('/api/excel-files', excelRoutes);
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.send('Welcome to the ENTYRE backend API!');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});