// entyre-backend/routes/files.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const router = express.Router();

// Use ONE canonical data directory for both routes
const dataDir = path.join(__dirname, '../data');

router.get('/files', (req, res) => {
  fs.readdir(dataDir, (err, files) => {
    if (err) {
      console.error('[FILES] fetch fail:', err);
      return res.status(500).json([]);
    }
    const excelFiles = (files || []).filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'));
    res.json(excelFiles);
  });
});

router.get('/file', (req, res) => {
  let name = req.query.file || req.query.name || '';
  if (!name) {
    return res.status(400).json({ error: 'Missing ?file= or ?name=' });
  }

  // Decode + prevent path traversal
  try { name = decodeURIComponent(name); } catch {}
  const safeName = path.basename(name);
  const absPath = path.join(dataDir, safeName); // <-- use the same dir

  if (!fs.existsSync(absPath)) {
    return res.status(404).json({ error: 'File not found', path: absPath, name: safeName });
  }

  try {
    const buf = fs.readFileSync(absPath);
    // quick sanity log
    const head = buf.subarray(0, 64).toString();
    console.log('[READ FILE]', { absPath, size: buf.length, headSnippet: head.replace(/\n/g, '\\n') });

    // Parse (buffer works for xlsx/xls)
    const wb = XLSX.read(buf, { type: 'buffer', cellDates: true, cellNF: false, raw: false });

    const out = {};
    wb.SheetNames.forEach((sheet) => {
      const ws = wb.Sheets[sheet];
      out[sheet] = XLSX.utils.sheet_to_json(ws, { defval: null });
    });

    return res.json(out);
  } catch (e) {
    console.error('[XLSX READ ERROR]', e.message);
    return res.status(400).json({ error: 'Failed to parse excel', message: e.message });
  }
});

module.exports = router;
