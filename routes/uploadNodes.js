const express = require('express');
const multer = require('multer');
const fs = require('fs');
const cloudinary = require('../utils/cloudinary');
const router = express.Router();

const upload = multer({ dest: 'uploads/' });

router.post('/upload-icon', upload.single('file'), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'entyre/workflowFiles',
    });

    await fs.promises.unlink(req.file.path);

    return res.json({
      fileUrl: result.secure_url,
      publicId: result.public_id,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Upload failed', details: err.message });
  }
});

module.exports = router;