const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const articleRoutes = require('./routes/articles');
const videoRoutes = require('./routes/videos');
const bannerRoutes = require('./routes/banners');
const filesRouter = require('./routes/files');

app.use('/api/articles', articleRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api', filesRouter);
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use('/data', express.static(path.join(__dirname, 'data')));

app.get('/', (req, res) => {
    res.send('Welcome to the ENTYRE backend API!');
  });
  
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});