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

// POST create a new section
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

// DELETE a section by ID
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await MarkdownSection.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Section not found' });
    res.json({ message: 'Section deleted successfully', section: deleted });
  } catch (err) {
    console.error('Error deleting section:', err);
    res.status(500).json({ error: 'Error deleting section' });
  }
});

// POST bulk seed/update content (useful for initial setup)
router.post('/bulk-seed', async (req, res) => {
  try {
    const { sections, clearExisting = false } = req.body;
    
    if (!Array.isArray(sections)) {
      return res.status(400).json({ error: 'Sections must be an array' });
    }
    
    let result = {
      message: 'Bulk operation completed',
      created: 0,
      updated: 0,
      errors: []
    };
    
    // Clear existing if requested
    if (clearExisting) {
      await MarkdownSection.deleteMany({});
      result.message += ' (existing content cleared)';
    }
    
    // Process each section
    for (let i = 0; i < sections.length; i++) {
      const sectionData = sections[i];
      
      try {
        // Validate section data
        if (typeof sectionData.sectionIndex !== 'number' || typeof sectionData.content !== 'string') {
          result.errors.push(`Section ${i}: Invalid sectionIndex or content`);
          continue;
        }
        
        // Check if section exists
        const existing = await MarkdownSection.findOne({ sectionIndex: sectionData.sectionIndex });
        
        if (existing) {
          // Update existing
          const updateFields = { 
            content: sectionData.content, 
            updatedAt: new Date() 
          };
          if (sectionData.title !== undefined) updateFields.title = sectionData.title;
          if (sectionData.type !== undefined) updateFields.type = sectionData.type;
          
          await MarkdownSection.findByIdAndUpdate(existing._id, updateFields);
          result.updated++;
        } else {
          // Create new
          const newSection = new MarkdownSection(sectionData);
          await newSection.save();
          result.created++;
        }
      } catch (err) {
        result.errors.push(`Section ${i}: ${err.message}`);
      }
    }
    
    res.json(result);
  } catch (err) {
    console.error('Error in bulk seed:', err);
    res.status(500).json({ error: 'Error in bulk operation' });
  }
});

// GET content statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const totalSections = await MarkdownSection.countDocuments();
    const sectionsByType = await MarkdownSection.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    const lastUpdated = await MarkdownSection.findOne({}, {}, { sort: { updatedAt: -1 } });
    
    res.json({
      totalSections,
      sectionsByType,
      lastUpdated: lastUpdated?.updatedAt || null
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Error fetching statistics' });
  }
});

module.exports = router;