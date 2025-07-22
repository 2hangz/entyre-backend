const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// 临时内存存储（你也可以用 ../data/articles.json 加载）
let articles = [];

const upload = multer({ dest: path.join(__dirname, '../uploads/') });

// Serve static files
router.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// GET all articles
router.get('/', (req, res) => {
  res.json(articles);
});

// GET single article
router.get('/:id', (req, res) => {
  const id = req.params.id;
  const article = articles.find(a => a.id === id);
  if (!article) return res.status(404).json({ error: 'Not found' });
  res.json(article);
});

// POST new article (with optional file)
router.post('/', upload.single('file'), (req, res) => {
  const { title, content } = req.body;
  const file = req.file;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content required' });
  }

  const newArticle = {
    id: Date.now().toString(),
    title,
    content,
    imageUrl: file ? `/uploads/${file.filename}` : null,
  };

  articles.push(newArticle);
  res.status(201).json(newArticle);
});

// PUT update article
router.put('/:id', upload.single('file'), (req, res) => {
  const { title, content } = req.body;
  const id = req.params.id;
  const file = req.file;

  const index = articles.findIndex(a => a.id === id);
  if (index === -1) return res.status(404).json({ error: 'Not found' });

  // Optional file update
  if (file) {
    articles[index].imageUrl = `/uploads/${file.filename}`;
  }

  articles[index].title = title || articles[index].title;
  articles[index].content = content || articles[index].content;

  res.json(articles[index]);
});

// DELETE article
router.delete('/:id', (req, res) => {
  const id = req.params.id;
  const index = articles.findIndex(a => a.id === id);
  if (index === -1) return res.status(404).json({ error: 'Not found' });

  const deleted = articles.splice(index, 1);
  res.json({ message: 'Deleted', deleted });
});

module.exports = router;