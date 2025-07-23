const mongoose = require('../db/mongoose');

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  summary: {
    type: String,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Article', articleSchema);