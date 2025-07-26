const express = require('express');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const MCDA = require('../models/Mcda');
const cloudinary = require('../utils/cloudinary');
const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
const upload = multer({ dest: UPLOAD_DIR });

// upload new file
router.post('/', upload.single('file'), async (req, res) => {
  try {
    let fileUrl = null;
    let filePublicId = null;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "raw",
      folder: "entyre/mcda"
    });
    fileUrl = result.secure_url;
    filePublicId = result.public_id;

    await fs.promises.unlink(req.file.path);

    const newMcda = new MCDA({
      fileUrl,
      filePublicId,
      originalName: req.file.originalname
    });
    const saved = await newMcda.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to upload MCDA file' });
  }
});

// fetch all files
router.get('/', async (req, res) => {
  try {
    const files = await MCDA.find();
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch MCDA files' });
  }
});

// fetch single
router.get('/:id', async (req, res) => {
  try {
    const file = await MCDA.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });
    res.json(file);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching MCDA file' });
  }
});

// delete
router.delete('/:id', async (req, res) => {
  try {
    const file = await MCDA.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });

    if (file.filePublicId) {
      await cloudinary.uploader.destroy(file.filePublicId, { resource_type: "raw" });
    }

    await MCDA.findByIdAndDelete(req.params.id);
    res.json({ message: 'File deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete MCDA file' });
  }
});

module.exports = router;