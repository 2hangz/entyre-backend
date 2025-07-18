const express = require('express');
const router = express.Router();
const videos = require('../data/videos');

router.get('/', (req, res) => {
    res.json(videos);
});

router.get('/:id', (req, res) => {
    const video = videos.find(v => v.id === parseInt(req.params.id));
    res.json(video);
});

module.exports = router;