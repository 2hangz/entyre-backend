const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Article = require('../models/Articles');
const cloudinary = require('../utils/cloudinary');

const router = express.Router();

// config temporary dir
const UPLOAD_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const upload = multer({ dest: UPLOAD_DIR });

// fetch all articles
router.get('/', async (req, res) => {
  try {
    const articles = await Article.find().sort({ createdAt: -1 });
    res.json(articles);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

// fetch single articles
router.get('/:id', async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json(article);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching article' });
  }
});

// create article
router.post('/', upload.single('file'), async (req, res) => {
  try {
    let imageUrl = null;
    let imagePublicId = null;

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'entyre',
      });
      imageUrl = result.secure_url;
      imagePublicId = result.public_id;

      await fs.promises.unlink(req.file.path);
    }

    const { title, summary, content } = req.body;
    const newArticle = new Article({ title, summary, content, imageUrl, imagePublicId });
    const saved = await newArticle.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Failed to create article' });
  }
});

// editing
router.put('/:id', upload.single('file'), async (req, res) => {
  try {
    const { title, summary, content } = req.body;
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ error: 'Article not found' });

    if (req.file) {
      if (article.imagePublicId) {
        await cloudinary.uploader.destroy(article.imagePublicId);
      }

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'entyre',
      });
      article.imageUrl = result.secure_url;
      article.imagePublicId = result.public_id;

      await fs.promises.unlink(req.file.path);
    }

    article.title = title ?? article.title;
    article.summary = summary ?? article.summary;
    article.content = content ?? article.content;

    const updated = await article.save();
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Failed to update article' });
  }
});

// delete
router.delete('/:id', async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article) return res.status(404).json({ error: 'Article not found' });

    if (article.imagePublicId) {
      await cloudinary.uploader.destroy(article.imagePublicId);
    }

    res.json({ message: 'Deleted successfully', article });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Failed to delete article' });
  }
});

module.exports = router;
