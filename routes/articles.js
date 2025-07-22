const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Article = require('../models/Article');

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const upload = multer({ dest: UPLOAD_DIR });

// 🔹 GET 所有文章
router.get('/', async (req, res) => {
  try {
    const articles = await Article.find().sort({ createdAt: -1 });
    res.json(articles);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

// 🔹 GET 单篇文章
router.get('/:id', async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json(article);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching article' });
  }
});

// 🔹 POST 新建文章
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { title, content } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const newArticle = new Article({ title, content, imageUrl });
    const saved = await newArticle.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create article' });
  }
});

// 🔹 PUT 更新文章
router.put('/:id', upload.single('file'), async (req, res) => {
  try {
    const { title, content } = req.body;
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ error: 'Article not found' });

    // 如果有新图，删除旧图
    if (req.file) {
      if (article.imageUrl) {
        const oldPath = path.join(UPLOAD_DIR, path.basename(article.imageUrl));
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      article.imageUrl = `/uploads/${req.file.filename}`;
    }

    article.title = title ?? article.title;
    article.content = content ?? article.content;

    const updated = await article.save();
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update article' });
  }
});

// 🔹 DELETE 删除文章
router.delete('/:id', async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article) return res.status(404).json({ error: 'Article not found' });

    // 删除图片文件
    if (article.imageUrl) {
      const imgPath = path.join(UPLOAD_DIR, path.basename(article.imageUrl));
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    res.json({ message: 'Deleted successfully', article });
  } catch (err) {
    res.status(400).json({ error: 'Failed to delete article' });
  }
});

// 🔹 图片静态资源
router.use('/uploads', express.static(UPLOAD_DIR));

module.exports = router;
