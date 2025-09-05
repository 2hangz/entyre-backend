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
    cardButtonText: {
      type: String,
      trim: true,
      default: '',
      required: function () {
        return this.type === 'card';
      }
    },
    cardButtonLink: {
      type: String,
      trim: true,
      default: '',
      required: function () {
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
  if (this.type === 'card') {
    this.cardButtonText = this.cardButtonText ? String(this.cardButtonText) : '';
    this.cardButtonLink = this.cardButtonLink ? String(this.cardButtonLink) : '';
  } else {
    this.cardButtonText = '';
    this.cardButtonLink = '';
  }
  next();
});


HomeContentSectionSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update.type === 'card') {
    update.cardButtonText = update.cardButtonText ? String(update.cardButtonText) : '';
    update.cardButtonLink = update.cardButtonLink ? String(update.cardButtonLink) : '';
  } else if (update.type) {
    update.cardButtonText = '';
    update.cardButtonLink = '';
  }
  update.updatedAt = new Date();
  this.setUpdate(update);
  next();
});

module.exports = mongoose.model('HomeContentSection', HomeContentSectionSchema);