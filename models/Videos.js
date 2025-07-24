const mongoose = require('../db/mongoose');

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  videoUrl: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Video', videoSchema);