// models/HomeContent.js
const mongoose = require('mongoose');

const HomeContentSectionSchema = new mongoose.Schema(
  {
    sectionIndex: { type: Number, required: true, unique: true, index: true },
    type: { type: String, required: true },   // 不限制 enum
    content: { type: mongoose.Schema.Types.Mixed, default: {} }, // JSON object
    isVisible: { type: Boolean, default: true },
    updatedAt: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

HomeContentSectionSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

HomeContentSectionSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  update.updatedAt = new Date();
  this.setUpdate(update);
  next();
});

module.exports = mongoose.model('HomeContentSection', HomeContentSectionSchema);
