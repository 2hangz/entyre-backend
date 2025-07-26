const express = require('express');
const router = express.Router();
const MarkdownSection = require('../models/HomeContent');

// GET all sections
router.get('/', async (req, res) => {
  try {
    const sections = await MarkdownSection.find().sort({ sectionIndex: 1 });
    res.json(sections);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch markdown sections' });
  }
});

// GET one section by index
router.get('/:sectionIndex', async (req, res) => {
  try {
    const section = await MarkdownSection.findOne({ sectionIndex: req.params.sectionIndex });
    if (!section) return res.status(404).json({ error: 'Section not found' });
    res.json(section);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching section' });
  }
});

// PUT update a section by ID
router.put('/:id', async (req, res) => {
  try {
    const { content } = req.body;
    const updated = await MarkdownSection.findByIdAndUpdate(
      req.params.id,
      { content, updatedAt: new Date() },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Section not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Error updating section' });
  }
});

// POST create a new section (for admin use only)
router.post('/', async (req, res) => {
  try {
    const { sectionIndex, content } = req.body;
    const newSection = new MarkdownSection({ sectionIndex, content });
    const saved = await newSection.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: 'Error creating section' });
  }
});

module.exports = router;