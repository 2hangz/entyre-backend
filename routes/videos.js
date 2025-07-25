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

//fetch all videos
router.get('/', async (req, res) => {
        const videos = await Video.find().sort({createdAt:-1});
        res.json(videos);
});

//fetch sigle video
router.get('/:id', async (req, res) =>{
        const video = await Video.findById(req.params.id);
        res.json(video);
})

//create new video
router.post('/', upload.single('file'), async(req, res) =>{
    let thumbnail =null;
    let thumbnailPublicId =null;

    if(req.file){
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'entyre/videosThumbnail'
        });
        thumbnail = result.secure_url;
        thumbnailPublicId = result.public_id

        await fs.promises.unlink(req.file.path);
    }

    const {title, videoUrl} = req.body;
    const saved = await new Video({title, thumbnail, videoUrl, thumbnailPublicId}).save();
    res.json(saved);
});

//editing
router.put('/:id', upload.single('file'), async (req, res) => {
    const { title, videoUrl } = req.body;
    const video = await Video.findById(req.params.id);
    if (req.file){
        if (video.thumbnailPublicId) {
            await cloudinary.uploader.destroy(video.thumbnailPublicId);
          }
        const result = await cloudinary.uploader.upload(req.file.path,{folder:'entyre/videosThumbnail'});
        video.thumbnail = result.secure_url;
        video.thumbnailPublicId = result.public_id;

        await fs.promises.unlink(req.file.path);
    }
    video.title = title ?? video.title;
    video.videoUrl = videoUrl ?? video.videoUrl;

    const updated = await video.save();
    res.json(updated);
})

//delete
router.delete('/:id', async (req, res)=>{
    const video = await Video.findByIdAndDelete(req.params.id);
    if (video.thumbnailPublicId){
        await cloudinary.uploader.destroy(video.thumbnailPublicId);
        res.json({ message: 'Deleted successfully', video });
    }
})

router.use('/uploads', express.static(UPLOAD_DIR));
module.exports = router;