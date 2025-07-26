const express = require('express');
const cors = require('cors');
const path = require('path');
require('./db/mongoose');
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const articleRoutes = require('./routes/articles');
const videoRoutes = require('./routes/videos');
const bannerRoutes = require('./routes/banners');
const filesRouter = require('./routes/files');
const mcdaRouter = require('./routes/mcda');

app.use('/api/articles', articleRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api', filesRouter);
app.use('api/mcda', mcdaRouter);
app.use('/images', express.static(path.join(__dirname, 'public/images')));
//app.use('/data', express.static(path.join(__dirname, 'data')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
    res.send('Welcome to the ENTYRE backend API!');
  });
  
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});