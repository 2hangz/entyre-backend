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

router.get('/file', async (req, res) => {
  try {
    let name = req.query.file || req.query.name || '';
    if (!name) {
      return res.status(400).json({ error: 'Missing ?file= or ?name=' });
    }

    // 1) 解码 + 去掉路径穿越
    try { name = decodeURIComponent(name); } catch {}
    const safeName = path.basename(name);
    const absPath = path.join(DATA_DIR, safeName);

    // 2) 存在性检查
    if (!fs.existsSync(absPath)) {
      return res.status(404).json({ error: 'File not found', path: absPath, name: safeName });
    }

    // 3) 读文件并打印前64字节，辨别是不是HTML/空文件
    const buf = fs.readFileSync(absPath);
    const head = buf.subarray(0, 64).toString();
    console.log('[READ FILE]', { absPath, size: buf.length, headSnippet: head.replace(/\n/g, '\\n') });

    // 4) 解析（自动识别 xlsx/xls）
    let wb;
    try {
      // 优先用 read (buffer)
      wb = XLSX.read(buf, { type: 'buffer', cellDates: true, cellNF: false, raw: false });
      // 或者：wb = XLSX.readFile(absPath, { cellDates: true });
    } catch (e) {
      console.error('[XLSX READ ERROR]', e.message);
      return res.status(400).json({ error: 'Failed to parse excel', message: e.message });
    }

    // 5) 转 JSON
    const out = {};
    wb.SheetNames.forEach((sheet) => {
      const ws = wb.Sheets[sheet];
      out[sheet] = XLSX.utils.sheet_to_json(ws, { defval: null });
    });

    return res.json(out);
  } catch (err) {
    console.error('[API /file ERROR]', err);
    return res.status(500).json({ error: 'Server error', message: err.message });
  }
});

module.exports = router;

