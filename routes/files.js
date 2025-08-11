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

router.get('/file', (req, res) => {
  try {
    const fileName = req.query.file;
    if (!fileName) {
      return res.status(400).json({ error: 'Missing query param: file' });
    }

    const fullPath = path.resolve(dataDir, fileName);
    if (!fullPath.startsWith(path.resolve(dataDir))) {
      return res.status(400).json({ error: 'Invalid file path' });
    }

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const wb = XLSX.readFile(fullPath, { cellDates: true });
    const result = {};

    wb.SheetNames.forEach(sheetName => {
      const ws = wb.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(ws, {
        defval: '',
        raw: true
      });
      result[sheetName] = json;
    });

    res.json(result);
  } catch (e) {
    console.error('Read excel error:', e);
    res.status(500).json({ error: 'Failed to parse excel' });
  }
});

module.exports = router;

