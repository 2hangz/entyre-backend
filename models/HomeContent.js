const mongoose = require('mongoose');

const MarkdownSectionSchema = new mongoose.Schema({
  sectionIndex: {
    type: Number,
    required: true,
    unique: true
  },
  content: {
    type: String,
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('MarkdownSection', MarkdownSectionSchema);
