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
    content: {
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
      default: '',
      required: function() {
        return this.type === 'card';
      }
    },
    cardButtonLink: {
      type: String,
      trim: true,
      default: '',
      required: function() {
        return this.type === 'card';
      }
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
  // Ensure cardButtonText and cardButtonLink are strings for 'card' type
  if (this.type === 'card') {
    if (typeof this.cardButtonText !== 'string') {
      this.cardButtonText = this.cardButtonText ? String(this.cardButtonText) : '';
    }
    if (typeof this.cardButtonLink !== 'string') {
      this.cardButtonLink = this.cardButtonLink ? String(this.cardButtonLink) : '';
    }
  } else {
    // For non-card types, always set to empty string
    this.cardButtonText = '';
    this.cardButtonLink = '';
  }
  next();
});

// Also ensure on update (findOneAndUpdate) that cardButtonText/cardButtonLink are handled
HomeContentSectionSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update.type === 'card') {
    if (update.cardButtonText !== undefined && typeof update.cardButtonText !== 'string') {
      update.cardButtonText = update.cardButtonText ? String(update.cardButtonText) : '';
    }
    if (update.cardButtonLink !== undefined && typeof update.cardButtonLink !== 'string') {
      update.cardButtonLink = update.cardButtonLink ? String(update.cardButtonLink) : '';
    }
  } else {
    // For non-card types, always set to empty string
    update.cardButtonText = '';
    update.cardButtonLink = '';
  }
  update.updatedAt = new Date();
  this.setUpdate(update);
  next();
});

module.exports = mongoose.model('HomeContentSection', HomeContentSectionSchema);