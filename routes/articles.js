const express = require('express');
const router = express.Router();
const articles = require('../data/articles');

// fetch all articles
router.get('/', (req, res) => {
  res.json(articles);
});

// fetch single article
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const article = articles.find(a => a.id === id);
  if (!article) {
    return res.status(404).json({ error: 'Article not found' });
  }
  res.json(article);
});

module.exports = router;
