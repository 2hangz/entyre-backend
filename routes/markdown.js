const express = require('express');
const router = express.Router();
const HomeContentSection = require('../models/HomeContent');

// Helper to safely parse integer
function toInt(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

// Helper to coerce value to string (if not null/undefined)
function toStr(val) {
  if (val === undefined || val === null) return '';
  return String(val);
}

// Helper to coerce value to boolean (if not null/undefined)
function toBool(val) {
  if (val === undefined || val === null) return undefined;
  return Boolean(val);
}

// Validation for POST (requires sectionIndex, title, content)
const validateSectionDataPost = (req, res, next) => {
  let {
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
    req.body.title = toStr(title);
  }

  // content required and must be string
  if (content === undefined || content === null) {
    errors.push('content is required');
  } else if (typeof content !== 'string') {
    req.body.content = toStr(content);
  }

  // type (optional, but if present must be valid)
  if (type !== undefined && type !== null) {
    if (typeof type !== 'string') {
      req.body.type = toStr(type);
    }
    // ✅ NOW ALLOW: text, key-value, image, card
    if (!['text', 'key-value', 'image', 'card'].includes(req.body.type)) {
      errors.push('type must be one of: text, key-value, image, card');
    }
  }

  // cardButtonText/cardButtonLink validation for card type
  if (req.body.type === 'card') {
    // For card type, these fields are required
    if (!cardButtonText || typeof cardButtonText !== 'string' || cardButtonText.trim() === '') {
      errors.push('cardButtonText is required for card type');
    } else {
      req.body.cardButtonText = toStr(cardButtonText).trim();
    }
    
    if (!cardButtonLink || typeof cardButtonLink !== 'string' || cardButtonLink.trim() === '') {
      errors.push('cardButtonLink is required for card type');
    } else {
      req.body.cardButtonLink = toStr(cardButtonLink).trim();
    }
  } else {
    // For non-card types, set to empty string
    req.body.cardButtonText = '';
    req.body.cardButtonLink = '';
  }

  // isVisible (optional, must be boolean if present)
  if (isVisible !== undefined && isVisible !== null) {
    if (typeof isVisible !== 'boolean') {
      if (isVisible === 'true' || isVisible === '1' || isVisible === 1) {
        req.body.isVisible = true;
      } else if (isVisible === 'false' || isVisible === '0' || isVisible === 0) {
        req.body.isVisible = false;
      } else {
        errors.push('isVisible must be a boolean');
      }
    }
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
  let {
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
    req.body.title = toStr(title);
  }

  // content (optional, must be string if present)
  if (content !== undefined && content !== null && typeof content !== 'string') {
    req.body.content = toStr(content);
  }

  // type (optional, must be valid if present)
  if (type !== undefined && type !== null) {
    if (typeof type !== 'string') {
      req.body.type = toStr(type);
    }
    // ✅ NOW ALLOW: text, key-value, image, card
    if (!['text', 'key-value', 'image', 'card'].includes(req.body.type)) {
      errors.push('type must be one of: text, key-value, image, card');
    }
  }

  // Handle cardButtonText/cardButtonLink based on type
  if (req.body.type === 'card') {
    // For card type, validate these fields
    if (cardButtonText !== undefined && cardButtonText !== null) {
      req.body.cardButtonText = toStr(cardButtonText).trim();
    }
    if (cardButtonLink !== undefined && cardButtonLink !== null) {
      req.body.cardButtonLink = toStr(cardButtonLink).trim();
    }
  } else if (req.body.type && req.body.type !== 'card') {
    // For non-card types, set to empty string
    req.body.cardButtonText = '';
    req.body.cardButtonLink = '';
  }

  // isVisible (optional, must be boolean if present)
  if (isVisible !== undefined && isVisible !== null) {
    if (typeof isVisible !== 'boolean') {
      if (isVisible === 'true' || isVisible === '1' || isVisible === 1) {
        req.body.isVisible = true;
      } else if (isVisible === 'false' || isVisible === '0' || isVisible === 0) {
        req.body.isVisible = false;
      } else {
        errors.push('isVisible must be a boolean');
      }
    }
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

    // ✅ NOW ALLOW: text, key-value, image, card
    let docType = type ? toStr(type) : 'text';

    // Handle cardButtonText/cardButtonLink based on type
    let docCardButtonText = '';
    let docCardButtonLink = '';
    
    if (docType === 'card') {
      docCardButtonText = cardButtonText ? toStr(cardButtonText).trim() : '';
      docCardButtonLink = cardButtonLink ? toStr(cardButtonLink).trim() : '';
    }

    const docData = {
      sectionIndex,
      title: toStr(title).trim(),
      content: toStr(content).trim(),
      type: docType,
      cardButtonText: docCardButtonText,
      cardButtonLink: docCardButtonLink,
      isVisible: isVisible !== undefined ? Boolean(isVisible) : true,
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

    // ✅ NOW ALLOW: text, key-value, image, card
    let docType = type !== undefined ? toStr(type) : undefined;
    if (docType !== undefined) {
      updateFields.type = docType;
    }

    if (title !== undefined) updateFields.title = toStr(title).trim();
    if (content !== undefined) updateFields.content = toStr(content).trim();

    // Handle cardButtonText/cardButtonLink based on type
    if (docType === 'card') {
      updateFields.cardButtonText = cardButtonText !== undefined ? toStr(cardButtonText).trim() : '';
      updateFields.cardButtonLink = cardButtonLink !== undefined ? toStr(cardButtonLink).trim() : '';
    } else if (docType && docType !== 'card') {
      updateFields.cardButtonText = '';
      updateFields.cardButtonLink = '';
    }

    if (isVisible !== undefined) updateFields.isVisible = Boolean(isVisible);

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