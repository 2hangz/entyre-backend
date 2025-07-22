const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const db = require('../db/connection');

const UPLOAD_DIR = path.join(__dirname, '../uploads/');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const upload = multer({ dest: UPLOAD_DIR });

// Serve static files for uploaded images
router.use('/uploads', express.static(UPLOAD_DIR));

// GET all articles from database
router.get('/', (req, res) => {
  const query = 'SELECT * FROM articles ORDER BY id DESC';

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('❌ Failed to query articles:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(rows);
  });
});

// GET single article from database
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

  const query = 'SELECT * FROM articles WHERE id = ?';
  db.get(query, [id], (err, row) => {
    if (err) {
      console.error('❌ Failed to get article:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  });
});

// POST /api/articles
router.post('/', upload.single('file'), (req, res) => {
  console.log('📥 Received upload request:', req.body);
  console.log('📎 Uploaded file:', req.file);

  const { title, content } = req.body;
  const file = req.file;
  const imageUrl = file ? `/uploads/${file.filename}` : null;

  if (!title || !content) {
    if (file) fs.unlinkSync(file.path);
    return res.status(400).json({ error: 'Title and content are required' });
  }

  const query = `
    INSERT INTO articles (title, content, imageUrl)
    VALUES (?, ?, ?)
  `;
  const values = [title, content, imageUrl];

  db.run(query, values, function (err) {
    if (err) {
      console.error('❌ Failed to insert:', err.message);
      if (file) fs.unlinkSync(file.path);
      return res.status(500).json({ error: 'Database insert error' });
    }

    console.log('✅ Successfully inserted article ID:', this.lastID);
    res.status(201).json({
      id: this.lastID,
      title,
      content,
      imageUrl,
    });
  });
});

// PUT update article in database
router.put('/:id', upload.single('file'), (req, res) => {
  const { title, content } = req.body;
  const id = parseInt(req.params.id, 10);
  const file = req.file;

  if (isNaN(id)) {
    if (file) fs.unlinkSync(file.path);
    return res.status(400).json({ error: 'Invalid ID' });
  }

  // First, get the existing article to check for old image
  db.get('SELECT * FROM articles WHERE id = ?', [id], (err, article) => {
    if (err) {
      if (file) fs.unlinkSync(file.path);
      console.error('❌ Failed to get article:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!article) {
      if (file) fs.unlinkSync(file.path);
      return res.status(404).json({ error: 'Not found' });
    }

    let newImageUrl = article.imageUrl;
    if (file) {
      // Remove old image if exists
      if (article.imageUrl) {
        const oldPath = path.join(UPLOAD_DIR, path.basename(article.imageUrl));
        if (fs.existsSync(oldPath)) {
          try { fs.unlinkSync(oldPath); } catch (e) {}
        }
      }
      newImageUrl = `/uploads/${file.filename}`;
    }

    const updatedTitle = title !== undefined ? title : article.title;
    const updatedContent = content !== undefined ? content : article.content;

    const updateQuery = `
      UPDATE articles
      SET title = ?, content = ?, imageUrl = ?
      WHERE id = ?
    `;
    db.run(updateQuery, [updatedTitle, updatedContent, newImageUrl, id], function (updateErr) {
      if (updateErr) {
        if (file) fs.unlinkSync(file.path);
        console.error('❌ Failed to update article:', updateErr.message);
        return res.status(500).json({ error: 'Database update error' });
      }
      res.json({
        id,
        title: updatedTitle,
        content: updatedContent,
        imageUrl: newImageUrl,
      });
    });
  });
});

// DELETE article from database
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

  // First, get the article to check for image
  db.get('SELECT * FROM articles WHERE id = ?', [id], (err, article) => {
    if (err) {
      console.error('❌ Failed to get article:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!article) return res.status(404).json({ error: 'Not found' });

    // Remove image file if exists
    if (article.imageUrl) {
      const imgPath = path.join(UPLOAD_DIR, path.basename(article.imageUrl));
      if (fs.existsSync(imgPath)) {
        try { fs.unlinkSync(imgPath); } catch (e) {}
      }
    }

    db.run('DELETE FROM articles WHERE id = ?', [id], function (deleteErr) {
      if (deleteErr) {
        console.error('❌ Failed to delete article:', deleteErr.message);
        return res.status(500).json({ error: 'Database delete error' });
      }
      res.json({ message: 'Deleted', deleted: article });
    });
  });
});

module.exports = router;