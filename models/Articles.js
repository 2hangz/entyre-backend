const mongoose = require('../db/mongoose');

const articleSchema = new mongoose.Schema({
  title: String,
  content: String,
  imageUrl: String,
}, { timestamps: true });

module.exports = mongoose.model('Article', articleSchema);