const express = require('express');
const router = express.Router();
const HomeContentSection = require('../models/HomeContent');

// Helper
function toInt(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}
function toStr(val) {
  if (val === undefined || val === null) return '';
  return String(val);
}

// ✅ 校验 POST 数据
const validateSectionDataPost = (req, res, next) => {
  const { sectionIndex, title, content, type } = req.body;
  const errors = [];

  if (!Number.isInteger(Number(sectionIndex))) {
    errors.push('sectionIndex must be an integer');
  }
  if (!title || typeof title !== 'string') {
    errors.push('title is required and must be a string');
  }
  if (!content || typeof content !== 'string') {
    errors.push('content is required and must be a string');
  }
  if (type && !['text', 'key-value', 'image', 'card'].includes(type)) {
    errors.push('type must be one of: text, key-value, image, card');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors, received: req.body });
  }
  next();
};

// ✅ 校验 PUT 数据
const validateSectionDataPut = (req, res, next) => {
  const { title, content, type } = req.body;
  const errors = [];

  if (title !== undefined && typeof title !== 'string') {
    errors.push('title must be a string');
  }
  if (content !== undefined && typeof content !== 'string') {
    errors.push('content must be a string');
  }
  if (type !== undefined && !['text', 'key-value', 'image', 'card'].includes(type)) {
    errors.push('type must be one of: text, key-value, image, card');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors, received: req.body });
  }
  next();
};

// GET 所有 sections
router.get('/', async (req, res) => {
  try {
    const sections = await HomeContentSection.find().sort({ sectionIndex: 1 });
    res.json(sections);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch home content sections', message: err.message });
  }
});

// GET 按 index 查 section
router.get('/:sectionIndex', async (req, res) => {
  const sectionIndex = toInt(req.params.sectionIndex);
  if (!Number.isInteger(sectionIndex)) {
    return res.status(400).json({ error: 'Invalid section index' });
  }
  const section = await HomeContentSection.findOne({ sectionIndex });
  if (!section) return res.status(404).json({ error: 'Section not found' });
  res.json(section);
});

// POST 新建 section
router.post('/', validateSectionDataPost, async (req, res) => {
  try {
    const { sectionIndex, title, content, type, cardButtonText, cardButtonLink, isVisible } = req.body;

    const exists = await HomeContentSection.findOne({ sectionIndex });
    if (exists) {
      return res.status(409).json({ error: `Section index ${sectionIndex} already exists`, existingSection: exists });
    }

    const docData = {
      sectionIndex: Number(sectionIndex),
      title: toStr(title).trim(),
      content: toStr(content).trim(),
      type: type || 'text',
      cardButtonText: type === 'card' ? toStr(cardButtonText) : '',
      cardButtonLink: type === 'card' ? toStr(cardButtonLink) : '',
      isVisible: isVisible !== undefined ? Boolean(isVisible) : true,
    };

    const doc = new HomeContentSection(docData);
    const saved = await doc.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: 'Error creating section', message: err.message });
  }
});

// PUT 更新 section
router.put('/:id', validateSectionDataPut, async (req, res) => {
  try {
    const { title, content, type, cardButtonText, cardButtonLink, isVisible } = req.body;
    const updateFields = { updatedAt: new Date() };

    if (title !== undefined) updateFields.title = toStr(title).trim();
    if (content !== undefined) updateFields.content = toStr(content).trim();
    if (type !== undefined) updateFields.type = type;
    if (type === 'card') {
      updateFields.cardButtonText = toStr(cardButtonText);
      updateFields.cardButtonLink = toStr(cardButtonLink);
    } else if (type) {
      updateFields.cardButtonText = '';
      updateFields.cardButtonLink = '';
    }
    if (isVisible !== undefined) updateFields.isVisible = Boolean(isVisible);

    const updated = await HomeContentSection.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true
    });

    if (!updated) return res.status(404).json({ error: 'Section not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Error updating section', message: err.message });
  }
});

// DELETE 删除 section
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await HomeContentSection.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Section not found' });
    res.json({ message: 'Section deleted successfully', deletedSection: deleted });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting section', message: err.message });
  }
});

module.exports = router;
