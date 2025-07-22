const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const DATA_FILE = path.join(__dirname, '../data/articles.json');
const UPLOAD_DIR = path.join(__dirname, '../uploads/');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Helper: Load articles from file
function loadArticles() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to load articles:', err);
    return [];
  }
}

// Helper: Save articles to file
function saveArticles(articles) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(articles, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save articles:', err);
  }
}

const upload = multer({ dest: UPLOAD_DIR });

// Serve static files for uploaded images
router.use('/uploads', express.static(UPLOAD_DIR));

// GET all articles
router.get('/', (req, res) => {
  const articles = loadArticles();
  res.json(articles);
});

// GET single article
router.get('/:id', (req, res) => {
  const articles = loadArticles();
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
    // Remove uploaded file if present
    if (file) fs.unlinkSync(file.path);
    return res.status(400).json({ error: 'Title and content required' });
  }

  const articles = loadArticles();

  const newArticle = {
    id: Date.now().toString(),
    title,
    content,
    imageUrl: file ? `/uploads/${file.filename}` : null,
  };

  articles.push(newArticle);
  saveArticles(articles);
  res.status(201).json(newArticle);
});

// PUT update article
router.put('/:id', upload.single('file'), (req, res) => {
  const { title, content } = req.body;
  const id = req.params.id;
  const file = req.file;

  const articles = loadArticles();
  const index = articles.findIndex(a => a.id === id);
  if (index === -1) {
    if (file) fs.unlinkSync(file.path);
    return res.status(404).json({ error: 'Not found' });
  }

  // Optional file update
  if (file) {
    // Remove old image if exists
    if (articles[index].imageUrl) {
      const oldPath = path.join(UPLOAD_DIR, path.basename(articles[index].imageUrl));
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch (e) {}
      }
    }
    articles[index].imageUrl = `/uploads/${file.filename}`;
  }

  if (title) articles[index].title = title;
  if (content) articles[index].content = content;

  saveArticles(articles);
  res.json(articles[index]);
});

// DELETE article
router.delete('/:id', (req, res) => {
  const id = req.params.id;
  const articles = loadArticles();
  const index = articles.findIndex(a => a.id === id);
  if (index === -1) return res.status(404).json({ error: 'Not found' });

  // Remove image file if exists
  const deleted = articles.splice(index, 1)[0];
  if (deleted.imageUrl) {
    const imgPath = path.join(UPLOAD_DIR, path.basename(deleted.imageUrl));
    if (fs.existsSync(imgPath)) {
      try { fs.unlinkSync(imgPath); } catch (e) {}
    }
  }

  saveArticles(articles);
  res.json({ message: 'Deleted', deleted });
});

module.exports = router;