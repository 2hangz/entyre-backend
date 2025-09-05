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

  // Layout object validation
  if (layout && typeof layout === 'object') {
    const validContainerWidths = ['full', 'contained', 'narrow'];
    const validPaddings = ['none', 'small', 'normal', 'large'];
    const validBackgrounds = ['transparent', 'white', 'gray', 'gradient-1', 'gradient-2', 'custom'];
    const validTextAligns = ['left', 'center', 'right'];
    const validGaps = ['small', 'normal', 'large'];

    if (layout.containerWidth && !validContainerWidths.includes(layout.containerWidth)) {
      errors.push(`layout.containerWidth must be one of: ${validContainerWidths.join(', ')}`);
    }
    if (layout.padding && !validPaddings.includes(layout.padding)) {
      errors.push(`layout.padding must be one of: ${validPaddings.join(', ')}`);
    }
    if (layout.background && !validBackgrounds.includes(layout.background)) {
      errors.push(`layout.background must be one of: ${validBackgrounds.join(', ')}`);
    }
    if (layout.textAlign && !validTextAligns.includes(layout.textAlign)) {
      errors.push(`layout.textAlign must be one of: ${validTextAligns.join(', ')}`);
    }
    if (layout.columns !== undefined) {
      const cols = Number(layout.columns);
      if (!Number.isInteger(cols) || cols < 1 || cols > 4) {
        errors.push('layout.columns must be an integer between 1 and 4');
      }
    }
    if (layout.gap && !validGaps.includes(layout.gap)) {
      errors.push(`layout.gap must be one of: ${validGaps.join(', ')}`);
    }
  }

  // Typography object validation
  if (typography && typeof typography === 'object') {
    const validTitleSizes = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    const validFontFamilies = ['default', 'serif', 'mono'];

    if (typography.titleSize && !validTitleSizes.includes(typography.titleSize)) {
      errors.push(`typography.titleSize must be one of: ${validTitleSizes.join(', ')}`);
    }
    if (typography.fontFamily && !validFontFamilies.includes(typography.fontFamily)) {
      errors.push(`typography.fontFamily must be one of: ${validFontFamilies.join(', ')}`);
    }
  }

  // Type-specific validation
  if (req.body.type === 'card') {
    if (!cardButtonText || typeof cardButtonText !== 'string') {
      errors.push('cardButtonText is required for card type');
    }
    if (!cardButtonLink || typeof cardButtonLink !== 'string') {
      errors.push('cardButtonLink is required for card type');
    }
  }

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

  // Animation object validation
  if (animation && typeof animation === 'object') {
    if (animation.enabled !== undefined) {
      req.body.animation.enabled = toBool(animation.enabled);
    }
    if (animation.delay !== undefined) {
      const delay = Number(animation.delay);
      if (!Number.isFinite(delay) || delay < 0) {
        errors.push('animation.delay must be a non-negative number');
      }
    }
    if (animation.duration !== undefined) {
      const duration = Number(animation.duration);
      if (!Number.isFinite(duration) || duration <= 0) {
        errors.push('animation.duration must be a positive number');
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

// Enhanced validation for PUT requests
const validateSectionDataPut = (req, res, next) => {
  // Similar validation to POST but without requiring sectionIndex
  const errors = [];
  
  // Perform similar validation as POST but allow partial updates
  // This is a simplified version - in practice, you'd want to check each field
  
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
    
    res.json(sections);
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
    res.json(section);
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

    // Create the document data
    const docData = {
      sectionIndex,
      title: toStr(title).trim(),
      content: toStr(content),
      type: type || 'text',
      
      // Layout options
      layout: {
        containerWidth: layout?.containerWidth || 'contained',
        padding: layout?.padding || 'normal',
        background: layout?.background || 'transparent',
        customBackground: layout?.customBackground || '',
        textAlign: layout?.textAlign || 'left',
        columns: layout?.columns || 1,
        gap: layout?.gap || 'normal'
      },
      
      // Typography options
      typography: {
        titleSize: typography?.titleSize || 'h2',
        titleColor: typography?.titleColor || '#003C69',
        contentColor: typography?.contentColor || '#333333',
        fontFamily: typography?.fontFamily || 'default'
      },
      
      // Type-specific fields
      heroSubtitle: toStr(heroSubtitle),
      heroImage: toStr(heroImage),
      heroButtons: heroButtons || [],
      features: features || [],
      stats: stats || [],
      steps: steps || [],
      images: images || [],
      videoUrl: toStr(videoUrl),
      videoThumbnail: toStr(videoThumbnail),
      videoPlatform: videoPlatform || 'youtube',
      accordionItems: accordionItems || [],
      timelineItems: timelineItems || [],
      
      // Card fields
      cardButtonText: toStr(cardButtonText),
      cardButtonLink: toStr(cardButtonLink),
      cardButtonStyle: cardButtonStyle || 'primary',
      
      // Animation options
      animation: {
        enabled: animation?.enabled || false,
        type: animation?.type || 'fadeIn',
        delay: animation?.delay || 0,
        duration: animation?.duration || 500
      },
      
      // Conditional display
      displayConditions: {
        startDate: displayConditions?.startDate,
        endDate: displayConditions?.endDate,
        userRoles: displayConditions?.userRoles || [],
        deviceType: displayConditions?.deviceType || 'all'
      },
      
      // SEO fields
      seo: {
        metaTitle: seo?.metaTitle || '',
        metaDescription: seo?.metaDescription || '',
        keywords: seo?.keywords || []
      },
      
      isVisible: isVisible !== undefined ? Boolean(isVisible) : true,
      customCSS: toStr(customCSS),
      customJS: toStr(customJS),
      updatedAt: new Date(),
    };

    console.log('[POST] Creating section with data:', JSON.stringify(docData, null, 2));

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
    const updateFields = {
      updatedAt: new Date(),
    };

    // Basic fields
    if (req.body.title !== undefined) updateFields.title = toStr(req.body.title).trim();
    if (req.body.content !== undefined) updateFields.content = toStr(req.body.content);
    if (req.body.type !== undefined) updateFields.type = req.body.type;

    // Layout fields
    if (req.body.layout) {
      updateFields.layout = req.body.layout;
    }

    // Typography fields
    if (req.body.typography) {
      updateFields.typography = req.body.typography;
    }

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