const express = require('express');
const router = express.Router();
const HomeContentSection = require('../models/HomeContent');

// Helper functions
function toInt(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

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
    sectionIndex,
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

  // Required fields
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

  if (!title || typeof title !== 'string') {
    errors.push('title is required and must be a string');
  } else {
    req.body.title = toStr(title).trim();
  }

  // Content can be empty string
  if (content === undefined || content === null) {
    req.body.content = '';
  } else {
    req.body.content = toStr(content);
  }

  // Type validation
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

  // Layout object validation (simplified - let Mongoose handle detailed validation)
  if (layout && typeof layout === 'object' && !Array.isArray(layout)) {
    req.body.layout = layout;
  } else if (layout) {
    errors.push('layout must be an object');
  }

  // Typography object validation (simplified)
  if (typography && typeof typography === 'object' && !Array.isArray(typography)) {
    req.body.typography = typography;
  } else if (typography) {
    errors.push('typography must be an object');
  }

  // Type-specific validation
  if (req.body.type === 'hero' && heroButtons) {
    if (!Array.isArray(heroButtons)) {
      errors.push('heroButtons must be an array');
    } else {
      heroButtons.forEach((btn, idx) => {
        if (!btn.text || typeof btn.text !== 'string') {
          errors.push(`heroButtons[${idx}].text is required`);
        }
        if (!btn.link || typeof btn.link !== 'string') {
          errors.push(`heroButtons[${idx}].link is required`);
        }
      });
    }
  }

  if (req.body.type === 'features-grid' && features) {
    if (!Array.isArray(features)) {
      errors.push('features must be an array');
    } else {
      features.forEach((feature, idx) => {
        if (!feature.title || typeof feature.title !== 'string') {
          errors.push(`features[${idx}].title is required`);
        }
        if (!feature.description || typeof feature.description !== 'string') {
          errors.push(`features[${idx}].description is required`);
        }
      });
    }
  }

  if (req.body.type === 'stats' && stats) {
    if (!Array.isArray(stats)) {
      errors.push('stats must be an array');
    } else {
      stats.forEach((stat, idx) => {
        if (!stat.number || typeof stat.number !== 'string') {
          errors.push(`stats[${idx}].number is required`);
        }
        if (!stat.label || typeof stat.label !== 'string') {
          errors.push(`stats[${idx}].label is required`);
        }
      });
    }
  }

  // Boolean fields
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
  
  if (req.body.type) {
    const validTypes = [
      'text', 'key-value', 'image', 'card', 'hero', 'features-grid', 
      'stats', 'cta-section', 'process-steps', 'testimonial', 'gallery', 
      'video', 'accordion', 'timeline', 'pricing', 'team', 'contact-form', 
      'newsletter', 'social-links', 'custom-html'
    ];
    
    if (!validTypes.includes(req.body.type)) {
      errors.push(`type must be one of: ${validTypes.join(', ')}`);
    }
  }

  // Layout validation (simplified)
  if (req.body.layout && (typeof req.body.layout !== 'object' || Array.isArray(req.body.layout))) {
    errors.push('layout must be an object');
  }

  // Typography validation (simplified)
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

// GET all sections with optional filtering
router.get('/', async (req, res) => {
  try {
    const { type, visible, limit } = req.query;
    
    let query = {};
    
    if (type) {
      query.type = type;
    }
    
    if (visible !== undefined) {
      query.isVisible = visible === 'true';
    }

    let sectionsQuery = HomeContentSection.find(query).sort({ sectionIndex: 1 });
    
    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        sectionsQuery = sectionsQuery.limit(limitNum);
      }
    }

    const sections = await sectionsQuery;
    
    // Ensure all sections have proper structure
    const formattedSections = sections.map(section => {
      const obj = section.toObject();
      
      // Ensure nested objects exist with defaults
      if (!obj.layout) obj.layout = {};
      if (!obj.typography) obj.typography = {};
      if (!obj.animation) obj.animation = {};
      if (!obj.displayConditions) obj.displayConditions = {};
      if (!obj.seo) obj.seo = {};
      
      return obj;
    });
    
    res.json(formattedSections);
  } catch (err) {
    console.error('[GET /api/markdown] Failed:', err);
    res.status(500).json({
      error: 'Failed to fetch home content sections',
      message: err.message,
    });
  }
});

// GET section by ID
router.get('/:id', async (req, res) => {
  try {
    const section = await HomeContentSection.findById(req.params.id);
    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }
    
    // Format the response
    const formattedSection = section.toObject();
    if (!formattedSection.layout) formattedSection.layout = {};
    if (!formattedSection.typography) formattedSection.typography = {};
    
    res.json(formattedSection);
  } catch (err) {
    console.error('[GET /api/markdown/:id] Error:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid section ID' });
    }
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
      videoThumbnail,
      videoPlatform,
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

    // Check for existing section with same index
    const exists = await HomeContentSection.findOne({ sectionIndex });
    if (exists) {
      return res.status(409).json({
        error: `Section index ${sectionIndex} already exists`,
        existingSection: exists,
      });
    }

    // Create the document data with proper defaults
    const docData = {
      sectionIndex,
      title: toStr(title).trim(),
      content: toStr(content),
      type: type || 'text',
      isVisible: isVisible !== undefined ? Boolean(isVisible) : true,
      updatedAt: new Date(),
    };

    // Add layout if provided
    if (layout && typeof layout === 'object') {
      docData.layout = layout;
    }

    // Add typography if provided
    if (typography && typeof typography === 'object') {
      docData.typography = typography;
    }

    // Add type-specific fields only if they exist
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

    console.log('[POST] Creating section with data:', JSON.stringify(docData, null, 2));

    const doc = new HomeContentSection(docData);
    const saved = await doc.save();

    console.log('[POST] Section created successfully:', saved._id);
    
    // Format response
    const response = saved.toObject();
    if (!response.layout) response.layout = {};
    if (!response.typography) response.typography = {};
    
    res.status(201).json(response);
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
    const updateFields = {
      updatedAt: new Date(),
    };

    // Basic fields
    if (req.body.title !== undefined) updateFields.title = toStr(req.body.title).trim();
    if (req.body.content !== undefined) updateFields.content = toStr(req.body.content);
    if (req.body.type !== undefined) updateFields.type = req.body.type;

    // Nested object fields - be careful with these
    if (req.body.layout !== undefined) updateFields.layout = req.body.layout;
    if (req.body.typography !== undefined) updateFields.typography = req.body.typography;

    // Type-specific fields
    const typeSpecificFields = [
      'heroSubtitle', 'heroImage', 'heroButtons', 'features', 'stats', 'steps',
      'images', 'videoUrl', 'videoThumbnail', 'videoPlatform', 'accordionItems',
      'timelineItems', 'cardButtonText', 'cardButtonLink', 'cardButtonStyle'
    ];

    typeSpecificFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateFields[field] = req.body[field];
      }
    });

    // Other fields
    if (req.body.animation !== undefined) updateFields.animation = req.body.animation;
    if (req.body.displayConditions !== undefined) updateFields.displayConditions = req.body.displayConditions;
    if (req.body.seo !== undefined) updateFields.seo = req.body.seo;
    if (req.body.isVisible !== undefined) updateFields.isVisible = Boolean(req.body.isVisible);
    if (req.body.customCSS !== undefined) updateFields.customCSS = toStr(req.body.customCSS);
    if (req.body.customJS !== undefined) updateFields.customJS = toStr(req.body.customJS);

    console.log('[PUT] Updating section with ID:', req.params.id);
    console.log('[PUT] Update fields:', JSON.stringify(updateFields, null, 2));

    const updated = await HomeContentSection.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields }, // Use $set to avoid overwriting the entire document
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Section not found' });
    }

    console.log('[PUT] Section updated successfully:', updated._id);
    
    // Format response
    const response = updated.toObject();
    if (!response.layout) response.layout = {};
    if (!response.typography) response.typography = {};
    
    res.json(response);
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

// PATCH endpoint for reordering sections
router.patch('/reorder', async (req, res) => {
  try {
    const { sections } = req.body;
    
    if (!Array.isArray(sections)) {
      return res.status(400).json({ error: 'sections must be an array' });
    }

    // Update section indices
    const updatePromises = sections.map((section, index) => {
      return HomeContentSection.findByIdAndUpdate(
        section._id,
        { sectionIndex: index + 1, updatedAt: new Date() },
        { new: true }
      );
    });

    const updatedSections = await Promise.all(updatePromises);
    
    res.json({
      message: 'Sections reordered successfully',
      sections: updatedSections.sort((a, b) => a.sectionIndex - b.sectionIndex)
    });
  } catch (err) {
    console.error('[PATCH /api/markdown/reorder] Error:', err);
    res.status(500).json({
      error: 'Error reordering sections',
      message: err.message,
    });
  }
});

module.exports = router;