const mongoose = require('../db/mongoose');

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  thumbnail: {
    type: String,
    trim: true
  },
  videoUrl: {
    type: String,
    required: true,
    trim: true
  },
  thumbnailPublicId: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Video', videoSchema);