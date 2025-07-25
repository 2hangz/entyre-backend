const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('../utils/cloudinary');
const router = express.Router();
const Video = require('../models/Videos');

const UPLOAD_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
const upload = multer({ dest: UPLOAD_DIR });

// Fetch all videos
router.get('/', async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    res.json(videos);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Fetch single video
router.get('/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: 'Video not found' });
    res.json(video);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching video' });
  }
});

// Create new video
router.post('/', upload.single('file'), async (req, res) => {
  try {
    let thumbnail = null;
    let thumbnailPublicId = null;

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'entyre/videosThumbnail'
      });
      thumbnail = result.secure_url;
      thumbnailPublicId = result.public_id;

      await fs.promises.unlink(req.file.path);
    }

    const { title, videoUrl } = req.body;
    const newVideo = new Video({ title, thumbnail, videoUrl, thumbnailPublicId });
    const saved = await newVideo.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Failed to create video' });
  }
});

// Edit video
router.put('/:id', upload.single('file'), async (req, res) => {
  try {
    const { title, videoUrl } = req.body;
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: 'Video not found' });

    if (req.file) {
      if (video.thumbnailPublicId) {
        await cloudinary.uploader.destroy(video.thumbnailPublicId);
      }
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'entyre/videosThumbnail'
      });
      video.thumbnail = result.secure_url;
      video.thumbnailPublicId = result.public_id;

      await fs.promises.unlink(req.file.path);
    }
    video.title = title ?? video.title;
    video.videoUrl = videoUrl ?? video.videoUrl;

    const updated = await video.save();
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Failed to update video' });
  }
});

// Delete video
router.delete('/:id', async (req, res) => {
  try {
    const video = await Video.findByIdAndDelete(req.params.id);
    if (!video) return res.status(404).json({ error: 'Video not found' });

    if (video.thumbnailPublicId) {
      await cloudinary.uploader.destroy(video.thumbnailPublicId);
    }
    res.json({ message: 'Deleted successfully', video });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Failed to delete video' });
  }
});

router.use('/uploads', express.static(UPLOAD_DIR));
module.exports = router;