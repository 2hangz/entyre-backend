const mongoose = require('../db/mongoose');

const mcdaSchema = new mongoose.Schema({
  fileUrl: {
    type: String,
    required: true
  },
  filePublicId: {
    type: String
  },
  originalName: {
    type: String
  }
});

module.exports = mongoose.model('MCDA', mcdaSchema);