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

// PUT update a section by ID
router.put('/:id', async (req, res) => {
  try {
    const { content } = req.body;
    if (typeof content !== 'string') {
      return res.status(400).json({ error: 'Content must be a string' });
    }
    const updated = await MarkdownSection.findByIdAndUpdate(
      req.params.id,
      { content, updatedAt: new Date() },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Section not found' });
    res.json(updated);
  } catch (err) {
    console.error('Error updating section:', err);
    res.status(500).json({ error: 'Error updating section' });
  }
});

// POST create a new section (for admin use only)
router.post('/', async (req, res) => {
  try {
    const { sectionIndex, content } = req.body;
    if (typeof sectionIndex !== 'number' || typeof content !== 'string') {
      return res.status(400).json({ error: 'Invalid sectionIndex or content' });
    }
    // Prevent duplicate sectionIndex
    const exists = await MarkdownSection.findOne({ sectionIndex });
    if (exists) {
      return res.status(409).json({ error: 'Section with this index already exists' });
    }
    const newSection = new MarkdownSection({ sectionIndex, content });
    const saved = await newSection.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('Error creating section:', err);
    res.status(500).json({ error: 'Error creating section' });
  }
});

module.exports = router;