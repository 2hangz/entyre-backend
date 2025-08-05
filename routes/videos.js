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

// Get all videos
router.get('/', async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    res.json(videos);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch videos.' });
  }
});

// Get a single video by ID
router.get('/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found.' });
    }
    res.json(video);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch video.' });
  }
});

// Create a new video with optional thumbnail and local video file (now uploads video to cloudinary)
router.post(
  '/',
  upload.fields([
    { name: 'file', maxCount: 1 }, // Thumbnail
    { name: 'localVideo', maxCount: 1 }, // Local video file
  ]),
  async (req, res) => {
    let thumbnail = null;
    let thumbnailPublicId = null;
    let videoCloudUrl = null;
    let videoCloudPublicId = null;

    try {
      // Upload thumbnail to Cloudinary if provided
      if (req.files && req.files['file'] && req.files['file'][0]) {
        const result = await cloudinary.uploader.upload(req.files['file'][0].path, {
          folder: 'entyre/videosThumbnail',
        });
        thumbnail = result.secure_url;
        thumbnailPublicId = result.public_id;
        await fs.promises.unlink(req.files['file'][0].path);
      }

      // Upload local video file to Cloudinary if provided
      if (req.files && req.files['localVideo'] && req.files['localVideo'][0]) {
        const localFile = req.files['localVideo'][0];
        // Upload as video resource
        const videoResult = await cloudinary.uploader.upload(localFile.path, {
          resource_type: 'video',
          folder: 'entyre/videos',
        });
        videoCloudUrl = videoResult.secure_url;
        videoCloudPublicId = videoResult.public_id;
        await fs.promises.unlink(localFile.path);
      }

      const { title, videoUrl } = req.body;

      const saved = await new Video({
        title,
        thumbnail,
        videoUrl: videoCloudUrl || videoUrl,
        thumbnailPublicId,
        localVideoPublicId: videoCloudPublicId,
      }).save();

      res.json(saved);
    } catch (err) {
      res.status(500).json({ error: 'Failed to create video.' });
    }
  }
);

// Edit a video (replace thumbnail and/or local video file, now uploads video to cloudinary)
router.put(
  '/:id',
  upload.fields([
    { name: 'file', maxCount: 1 }, // Thumbnail
    { name: 'localVideo', maxCount: 1 }, // Local video file
  ]),
  async (req, res) => {
    try {
      const { title, videoUrl } = req.body;
      const video = await Video.findById(req.params.id);

      if (!video) {
        return res.status(404).json({ error: 'Video not found.' });
      }

      // Replace thumbnail if a new one is provided
      if (req.files && req.files['file'] && req.files['file'][0]) {
        if (video.thumbnailPublicId) {
          await cloudinary.uploader.destroy(video.thumbnailPublicId);
        }
        const result = await cloudinary.uploader.upload(req.files['file'][0].path, {
          folder: 'entyre/videosThumbnail',
        });
        video.thumbnail = result.secure_url;
        video.thumbnailPublicId = result.public_id;
        await fs.promises.unlink(req.files['file'][0].path);
      }

      // Replace local video file if a new one is provided (upload to cloudinary)
      if (req.files && req.files['localVideo'] && req.files['localVideo'][0]) {
        // Delete old video from Cloudinary if exists
        if (video.localVideoPublicId) {
          await cloudinary.uploader.destroy(video.localVideoPublicId, { resource_type: 'video' });
        }
        const localFile = req.files['localVideo'][0];
        const videoResult = await cloudinary.uploader.upload(localFile.path, {
          resource_type: 'video',
          folder: 'entyre/videos',
        });
        video.videoUrl = videoResult.secure_url;
        video.localVideoPublicId = videoResult.public_id;
        await fs.promises.unlink(localFile.path);
      } else if (videoUrl) {
        // If a cloud video URL is provided, use it and clear local video info
        // Also, if there was a previous cloudinary video, delete it
        if (video.localVideoPublicId) {
          await cloudinary.uploader.destroy(video.localVideoPublicId, { resource_type: 'video' });
        }
        video.videoUrl = videoUrl;
        video.localVideoPublicId = null;
      }

      if (typeof title !== 'undefined') {
        video.title = title;
      }

      const updated = await video.save();
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update video.' });
    }
  }
);

// Delete a video (also delete thumbnail and cloudinary video if present)
router.delete('/:id', async (req, res) => {
  try {
    const video = await Video.findByIdAndDelete(req.params.id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found.' });
    }
    // Delete thumbnail from Cloudinary if exists
    if (video.thumbnailPublicId) {
      await cloudinary.uploader.destroy(video.thumbnailPublicId);
    }
    // Delete video from Cloudinary if exists
    if (video.localVideoPublicId) {
      await cloudinary.uploader.destroy(video.localVideoPublicId, { resource_type: 'video' });
    }
    res.json({ message: 'Deleted successfully', video });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete video.' });
  }
});

// Serve uploaded files statically (for backward compatibility, but not used for new videos)
router.use('/uploads', express.static(UPLOAD_DIR));

module.exports = router;