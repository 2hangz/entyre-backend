const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Banner = require('../models/Banners');
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
        const {title, image} = req.body;
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

        const newBanner= new Banner({ title, image, imageUrl });
        const saved = await newBanner.save();
        res.status(201).json(saved);
    } catch(err){
        res.status(400).json({ error: 'Failed to create banner' });
    }
});

//edit banner content
router.put('/:id', upload.single('file'), async (req, res) => {
    try {
        const { title, image } = req.body;
        const banner = await Banner.findById(req.params.id);
        if (!banner) return res.status(404).json({error:'Banner not found'});
        
        if (req.file) {
            if (banner.imageUrl) {
              const oldPath = path.join(UPLOAD_DIR, path.basename(banner.imageUrl));
              if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            banner.imageUrl = `/uploads/${req.file.filename}`;
          }
          banner.title = title ?? banner.title;
          banner.image = image ?? banner.image;
          const updated = await banner.save();
          res.json(updated);
    } catch(err){
        res.status(400).json({ error: 'Failed to update banner' });
    }
});

// Delete banner
router.delete('/:id', async (req, res) => {
    try {
      const banner = await Banner.findByIdAndDelete(req.params.id);
      if (!banner) return res.status(404).json({ error: 'Banner not found' });
  
      if (banner.imageUrl) {
        const imgPath = path.join(UPLOAD_DIR, path.basename(banner.imageUrl));
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      }
  
      res.json({ message: 'Deleted successfully', banner });
    } catch (err) {
      res.status(400).json({ error: 'Failed to delete banner' });
    }
  });
  
  router.use('/uploads', express.static(UPLOAD_DIR));

module.exports = router;