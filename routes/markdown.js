// routes/homeContent.js
const express = require('express');
const router = express.Router();
const HomeContentSection = require('../models/HomeContent');

// POST new section
router.post('/', async (req, res) => {
  try {
    const { sectionIndex, type, content, isVisible } = req.body;

    if (!Number.isInteger(sectionIndex)) {
      return res.status(400).json({ error: 'sectionIndex must be an integer' });
    }

    if (!type) {
      return res.status(400).json({ error: 'type is required' });
    }

    const exists = await HomeContentSection.findOne({ sectionIndex });
    if (exists) {
      return res.status(409).json({ error: `Section index ${sectionIndex} already exists` });
    }

    const doc = new HomeContentSection({
      sectionIndex,
      type,
      content: content || {},
      isVisible: isVisible !== undefined ? isVisible : true
    });

    const saved = await doc.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: 'Error creating section', message: err.message });
  }
});

// PUT update section
router.put('/:id', async (req, res) => {
  try {
    const { type, content, isVisible } = req.body;

    const updateFields = {
      updatedAt: new Date()
    };

    if (type !== undefined) updateFields.type = type;
    if (content !== undefined) updateFields.content = content;
    if (isVisible !== undefined) updateFields.isVisible = isVisible;

    const updated = await HomeContentSection.findByIdAndUpdate(req.params.id, updateFields, {
      new: true
    });

    if (!updated) return res.status(404).json({ error: 'Section not found' });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Error updating section', message: err.message });
  }
});
