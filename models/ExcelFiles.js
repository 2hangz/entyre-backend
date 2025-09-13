const mongoose = require('../db/mongoose');

const excelFileSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['comparison', 'analysis', 'visualization', 'other'],
    default: 'analysis'
  },
  fileUrl: {
    type: String,
    required: true,
    trim: true
  },
  filePublicId: {
    type: String,
    required: true,
    trim: true
  },
  originalName: {
    type: String,
    required: true,
    trim: true
  },
  fileSize: {
    type: Number
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  metadata: {
    sheetNames: [String],
    columnInfo: mongoose.Schema.Types.Mixed,
    lastProcessed: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('ExcelFile', excelFileSchema);