const express = require('express');
const router = express.Router();
const MarkdownSection = require('../models/HomeContent');


function toInt(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}


router.get('/', async (req, res) => {
  try {
    const sections = await MarkdownSection.find().sort({ sectionIndex: 1 });
    res.json(sections);
  } catch (err) {
    console.error('[GET /api/markdown] Failed:', err);
    res.status(500).json({ error: 'Failed to fetch markdown sections', message: err.message });
  }
});


router.get('/:sectionIndex', async (req, res) => {
  try {
    const sectionIndex = toInt(req.params.sectionIndex);
    if (!Number.isInteger(sectionIndex)) {
      return res.status(400).json({ error: 'Invalid section index' });
    }
    const section = await MarkdownSection.findOne({ sectionIndex });
    if (!section) return res.status(404).json({ error: 'Section not found' });
    res.json(section);
  } catch (err) {
    console.error('[GET /api/markdown/:sectionIndex] Error:', err);
    res.status(500).json({ error: 'Error fetching section', message: err.message });
  }
});


router.post('/', async (req, res) => {
  try {
    let { sectionIndex, content, title, type } = req.body;
    sectionIndex = toInt(sectionIndex);

   
    if (!Number.isInteger(sectionIndex) || typeof content !== 'string') {
      return res.status(400).json({ error: 'Invalid sectionIndex or content' });
    }
    if (title !== undefined && typeof title !== 'string') {
      return res.status(400).json({ error: 'Title must be a string' });
    }
    if (type !== undefined && typeof type !== 'string') {
      return res.status(400).json({ error: 'Type must be a string' });
    }

   
    const exists = await MarkdownSection.findOne({ sectionIndex });
    if (exists) {
      return res.status(409).json({ error: 'Section with this index already exists' });
    }

    const newSection = new MarkdownSection({ sectionIndex, content, title, type });
    const saved = await newSection.save();
    res.status(201).json(saved);
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ error: 'Section with this index already exists' });
    }
    console.error('[POST /api/markdown] Error:', err);
    res.status(500).json({ error: 'Error creating section', message: err.message });
  }
});


router.put('/:id', async (req, res) => {
  try {
    const { content, title, type } = req.body;

    if (typeof content !== 'string') {
      return res.status(400).json({ error: 'Content must be a string' });
    }
    if (title !== undefined && typeof title !== 'string') {
      return res.status(400).json({ error: 'Title must be a string' });
    }
    if (type !== undefined && typeof type !== 'string') {
      return res.status(400).json({ error: 'Type must be a string' });
    }

    const updateFields = { content, updatedAt: new Date() };
    if (title !== undefined) updateFields.title = title;
    if (type !== undefined) updateFields.type = type;

    const updated = await MarkdownSection.findByIdAndUpdate(req.params.id, updateFields, { new: true });
    if (!updated) return res.status(404).json({ error: 'Section not found' });
    res.json(updated);
  } catch (err) {
    console.error('[PUT /api/markdown/:id] Error:', err);
    res.status(500).json({ error: 'Error updating section', message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await MarkdownSection.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Section not found' });
    res.json({ message: 'Section deleted successfully' });
  } catch (err) {
    console.error('[DELETE /api/markdown/:id] Error:', err);
    res.status(500).json({ error: 'Error deleting section', message: err.message });
  }
});

module.exports = router;
