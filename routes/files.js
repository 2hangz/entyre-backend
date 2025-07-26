// entyre-backend/routes/files.js
const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const dataDir = path.join(__dirname, '../data');

router.get('/files', (req, res) => {
  fs.readdir(dataDir, (err, files) => {
    if (err) {
      console.error('fetch fail:', err);
      return res.status(500).json([]);
    }
    const excelFiles = files.filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'));
    res.json(excelFiles);
  });
});

module.exports = router;
