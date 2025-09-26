const express = require('express');
const router = express.Router();
const HomeContentSection = require('../models/HomeContent');

// Helper functions
function toStr(val) {
  if (val === undefined || val === null) return '';
  return String(val);
}
function toBool(val) {
  if (val === undefined || val === null) return undefined;
  return Boolean(val);
}

// Enhanced validation for POST requests
const validateSectionDataPost = (req, res, next) => {
  let {
    title,
    content,
    type,
    layout,
    typography,
    heroSubtitle,
    heroImage,
    heroButtons,
    features,
    stats,
    steps,
    images,
    videoUrl,
    accordionItems,
    timelineItems,
    cardButtonText,
    cardButtonLink,
    cardButtonStyle,
    animation,
    displayConditions,
    seo,
    isVisible,
    customCSS,
    customJS
  } = req.body;

  const errors = [];

  if (!title || typeof title !== 'string') {
    errors.push('title is required and must be a string');
  } else {
    req.body.title = toStr(title).trim();
  }

  if (content === undefined || content === null) {
    req.body.content = '';
  } else {
    req.body.content = toStr(content);
  }

  const validTypes = [
    'text', 'key-value', 'image', 'card', 'hero', 'features-grid',
    'stats', 'cta-section', 'process-steps', 'testimonial', 'gallery',
    'video', 'accordion', 'timeline', 'pricing', 'team', 'contact-form',
    'newsletter', 'social-links', 'custom-html'
  ];
  if (type && !validTypes.includes(type)) {
    errors.push(`type must be one of: ${validTypes.join(', ')}`);
  } else {
    req.body.type = type || 'text';
  }

  if (layout && (typeof layout !== 'object' || Array.isArray(layout))) {
    errors.push('layout must be an object');
  }
  if (typography && (typeof typography !== 'object' || Array.isArray(typography))) {
    errors.push('typography must be an object');
  }

  if (isVisible !== undefined) {
    req.body.isVisible = toBool(isVisible);
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

// Enhanced validation for PUT requests
const validateSectionDataPut = (req, res, next) => {
  const errors = [];
  const validTypes = [
    'text', 'key-value', 'image', 'card', 'hero', 'features-grid',
    'stats', 'cta-section', 'process-steps', 'testimonial', 'gallery',
    'video', 'accordion', 'timeline', 'pricing', 'team', 'contact-form',
    'newsletter', 'social-links', 'custom-html'
  ];
  if (req.body.type && !validTypes.includes(req.body.type)) {
    errors.push(`type must be one of: ${validTypes.join(', ')}`);
  }
  if (req.body.layout && (typeof req.body.layout !== 'object' || Array.isArray(req.body.layout))) {
    errors.push('layout must be an object');
  }
  if (req.body.typography && (typeof req.body.typography !== 'object' || Array.isArray(req.body.typography))) {
    errors.push('typography must be an object');
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
    const { type, visible, limit } = req.query;
    let query = {};
    if (type) query.type = type;
    if (visible !== undefined) query.isVisible = visible === 'true';

    let sectionsQuery = HomeContentSection.find(query).sort({ sectionIndex: 1 });
    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        sectionsQuery = sectionsQuery.limit(limitNum);
      }
    }

    const sections = await sectionsQuery;
    const formattedSections = sections.map(s => {
      const obj = s.toObject();
      if (!obj.layout) obj.layout = {};
      if (!obj.typography) obj.typography = {};
      if (!obj.animation) obj.animation = {};
      if (!obj.displayConditions) obj.displayConditions = {};
      if (!obj.seo) obj.seo = {};
      return obj;
    });
    res.json(formattedSections);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch home content sections', message: err.message });
  }
});

// GET by ID
router.get('/:id', async (req, res) => {
  try {
    const section = await HomeContentSection.findById(req.params.id);
    if (!section) return res.status(404).json({ error: 'Section not found' });
    const formatted = section.toObject();
    if (!formatted.layout) formatted.layout = {};
    if (!formatted.typography) formatted.typography = {};
    res.json(formatted);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid section ID' });
    res.status(500).json({ error: 'Error fetching section', message: err.message });
  }
});

// POST
router.post('/', validateSectionDataPost, async (req, res) => {
  try {
    const maxSection = await HomeContentSection.findOne().sort({ sectionIndex: -1 });
    const nextIndex = maxSection ? maxSection.sectionIndex + 1 : 1;

    const {
      title, content, type, layout, typography, heroSubtitle, heroImage, heroButtons,
      features, stats, steps, images, videoUrl, videoThumbnail, videoPlatform,
      accordionItems, timelineItems, cardButtonText, cardButtonLink, cardButtonStyle,
      animation, displayConditions, seo, isVisible, customCSS, customJS
    } = req.body;

    const docData = {
      sectionIndex: nextIndex,
      title: toStr(title).trim(),
      content: toStr(content),
      type: type || 'text',
      isVisible: isVisible !== undefined ? Boolean(isVisible) : true,
      updatedAt: new Date(),
    };

    if (layout && typeof layout === 'object') docData.layout = layout;
    if (typography && typeof typography === 'object') docData.typography = typography;
    if (heroSubtitle !== undefined) docData.heroSubtitle = toStr(heroSubtitle);
    if (heroImage !== undefined) docData.heroImage = toStr(heroImage);
    if (heroButtons && Array.isArray(heroButtons)) docData.heroButtons = heroButtons;
    if (features && Array.isArray(features)) docData.features = features;
    if (stats && Array.isArray(stats)) docData.stats = stats;
    if (steps && Array.isArray(steps)) docData.steps = steps;
    if (images && Array.isArray(images)) docData.images = images;
    if (videoUrl !== undefined) docData.videoUrl = toStr(videoUrl);
    if (videoThumbnail !== undefined) docData.videoThumbnail = toStr(videoThumbnail);
    if (videoPlatform !== undefined) docData.videoPlatform = videoPlatform;
    if (accordionItems && Array.isArray(accordionItems)) docData.accordionItems = accordionItems;
    if (timelineItems && Array.isArray(timelineItems)) docData.timelineItems = timelineItems;
    if (cardButtonText !== undefined) docData.cardButtonText = toStr(cardButtonText);
    if (cardButtonLink !== undefined) docData.cardButtonLink = toStr(cardButtonLink);
    if (cardButtonStyle !== undefined) docData.cardButtonStyle = cardButtonStyle;
    if (animation && typeof animation === 'object') docData.animation = animation;
    if (displayConditions && typeof displayConditions === 'object') docData.displayConditions = displayConditions;
    if (seo && typeof seo === 'object') docData.seo = seo;
    if (customCSS !== undefined) docData.customCSS = toStr(customCSS);
    if (customJS !== undefined) docData.customJS = toStr(customJS);

    const doc = new HomeContentSection(docData);
    const saved = await doc.save();
    const response = saved.toObject();
    if (!response.layout) response.layout = {};
    if (!response.typography) response.typography = {};
    res.status(201).json(response);
  } catch (err) {
    res.status(500).json({ error: 'Error creating section', message: err.message });
  }
});

// PUT update section
router.put('/:id', validateSectionDataPut, async (req, res) => {
  try {
    const updateFields = { updatedAt: new Date() };
    if (req.body.title !== undefined) updateFields.title = toStr(req.body.title).trim();
    if (req.body.content !== undefined) updateFields.content = toStr(req.body.content);
    if (req.body.type !== undefined) updateFields.type = req.body.type;
    if (req.body.layout !== undefined) updateFields.layout = req.body.layout;
    if (req.body.typography !== undefined) updateFields.typography = req.body.typography;

    const typeSpecificFields = [
      'heroSubtitle', 'heroImage', 'heroButtons', 'features', 'stats', 'steps',
      'images', 'videoUrl', 'videoThumbnail', 'videoPlatform', 'accordionItems',
      'timelineItems', 'cardButtonText', 'cardButtonLink', 'cardButtonStyle'
    ];
    typeSpecificFields.forEach(field => {
      if (req.body[field] !== undefined) updateFields[field] = req.body[field];
    });

    if (req.body.animation !== undefined) updateFields.animation = req.body.animation;
    if (req.body.displayConditions !== undefined) updateFields.displayConditions = req.body.displayConditions;
    if (req.body.seo !== undefined) updateFields.seo = req.body.seo;
    if (req.body.isVisible !== undefined) updateFields.isVisible = Boolean(req.body.isVisible);
    if (req.body.customCSS !== undefined) updateFields.customCSS = toStr(req.body.customCSS);
    if (req.body.customJS !== undefined) updateFields.customJS = toStr(req.body.customJS);

    const updated = await HomeContentSection.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: 'Section not found' });
    const response = updated.toObject();
    if (!response.layout) response.layout = {};
    if (!response.typography) response.typography = {};
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: 'Error updating section', message: err.message });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await HomeContentSection.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Section not found' });
    res.json({
      message: 'Section deleted successfully',
      deletedSection: { _id: deleted._id, sectionIndex: deleted.sectionIndex, title: deleted.title },
    });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting section', message: err.message });
  }
});

// Alternative approach - Sequential updates to avoid duplicate keys:

router.patch('/reorder', async (req, res) => {
  try {
    const { sections } = req.body;
    
    if (!Array.isArray(sections)) {
      return res.status(400).json({ error: 'Sections must be an array' });
    }

    console.log('Reordering sections sequentially:', sections.map(s => ({ _id: s._id, sectionIndex: s.sectionIndex })));

    // Sequential update approach - update one by one to avoid duplicates
    const results = [];
    for (let i = 0; i < sections.length; i++) {
      const { _id, sectionIndex } = sections[i];
      
      if (!_id) {
        throw new Error(`Section at index ${i} is missing _id`);
      }

      // Find the highest current sectionIndex to use as temporary value
      const maxSection = await HomeContentSection.findOne().sort({ sectionIndex: -1 });
      const tempIndex = (maxSection?.sectionIndex || 0) + 1000 + i;

      // First update to temporary value
      await HomeContentSection.findByIdAndUpdate(_id, { 
        sectionIndex: tempIndex, 
        updatedAt: new Date() 
      });

      console.log(`Updated ${_id} to temp index ${tempIndex}`);
    }

    // Now update to final values
    for (let i = 0; i < sections.length; i++) {
      const { _id, sectionIndex } = sections[i];
      
      const updated = await HomeContentSection.findByIdAndUpdate(
        _id,
        { sectionIndex, updatedAt: new Date() },
        { new: true, runValidators: true }
      );
      
      results.push(updated);
      console.log(`Final update ${_id} to index ${sectionIndex}`);
    }

    // Fetch all sections in the new order
    const updatedSections = await HomeContentSection.find()
      .sort({ sectionIndex: 1 });

    const formattedSections = updatedSections.map(s => {
      const obj = s.toObject();
      if (!obj.layout) obj.layout = {};
      if (!obj.typography) obj.typography = {};
      if (!obj.animation) obj.animation = {};
      if (!obj.displayConditions) obj.displayConditions = {};
      if (!obj.seo) obj.seo = {};
      return obj;
    });

    res.json({ 
      success: true, 
      sections: formattedSections 
    });

  } catch (error) {
    console.error('Reorder error:', error);
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;