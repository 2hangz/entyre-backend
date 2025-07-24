const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Banner = require('../models/Banners');
const cloudinary = require('../utils/cloudinary');
const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
const upload = multer({ dest: UPLOAD_DIR });

// fetch all banners
router.get('/', async (req, res) => {
    try{
        const banners = await Banner.find().sort({createdAt: -1});
        res.json(banners);
    }
    catch(err){
        res.status(500).json({error:'Failed to fetch banners'})
    }
});

// Fetch single banner
router.get('/:id', async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ error: 'Banner not found' });
    res.json(banner);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching banner' });
  }
});

//create new banner
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { title, image } = req.body;
    let imageUrl = null;
    let imagePublicId = null;

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'entyre/banners',
      });
      imageUrl = result.secure_url;
      imagePublicId = result.public_id;

      await fs.promises.unlink(req.file.path);
    }

    const newBanner = new Banner({ title, image, imageUrl, imagePublicId });
    const saved = await newBanner.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Failed to create banner' });
  }
});

//edit banner content
router.put('/:id', upload.single('file'), async (req, res) => {
  try {
    const { title, image } = req.body;
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ error: 'Banner not found' });

    if (req.file) {
      if (banner.imagePublicId) {
        await cloudinary.uploader.destroy(banner.imagePublicId);
      }
      
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'entyre/banners',
      });
      banner.imageUrl = result.secure_url;
      banner.imagePublicId = result.public_id;

      await fs.promises.unlink(req.file.path);
    }

    banner.title = title ?? banner.title;
    banner.image = image ?? banner.image;
    const updated = await banner.save();
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Failed to update banner' });
  }
});

// Delete banner
router.delete('/:id', async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) return res.status(404).json({ error: 'Banner not found' });

    if (banner.imagePublicId) {
      await cloudinary.uploader.destroy(banner.imagePublicId);
    }

    res.json({ message: 'Deleted successfully', banner });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Failed to delete banner' });
  }
});

router.use('/uploads', express.static(UPLOAD_DIR));

module.exports = router;