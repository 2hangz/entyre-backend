const express = require('express');
const router = express.Router();
const MarkdownSection = require('../models/HomeContent');

// GET all sections
router.get('/', async (req, res) => {
  try {
    const sections = await MarkdownSection.find().sort({ sectionIndex: 1 });
    res.json(sections);
  } catch (err) {
    console.error('Failed to fetch markdown sections:', err);
    res.status(500).json({ error: 'Failed to fetch markdown sections' });
  }
});

// GET one section by index
router.get('/:sectionIndex', async (req, res) => {
  try {
    const sectionIndex = parseInt(req.params.sectionIndex, 10);
    if (isNaN(sectionIndex)) {
      return res.status(400).json({ error: 'Invalid section index' });
    }
    const section = await MarkdownSection.findOne({ sectionIndex });
    if (!section) return res.status(404).json({ error: 'Section not found' });
    res.json(section);
  } catch (err) {
    console.error('Error fetching section:', err);
    res.status(500).json({ error: 'Error fetching section' });
  }
});

// PUT update a section by ID (now supports title and type)
router.put('/:id', async (req, res) => {
  try {
    const { content, title, type } = req.body;
    if (typeof content !== 'string') {
      return res.status(400).json({ error: 'Content must be a string' });
    }
    // title is optional, but if present, must be a string
    if (title !== undefined && typeof title !== 'string') {
      return res.status(400).json({ error: 'Title must be a string' });
    }
    // type is optional, but if present, must be a string
    if (type !== undefined && typeof type !== 'string') {
      return res.status(400).json({ error: 'Type must be a string' });
    }
    const updateFields = { content, updatedAt: new Date() };
    if (title !== undefined) updateFields.title = title;
    if (type !== undefined) updateFields.type = type;
    const updated = await MarkdownSection.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Section not found' });
    res.json(updated);
  } catch (err) {
    console.error('Error updating section:', err);
    res.status(500).json({ error: 'Error updating section' });
  }
});

// POST create a new section (for admin use only, now supports title and type)
router.post('/', async (req, res) => {
  try {
    const { sectionIndex, content, title, type } = req.body;
    if (typeof sectionIndex !== 'number' || typeof content !== 'string') {
      return res.status(400).json({ error: 'Invalid sectionIndex or content' });
    }
    if (title !== undefined && typeof title !== 'string') {
      return res.status(400).json({ error: 'Title must be a string' });
    }
    if (type !== undefined && typeof type !== 'string') {
      return res.status(400).json({ error: 'Type must be a string' });
    }
    // Prevent duplicate sectionIndex
    const exists = await MarkdownSection.findOne({ sectionIndex });
    if (exists) {
      return res.status(409).json({ error: 'Section with this index already exists' });
    }
    const newSection = new MarkdownSection({ sectionIndex, content, title, type });
    const saved = await newSection.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('Error creating section:', err);
    res.status(500).json({ error: 'Error creating section' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await MarkdownSection.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Section not found' });
    res.json({ message: 'Section deleted successfully' });
  } catch (err) {
    console.error('Error deleting section:', err);
    res.status(500).json({ error: 'Error deleting section' });
  }
});

module.exports = router;