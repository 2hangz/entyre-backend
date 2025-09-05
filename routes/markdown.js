const express = require('express');
const router = express.Router();
const HomeContentSection = require('../models/HomeContent');

// Helper to safely parse integer
function toInt(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

// Validation for POST (requires sectionIndex, title, content)
const validateSectionDataPost = (req, res, next) => {
  const {
    sectionIndex,
    title,
    content,
    type,
    cardButtonText,
    cardButtonLink,
    isVisible,
  } = req.body;
  const errors = [];

  // sectionIndex required and must be integer
  if (sectionIndex === undefined || sectionIndex === null) {
    errors.push('sectionIndex is required');
  } else {
    const parsedIndex = Number(sectionIndex);
    if (!Number.isInteger(parsedIndex)) {
      errors.push('sectionIndex must be an integer');
    } else {
      req.body.sectionIndex = parsedIndex;
    }
  }

  // title required and must be string
  if (title === undefined || title === null) {
    errors.push('title is required');
  } else if (typeof title !== 'string') {
    errors.push('title must be a string');
  }

  // content required and must be string
  if (content === undefined || content === null) {
    errors.push('content is required');
  } else if (typeof content !== 'string') {
    errors.push('content must be a string');
  }

  // type (optional, but if present must be valid)
  if (type !== undefined && type !== null) {
    if (typeof type !== 'string') {
      errors.push('type must be a string');
    } else if (!['text', 'key-value', 'image', 'card'].includes(type)) {
      errors.push('type must be one of: text, key-value, image, card');
    }
  }

  // cardButtonText/cardButtonLink (optional, must be string if present)
  if (cardButtonText !== undefined && cardButtonText !== null && typeof cardButtonText !== 'string') {
    errors.push('cardButtonText must be a string');
  }
  if (cardButtonLink !== undefined && cardButtonLink !== null && typeof cardButtonLink !== 'string') {
    errors.push('cardButtonLink must be a string');
  }

  // isVisible (optional, must be boolean if present)
  if (isVisible !== undefined && isVisible !== null && typeof isVisible !== 'boolean') {
    errors.push('isVisible must be a boolean');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors,
      received: req.body,
    });
  }

  next();
};

// Validation for PUT (doesn't allow sectionIndex change)
const validateSectionDataPut = (req, res, next) => {
  const {
    title,
    content,
    type,
    cardButtonText,
    cardButtonLink,
    isVisible,
  } = req.body;
  const errors = [];

  // title (optional, must be string if present)
  if (title !== undefined && title !== null && typeof title !== 'string') {
    errors.push('title must be a string');
  }

  // content (optional, must be string if present)
  if (content !== undefined && content !== null && typeof content !== 'string') {
    errors.push('content must be a string');
  }

  // type (optional, must be valid if present)
  if (type !== undefined && type !== null) {
    if (typeof type !== 'string') {
      errors.push('type must be a string');
    } else if (!['text', 'key-value', 'image', 'card'].includes(type)) {
      errors.push('type must be one of: text, key-value, image, card');
    }
  }

  // cardButtonText/cardButtonLink (optional, must be string if present)
  if (cardButtonText !== undefined && cardButtonText !== null && typeof cardButtonText !== 'string') {
    errors.push('cardButtonText must be a string');
  }
  if (cardButtonLink !== undefined && cardButtonLink !== null && typeof cardButtonLink !== 'string') {
    errors.push('cardButtonLink must be a string');
  }

  // isVisible (optional, must be boolean if present)
  if (isVisible !== undefined && isVisible !== null && typeof isVisible !== 'boolean') {
    errors.push('isVisible must be a boolean');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors,
      received: req.body,
    });
  }

  next();
};

// GET all sections
router.get('/', async (req, res) => {
  try {
    const sections = await HomeContentSection.find().sort({ sectionIndex: 1 });
    res.json(sections);
  } catch (err) {
    console.error('[GET /api/markdown] Failed:', err);
    res.status(500).json({
      error: 'Failed to fetch home content sections',
      message: err.message,
    });
  }
});

// GET section by index
router.get('/:sectionIndex', async (req, res) => {
  try {
    const sectionIndex = toInt(req.params.sectionIndex);
    if (!Number.isInteger(sectionIndex)) {
      return res.status(400).json({ error: 'Invalid section index' });
    }
    const section = await HomeContentSection.findOne({ sectionIndex });
    if (!section) return res.status(404).json({ error: 'Section not found' });
    res.json(section);
  } catch (err) {
    console.error('[GET /api/markdown/:sectionIndex] Error:', err);
    res.status(500).json({
      error: 'Error fetching section',
      message: err.message,
    });
  }
});

// POST new section
router.post('/', validateSectionDataPost, async (req, res) => {
  try {
    const {
      sectionIndex,
      title,
      content,
      type,
      cardButtonText,
      cardButtonLink,
      isVisible,
    } = req.body;

    const exists = await HomeContentSection.findOne({ sectionIndex });
    if (exists) {
      return res.status(409).json({
        error: `Section index ${sectionIndex} already exists`,
        existingSection: exists,
      });
    }

    const docData = {
      sectionIndex,
      title: (title || '').trim(),
      content: (content || '').trim(),
      type: type || 'text',
      cardButtonText: cardButtonText || '',
      cardButtonLink: cardButtonLink || '',
      isVisible: isVisible !== undefined ? isVisible : true,
      updatedAt: new Date(),
    };

    console.log('[POST] Creating section with data:', docData);

    const doc = new HomeContentSection(docData);
    const saved = await doc.save();

    console.log('[POST] Section created successfully:', saved._id);
    res.status(201).json(saved);
  } catch (err) {
    console.error('[POST /api/markdown] Error:', err);

    if (err.code === 11000 || /E11000/.test(err.message)) {
      return res.status(409).json({
        error: 'Duplicate sectionIndex',
        message: err.message,
      });
    }

    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({
        error: 'Validation failed',
        details: validationErrors,
        message: err.message,
      });
    }

    res.status(500).json({
      error: 'Error creating section',
      message: err.message,
    });
  }
});

// PUT update section
router.put('/:id', validateSectionDataPut, async (req, res) => {
  try {
    const {
      title,
      content,
      type,
      cardButtonText,
      cardButtonLink,
      isVisible,
    } = req.body;

    const updateFields = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updateFields.title = title.trim();
    if (content !== undefined) updateFields.content = content.trim();
    if (type !== undefined) updateFields.type = type;
    if (cardButtonText !== undefined) updateFields.cardButtonText = cardButtonText;
    if (cardButtonLink !== undefined) updateFields.cardButtonLink = cardButtonLink;
    if (isVisible !== undefined) updateFields.isVisible = isVisible;

    console.log('[PUT] Updating section with ID:', req.params.id);
    console.log('[PUT] Update fields:', updateFields);

    const updated = await HomeContentSection.findByIdAndUpdate(
      req.params.id,
      updateFields,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Section not found' });
    }

    console.log('[PUT] Section updated successfully:', updated._id);
    res.json(updated);
  } catch (err) {
    console.error('[PUT /api/markdown/:id] Error:', err);

    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({
        error: 'Validation failed',
        details: validationErrors,
        message: err.message,
      });
    }

    if (err.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid section ID',
        message: err.message,
      });
    }

    res.status(500).json({
      error: 'Error updating section',
      message: err.message,
    });
  }
});

// DELETE section
router.delete('/:id', async (req, res) => {
  try {
    console.log('[DELETE] Deleting section with ID:', req.params.id);

    const deleted = await HomeContentSection.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Section not found' });
    }

    console.log('[DELETE] Section deleted successfully:', deleted._id);
    res.json({
      message: 'Section deleted successfully',
      deletedSection: {
        _id: deleted._id,
        sectionIndex: deleted.sectionIndex,
        title: deleted.title,
      },
    });
  } catch (err) {
    console.error('[DELETE /api/markdown/:id] Error:', err);

    if (err.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid section ID',
        message: err.message,
      });
    }

    res.status(500).json({
      error: 'Error deleting section',
      message: err.message,
    });
  }
});

module.exports = router;