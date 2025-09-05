const mongoose = require('mongoose');

const HomeContentSectionSchema = new mongoose.Schema(
  {
    sectionIndex: {
      type: Number,
      required: true,
      unique: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['text', 'key-value', 'image', 'card'],
      default: 'text'
    },
    // For 'card' type, you may want to store button text and button link
    cardButtonText: {
      type: String,
      trim: true,
      default: ''
    },
    cardButtonLink: {
      type: String,
      trim: true,
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

HomeContentSectionSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('HomeContentSection', HomeContentSectionSchema);