const mongoose = require('mongoose');

const MarkdownSectionSchema = new mongoose.Schema(
  {
    sectionIndex: {
      type: Number,
      required: true,
      unique: true,
      index: true
    },
    title: {
      type: String,
      default: '',
      trim: true
    },
    type: {
      type: String,
      enum: ['text', 'key-value', 'image'],
      default: 'text'
    },
    content: {
      type: String,
      required: true,
      default: ''
    },
    isVisible: {
      type: Boolean,
      default: true
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { versionKey: false }
);

MarkdownSectionSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('MarkdownSection', MarkdownSectionSchema);