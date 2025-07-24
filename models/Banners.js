const mongoose = require('../db/mongoose');

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  imageUrl: {
    type: String,
    trim: true
  },
  imagePublicId:{
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Banner', bannerSchema);