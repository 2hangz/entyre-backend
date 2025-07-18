const express = require('express');
const router = express.Router();
const banners = require('../data/banners');

// fetch all banners
router.get('/', (req, res) => {
  res.json(banners);
});

// fetch single banner
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const banner = banners.find(b => b.id === id);
  if (!banner) {
    return res.status(404).json({ error: 'Banner pic not found' });
  }
  res.json(banner);
});

module.exports = router;