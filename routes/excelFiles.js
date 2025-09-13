const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const ExcelFile = require('../models/ExcelFiles');
const cloudinary = require('../utils/cloudinary');

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

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
    fileSize: 10 * 1024 * 1024
  }
});

router.get('/', async (req, res) => {
  try {
    const { category, active } = req.query;
    let query = {};
    
    if (category) query.category = category;
    if (active !== undefined) query.isActive = active === 'true';
    
    const files = await ExcelFile.find(query).sort({ createdAt: -1 });
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch Excel files' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const file = await ExcelFile.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'Excel file not found' });
    res.json(file);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching Excel file' });
  }
});

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No Excel file provided' });
    }

    const { title, description, category, tags } = req.body;
    

    let metadata = {};
    try {
      const workbook = XLSX.readFile(req.file.path);
      metadata = {
        sheetNames: workbook.SheetNames,
        columnInfo: {},
        lastProcessed: new Date()
      };
      
      // 获取每个工作表的列信息
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (data.length > 0) {
          metadata.columnInfo[sheetName] = data[0]; 
        }
      });
    } catch (parseError) {
      console.error('Error parsing Excel file:', parseError);
    }


    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'entyre/excel-files',
      resource_type: 'raw',
      public_id: `excel_${Date.now()}_${path.parse(req.file.originalname).name}`
    });

    const newFile = new ExcelFile({
      title: title || path.parse(req.file.originalname).name,
      description: description || '',
      category: category || 'analysis',
      fileUrl: result.secure_url,
      filePublicId: result.public_id,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      metadata
    });

    const saved = await newFile.save();

    await fs.promises.unlink(req.file.path);

    res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    // 确保删除临时文件
    if (req.file?.path) {
      try {
        await fs.promises.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting temp file:', unlinkError);
      }
    }
    res.status(400).json({ error: 'Failed to upload Excel file', details: err.message });
  }
});

router.put('/:id', upload.single('file'), async (req, res) => {
  try {
    const { title, description, category, tags, isActive } = req.body;
    const file = await ExcelFile.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'Excel file not found' });

    
    if (req.file) {

      if (file.filePublicId) {
        await cloudinary.uploader.destroy(file.filePublicId, { resource_type: 'raw' });
      }


      let metadata = {};
      try {
        const workbook = XLSX.readFile(req.file.path);
        metadata = {
          sheetNames: workbook.SheetNames,
          columnInfo: {},
          lastProcessed: new Date()
        };
        
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          if (data.length > 0) {
            metadata.columnInfo[sheetName] = data[0];
          }
        });
      } catch (parseError) {
        console.error('Error parsing Excel file:', parseError);
      }

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'entyre/excel-files',
        resource_type: 'raw',
        public_id: `excel_${Date.now()}_${path.parse(req.file.originalname).name}`
      });

      file.fileUrl = result.secure_url;
      file.filePublicId = result.public_id;
      file.originalName = req.file.originalname;
      file.fileSize = req.file.size;
      file.metadata = metadata;

      await fs.promises.unlink(req.file.path);
    }

    if (title !== undefined) file.title = title;
    if (description !== undefined) file.description = description;
    if (category !== undefined) file.category = category;
    if (isActive !== undefined) file.isActive = isActive === 'true';
    if (tags !== undefined) file.tags = tags.split(',').map(tag => tag.trim());

    const updated = await file.save();
    res.json(updated);
  } catch (err) {
    console.error(err);
    if (req.file?.path) {
      try {
        await fs.promises.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting temp file:', unlinkError);
      }
    }
    res.status(400).json({ error: 'Failed to update Excel file', details: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const file = await ExcelFile.findByIdAndDelete(req.params.id);
    if (!file) return res.status(404).json({ error: 'Excel file not found' });

    if (file.filePublicId) {
      await cloudinary.uploader.destroy(file.filePublicId, { resource_type: 'raw' });
    }

    res.json({ message: 'Excel file deleted successfully', file });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Failed to delete Excel file' });
  }
});

router.get('/:id/content', async (req, res) => {
  try {
    const file = await ExcelFile.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'Excel file not found' });

    res.json({
      fileUrl: file.fileUrl,
      metadata: file.metadata,
      title: file.title,
      category: file.category
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get file content info' });
  }
});

router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await ExcelFile.distinct('category');
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

module.exports = router;