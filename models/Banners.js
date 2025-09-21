const mongoose = require('../db/mongoose');

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    trim: true,
    default: ''
  },
  imageUrl: {
    type: String,
    trim: true
  },
  imagePublicId: {
    type: String
  },
  active: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true,
  strict: true
});

bannerSchema.index({ active: 1, createdAt: -1 });

bannerSchema.pre('save', function(next) {
  if (typeof this.active === 'string') {
    this.active = this.active.toLowerCase() === 'true';
  } else if (typeof this.active !== 'boolean') {
    this.active = Boolean(this.active);
  }
  
  if (this.image === null || this.image === undefined) {
    this.image = '';
  }
  
  next();
});

module.exports = mongoose.model('Banner', bannerSchema);