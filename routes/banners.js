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

const normalizeActiveFlag = (value) => {
  console.log('Normalizing active flag:', value, 'type:', typeof value);
  
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true';
  }
  if (typeof value === 'number') return value !== 0;
  return value === undefined || value === null ? true : Boolean(value);
};

// Fetch all banners (for admin/CMS use)
router.get('/all', async (req, res) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 }).lean();
    const normalized = banners.map((banner) => ({
      ...banner,
      active: normalizeActiveFlag(banner.active),
    }));
    console.log('Fetched all banners for admin:', normalized.length);
    res.json(normalized);
  } catch (err) {
    console.error('Error fetching all banners:', err);
    res.status(500).json({ error: 'Failed to fetch banners' });
  }
});

// Fetch only active banners (for public carousel)
router.get('/', async (req, res) => {
  try {
    const banners = await Banner.find({ active: true }).sort({ createdAt: -1 }).lean();
    const normalized = banners.map((banner) => ({
      ...banner,
      active: normalizeActiveFlag(banner.active),
    }));
    console.log('Fetched active banners for public:', normalized.length);
    res.json(normalized);
  } catch (err) {
    console.error('Error fetching active banners:', err);
    res.status(500).json({ error: 'Failed to fetch banners' });
  }
});

// Fetch single banner
router.get('/:id', async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ error: 'Banner not found' });
    
    const normalizedBanner = {
      ...banner.toObject(),
      active: normalizeActiveFlag(banner.active)
    };
    
    res.json(normalizedBanner);
  } catch (err) {
    console.error('Error fetching single banner:', err);
    res.status(500).json({ error: 'Error fetching banner' });
  }
});

// Create new banner
router.post('/', upload.single('file'), async (req, res) => {
  try {
    console.log('Creating banner with body:', req.body);
    
    const { title, image, active } = req.body;
    let imageUrl = null;
    let imagePublicId = null;

    // Validate required fields
    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required' });
    }

    if (req.file) {
      console.log('Uploading file to cloudinary...');
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'entyre/banners',
      });
      imageUrl = result.secure_url;
      imagePublicId = result.public_id;
      console.log('File uploaded successfully:', imageUrl);

      await fs.promises.unlink(req.file.path);
    }

    const activeValue = normalizeActiveFlag(active);
    console.log('Normalized active value:', activeValue);

    const bannerData = {
      title: title.trim(),
      imageUrl,
      imagePublicId,
      active: activeValue
    };

    // Only include image field if it's provided and not empty
    if (image && image.trim() !== '') {
      bannerData.image = image.trim();
    }

    console.log('Creating banner with data:', bannerData);

    const newBanner = new Banner(bannerData);
    const saved = await newBanner.save();
    
    console.log('Banner saved successfully:', saved._id);
    res.status(201).json(saved);
  } catch (err) {
    console.error('Error creating banner:', err);
    
    // Provide more specific error messages
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: `Validation error: ${errors.join(', ')}` });
    }
    
    res.status(400).json({ error: 'Failed to create banner: ' + err.message });
  }
});

// Edit banner content
router.put('/:id', upload.single('file'), async (req, res) => {
  try {
    console.log('Updating banner with body:', req.body);
    
    const { title, image, active } = req.body;
    const banner = await Banner.findById(req.params.id);
    
    if (!banner) return res.status(404).json({ error: 'Banner not found' });

    if (req.file) {
      console.log('Updating banner image...');
      // Delete old image from cloudinary if exists
      if (banner.imagePublicId) {
        await cloudinary.uploader.destroy(banner.imagePublicId);
      }
      
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'entyre/banners',
      });
      banner.imageUrl = result.secure_url;
      banner.imagePublicId = result.public_id;
      console.log('Banner image updated:', result.secure_url);

      await fs.promises.unlink(req.file.path);
    }

    // Update fields only if provided
    if (title !== undefined && title !== null) {
      banner.title = title.trim();
    }
    
    if (image !== undefined && image !== null) {
      banner.image = image.trim();
    }

    if (active !== undefined && active !== null) {
      const activeValue = normalizeActiveFlag(active);
      banner.active = activeValue;
      console.log('Updated active value:', activeValue);
    }

    const updated = await banner.save();
    console.log('Banner updated successfully:', updated._id);
    res.json(updated);
  } catch (err) {
    console.error('Error updating banner:', err);
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: `Validation error: ${errors.join(', ')}` });
    }
    
    res.status(400).json({ error: 'Failed to update banner: ' + err.message });
  }
});

// Delete banner
router.delete('/:id', async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) return res.status(404).json({ error: 'Banner not found' });

    // Delete image from cloudinary if exists
    if (banner.imagePublicId) {
      await cloudinary.uploader.destroy(banner.imagePublicId);
      console.log('Deleted image from cloudinary:', banner.imagePublicId);
    }

    console.log('Banner deleted successfully:', banner._id);
    res.json({ message: 'Deleted successfully', banner });
  } catch (err) {
    console.error('Error deleting banner:', err);
    res.status(400).json({ error: 'Failed to delete banner: ' + err.message });
  }
});

router.use('/uploads', express.static(UPLOAD_DIR));

module.exports = router;