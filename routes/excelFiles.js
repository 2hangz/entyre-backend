const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const ExcelFile = require('../models/ExcelFiles');
const cloudinary = require('cloudinary').v2;

const router = express.Router();

// Configure Cloudinary (make sure to set environment variables)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure upload directory
const UPLOAD_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure multer
const upload = multer({ 
  dest: UPLOAD_DIR,
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/vnd.ms-excel.sheet.macroEnabled.12'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Utility function: Analyze Excel file
function analyzeExcelFile(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);
    const metadata = {
      sheetNames: workbook.SheetNames,
      columnInfo: {},
      lastProcessed: new Date(),
      rowCount: 0,
      hasWeights: false
    };
    
    // Analyze each sheet
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (data.length > 0) {
        // Store column info (assume row 3 is header)
        const headerRowIndex = Math.min(2, data.length - 1);
        if (data[headerRowIndex]) {
          metadata.columnInfo[sheetName] = data[headerRowIndex].filter(col => col !== null && col !== undefined);
        }
        
        metadata.rowCount = Math.max(metadata.rowCount, data.length);
        
        // Check if there is a weight row
        const hasWeightRow = data.some(row => 
          row && row[0] && row[0].toString().toLowerCase().includes('weight')
        );
        if (hasWeightRow) {
          metadata.hasWeights = true;
        }
      }
    });
    
    return metadata;
  } catch (error) {
    console.error('Error analyzing Excel file:', error);
    return {
      sheetNames: [],
      columnInfo: {},
      lastProcessed: new Date(),
      rowCount: 0,
      hasWeights: false,
      error: error.message
    };
  }
}

// GET /api/excel-files - Get all Excel files
router.get('/', async (req, res) => {
  try {
    const { category, active, scenarioType, scopeType } = req.query;
    let query = {};
    
    if (category) query.category = category;
    if (active !== undefined) query.isActive = active === 'true';
    if (scenarioType) query.scenarioType = scenarioType;
    if (scopeType) query.scopeType = scopeType;
    
    const files = await ExcelFile.find(query).sort({ createdAt: -1 });
    res.json(files);
  } catch (err) {
    console.error('Failed to get Excel file list:', err);
    res.status(500).json({ error: 'Failed to get Excel file list' });
  }
});

// GET /api/excel-files/:id - Get single Excel file info
router.get('/:id', async (req, res) => {
  try {
    const file = await ExcelFile.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'Excel file not found' });
    res.json(file);
  } catch (err) {
    console.error('Failed to get Excel file:', err);
    res.status(500).json({ error: 'Failed to get Excel file' });
  }
});

// POST /api/excel-files - Upload new Excel file
router.post('/', upload.single('file'), async (req, res) => {
  let tempFilePath = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please provide an Excel file' });
    }

    tempFilePath = req.file.path;
    const { title, description, category, tags } = req.body;
    
    // Analyze Excel file
    console.log('Analyzing Excel file...');
    const metadata = analyzeExcelFile(tempFilePath);
    
    // Upload to Cloudinary
    console.log('Uploading to Cloudinary...');
    const result = await cloudinary.uploader.upload(tempFilePath, {
      folder: 'entyre/excel-files',
      resource_type: 'raw',
      public_id: `excel_${Date.now()}_${path.parse(req.file.originalname).name}`
    });

    // Create database record
    const newFile = new ExcelFile({
      title: title || path.parse(req.file.originalname).name,
      description: description || '',
      category: category || 'analysis',
      fileUrl: result.secure_url,
      filePublicId: result.public_id,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
      metadata
    });

    const saved = await newFile.save();
    
    console.log(`Excel file uploaded successfully: ${saved.originalName}, Scenario: ${saved.getScenarioId()}`);
    res.status(201).json(saved);
    
  } catch (err) {
    console.error('Failed to upload Excel file:', err);
    res.status(400).json({ 
      error: 'Failed to upload Excel file', 
      details: err.message 
    });
  } finally {
    // Clean up temp file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        await fs.promises.unlink(tempFilePath);
      } catch (unlinkError) {
        console.error('Failed to delete temp file:', unlinkError);
      }
    }
  }
});

// PUT /api/excel-files/:id - Update Excel file
router.put('/:id', upload.single('file'), async (req, res) => {
  let tempFilePath = null;
  
  try {
    const { title, description, category, tags, isActive } = req.body;
    const file = await ExcelFile.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'Excel file not found' });

    // If a new file is uploaded
    if (req.file) {
      tempFilePath = req.file.path;
      
      // Delete old file from Cloudinary
      if (file.filePublicId) {
        await cloudinary.uploader.destroy(file.filePublicId, { resource_type: 'raw' });
      }

      // Analyze new file
      const metadata = analyzeExcelFile(tempFilePath);

      // Upload new file
      const result = await cloudinary.uploader.upload(tempFilePath, {
        folder: 'entyre/excel-files',
        resource_type: 'raw',
        public_id: `excel_${Date.now()}_${path.parse(req.file.originalname).name}`
      });

      file.fileUrl = result.secure_url;
      file.filePublicId = result.public_id;
      file.originalName = req.file.originalname;
      file.fileSize = req.file.size;
      file.metadata = metadata;
    }

    // Update other fields
    if (title !== undefined) file.title = title;
    if (description !== undefined) file.description = description;
    if (category !== undefined) file.category = category;
    if (isActive !== undefined) file.isActive = isActive === 'true';
    if (tags !== undefined) file.tags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);

    const updated = await file.save();
    console.log(`Excel file updated successfully: ${updated.originalName}`);
    res.json(updated);
    
  } catch (err) {
    console.error('Failed to update Excel file:', err);
    res.status(400).json({ 
      error: 'Failed to update Excel file', 
      details: err.message 
    });
  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        await fs.promises.unlink(tempFilePath);
      } catch (unlinkError) {
        console.error('Failed to delete temp file:', unlinkError);
      }
    }
  }
});

// DELETE /api/excel-files/:id - Delete Excel file
router.delete('/:id', async (req, res) => {
  try {
    const file = await ExcelFile.findByIdAndDelete(req.params.id);
    if (!file) return res.status(404).json({ error: 'Excel file not found' });

    // Delete file from Cloudinary
    if (file.filePublicId) {
      await cloudinary.uploader.destroy(file.filePublicId, { resource_type: 'raw' });
    }

    console.log(`Excel file deleted successfully: ${file.originalName}`);
    res.json({ message: 'Excel file deleted successfully', file });
  } catch (err) {
    console.error('Failed to delete Excel file:', err);
    res.status(400).json({ error: 'Failed to delete Excel file' });
  }
});

// GET /api/excel-files/:id/content - Get file content info
router.get('/:id/content', async (req, res) => {
  try {
    const file = await ExcelFile.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'Excel file not found' });

    res.json({
      fileUrl: file.fileUrl,
      metadata: file.metadata,
      title: file.title,
      category: file.category,
      scenarioId: file.getScenarioId(),
      scenarioType: file.scenarioType,
      scopeType: file.scopeType
    });
  } catch (err) {
    console.error('Failed to get file content info:', err);
    res.status(500).json({ error: 'Failed to get file content info' });
  }
});

// GET /api/excel-files/meta/categories - Get all categories
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await ExcelFile.distinct('category');
    res.json(categories);
  } catch (err) {
    console.error('Failed to get categories:', err);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

// GET /api/excel-files/meta/scenarios - Get all scenario types
router.get('/meta/scenarios', async (req, res) => {
  try {
    const files = await ExcelFile.find({ isActive: true });
    const scenarios = files.map(file => ({
      id: file.getScenarioId(),
      scenarioType: file.scenarioType,
      scopeType: file.scopeType,
      title: file.title,
      originalName: file.originalName
    })).filter(s => s.id);
    
    res.json(scenarios);
  } catch (err) {
    console.error('Failed to get scenario list:', err);
    res.status(500).json({ error: 'Failed to get scenario list' });
  }
});

// POST /api/excel-files/:id/toggle-active - Toggle active status
router.post('/:id/toggle-active', async (req, res) => {
  try {
    const file = await ExcelFile.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'Excel file not found' });

    file.isActive = !file.isActive;
    await file.save();

    console.log(`File ${file.originalName} status changed to: ${file.isActive ? 'active' : 'inactive'}`);
    res.json({ 
      message: `File ${file.isActive ? 'activated' : 'deactivated'} successfully`, 
      isActive: file.isActive 
    });
  } catch (err) {
    console.error('Failed to toggle file status:', err);
    res.status(500).json({ error: 'Failed to toggle file status' });
  }
});

module.exports = router;