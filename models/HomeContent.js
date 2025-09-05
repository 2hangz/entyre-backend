// Enhanced HomeContent.js - Expanded schema for flexible homepage sections
const mongoose = require('mongoose');

const HomeContentSectionSchema = new mongoose.Schema(
  {
    sectionIndex: {
      type: Number,
      required: true,
      unique: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: [
        'text', 
        'key-value', 
        'image', 
        'card',
        'hero',           // Hero banner section
        'features-grid',  // Grid of feature cards
        'stats',          // Statistics/numbers display
        'cta-section',    // Call-to-action section
        'process-steps',  // Step-by-step process
        'testimonial',    // Customer testimonials
        'gallery',        // Image gallery
        'video',          // Video embed
        'accordion',      // Collapsible content
        'timeline',       // Timeline display
        'pricing',        // Pricing table
        'team',           // Team member cards
        'contact-form',   // Contact form
        'newsletter',     // Newsletter signup
        'social-links',   // Social media links
        'custom-html'     // Custom HTML/React component
      ], 
      default: 'text'
    },
    
    // Layout and styling options
    layout: {
      containerWidth: { type: String, default: 'full' }, // full, contained, narrow
      padding: { type: String, default: 'normal' },      // none, small, normal, large
      background: { type: String, default: 'transparent' }, // transparent, white, gray, gradient-1, gradient-2, custom
      customBackground: { type: String, default: '' },   // Custom CSS background
      textAlign: { type: String, default: 'left' },      // left, center, right
      columns: { type: Number, default: 1, min: 1, max: 4 }, // For grid layouts
      gap: { type: String, default: 'normal' }           // small, normal, large
    },
    
    // Typography options
    typography: {
      titleSize: { type: String, default: 'h2' },        // h1, h2, h3, h4, h5, h6
      titleColor: { type: String, default: '#003C69' },
      contentColor: { type: String, default: '#333333' },
      fontFamily: { type: String, default: 'default' }   // default, serif, mono
    },
    
    // Card-specific fields (enhanced)
    cardButtonText: { type: String, trim: true, default: '' },
    cardButtonLink: { type: String, trim: true, default: '' },
    cardButtonStyle: { type: String, default: 'primary' }, // primary, secondary, outline, ghost
    
    // Hero-specific fields
    heroSubtitle: { type: String, trim: true, default: '' },
    heroImage: { type: String, trim: true, default: '' },
    heroButtons: [{
      text: String,
      link: String,
      style: { type: String, default: 'primary' },
      external: { type: Boolean, default: false }
    }],
    
    // Features grid fields
    features: [{
      title: String,
      description: String,
      icon: String,      // emoji or icon class
      link: String,
      linkText: String
    }],
    
    // Stats fields
    stats: [{
      number: String,
      label: String,
      description: String,
      color: String
    }],
    
    // Process steps fields
    steps: [{
      stepNumber: String,
      title: String,
      description: String,
      icon: String
    }],
    
    // Gallery fields
    images: [{
      url: String,
      alt: String,
      caption: String,
      link: String
    }],
    
    // Video fields
    videoUrl: { type: String, trim: true, default: '' },
    videoThumbnail: { type: String, trim: true, default: '' },
    videoPlatform: { type: String, default: 'youtube' }, // youtube, vimeo, custom
    
    // Accordion fields
    accordionItems: [{
      title: String,
      content: String,
      defaultOpen: { type: Boolean, default: false }
    }],
    
    // Timeline fields
    timelineItems: [{
      date: String,
      title: String,
      description: String,
      image: String
    }],
    
    // Animation and interaction options
    animation: {
      enabled: { type: Boolean, default: false },
      type: { type: String, default: 'fadeIn' }, // fadeIn, slideUp, slideLeft, etc.
      delay: { type: Number, default: 0 },
      duration: { type: Number, default: 500 }
    },
    
    // Conditional display
    displayConditions: {
      startDate: Date,
      endDate: Date,
      userRoles: [String],
      deviceType: { type: String, default: 'all' } // all, desktop, mobile, tablet
    },
    
    // SEO fields
    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String]
    },
    
    // General fields
    isVisible: { type: Boolean, default: true },
    customCSS: { type: String, default: '' },
    customJS: { type: String, default: '' },
    
    updatedAt: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

// Pre-save middleware to handle complex data
HomeContentSectionSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  
  // Set default values based on type
  if (this.type === 'hero' && !this.layout.background) {
    this.layout.background = 'gradient-1';
  }
  
  if (this.type === 'features-grid' && this.layout.columns === 1) {
    this.layout.columns = 3;
  }
  
  // Clean up unused fields based on type
  const typeSpecificFields = {
    'card': ['cardButtonText', 'cardButtonLink', 'cardButtonStyle'],
    'hero': ['heroSubtitle', 'heroImage', 'heroButtons'],
    'features-grid': ['features'],
    'stats': ['stats'],
    'process-steps': ['steps'],
    'gallery': ['images'],
    'video': ['videoUrl', 'videoThumbnail', 'videoPlatform'],
    'accordion': ['accordionItems'],
    'timeline': ['timelineItems']
  };
  
  // Reset fields that don't apply to current type
  Object.keys(typeSpecificFields).forEach(type => {
    if (this.type !== type) {
      typeSpecificFields[type].forEach(field => {
        if (this[field] !== undefined) {
          if (Array.isArray(this[field])) {
            this[field] = [];
          } else if (typeof this[field] === 'string') {
            this[field] = '';
          }
        }
      });
    }
  });
  
  next();
});

module.exports = mongoose.model('HomeContentSection', HomeContentSectionSchema);