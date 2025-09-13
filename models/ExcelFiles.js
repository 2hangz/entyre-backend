const mongoose = require('mongoose');

const excelFileSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
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
    type: Number,
    default: 0
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
    lastProcessed: {
      type: Date,
      default: Date.now
    },
    rowCount: Number,
    hasWeights: Boolean
  },
  scenarioType: {
    type: String,
    enum: ['econ', 'enviro', 'tech', 'equal', 'hier', 'unknown'],
    default: 'unknown'
  },
  scopeType: {
    type: String,
    enum: ['global', 'local', 'unknown'],
    default: 'unknown'
  }
}, {
  timestamps: true
});

excelFileSchema.index({ isActive: 1, scenarioType: 1, scopeType: 1 });
excelFileSchema.index({ originalName: 1 });
excelFileSchema.index({ category: 1, isActive: 1 });

excelFileSchema.pre('save', function(next) {
  if (this.isModified('originalName')) {
    const fileName = this.originalName.toLowerCase();

    if (fileName.includes('econ')) {
      this.scenarioType = 'econ';
    } else if (fileName.includes('enviro') || fileName.includes('env')) {
      this.scenarioType = 'enviro';
    } else if (fileName.includes('tech')) {
      this.scenarioType = 'tech';
    } else if (fileName.includes('equal')) {
      this.scenarioType = 'equal';
    } else if (fileName.includes('hier')) {
      this.scenarioType = 'hier';
    } else {
      this.scenarioType = 'unknown';
    }

    if (
      fileName.includes('_g_') ||
      fileName.includes('_g.') ||
      fileName.includes('_global') ||
      fileName.includes('global') ||
      /[_\s]g[_\s\.]/.test(fileName)
    ) {
      this.scopeType = 'global';
    } else if (
      fileName.includes('_l_') ||
      fileName.includes('_l.') ||
      fileName.includes('_local') ||
      fileName.includes('local') ||
      /[_\s]l[_\s\.]/.test(fileName)
    ) {
      this.scopeType = 'local';
    } else {
      this.scopeType = 'unknown';
    }

    console.log(`File name analysis: ${this.originalName} -> scenario: ${this.scenarioType}, scope: ${this.scopeType}`);
  }

  next();
});

excelFileSchema.methods.getScenarioId = function() {
  if (this.scenarioType === 'unknown' || this.scopeType === 'unknown') {
    return null;
  }

  const typeMap = {
    econ: 'Econ',
    enviro: 'Enviro',
    tech: 'Tech',
    equal: 'Equal',
    hier: 'Hier'
  };

  const scopeMap = {
    global: 'G',
    local: 'L'
  };

  return `${typeMap[this.scenarioType]}_${scopeMap[this.scopeType]}`;
};

excelFileSchema.statics.findByScenarioId = function(scenarioId) {
  const [typeRaw, scopeRaw] = scenarioId.split('_');

  const reverseTypeMap = {
    'Econ': 'econ',
    'Enviro': 'enviro',
    'Tech': 'tech',
    'Equal': 'equal',
    'Hier': 'hier'
  };

  const reverseScopeMap = {
    'G': 'global',
    'L': 'local'
  };

  const scenarioType = reverseTypeMap[typeRaw];
  const scopeType = reverseScopeMap[scopeRaw];

  return this.findOne({
    scenarioType,
    scopeType,
    isActive: true
  }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('ExcelFile', excelFileSchema);