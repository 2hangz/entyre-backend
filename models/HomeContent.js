const mongoose = require('mongoose');

// Define sub-schemas for nested objects to avoid Mongoose validation issues
const LayoutSchema = new mongoose.Schema({
  containerWidth: { type: String, default: 'contained', enum: ['full', 'contained', 'narrow'] },
  padding: { type: String, default: 'normal', enum: ['none', 'small', 'normal', 'large'] },
  background: { type: String, default: 'transparent', enum: ['transparent', 'white', 'gray', 'gradient-1', 'gradient-2', 'custom'] },
  customBackground: { type: String, default: '' },
  textAlign: { type: String, default: 'left', enum: ['left', 'center', 'right'] },
  columns: { type: Number, default: 1, min: 1, max: 4 },
  gap: { type: String, default: 'normal', enum: ['small', 'normal', 'large'] }
}, { _id: false });

const TypographySchema = new mongoose.Schema({
  titleSize: { type: String, default: 'h2', enum: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] },
  titleColor: { type: String, default: '#003C69' },
  contentColor: { type: String, default: '#333333' },
  fontFamily: { type: String, default: 'default', enum: ['default', 'serif', 'mono'] }
}, { _id: false });

const HeroButtonSchema = new mongoose.Schema({
  text: { type: String, required: true },
  link: { type: String, required: true },
  style: { type: String, default: 'primary', enum: ['primary', 'secondary', 'outline', 'ghost'] },
  external: { type: Boolean, default: false }
}, { _id: false });

const FeatureSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, default: '' },
  link: { type: String, default: '' },
  linkText: { type: String, default: '' }
}, { _id: false });

const StatSchema = new mongoose.Schema({
  number: { type: String, required: true },
  label: { type: String },
  description: { type: String, default: '' },
  color: { type: String, default: '#CE1F2C' }
}, { _id: false });

const StepSchema = new mongoose.Schema({
  stepNumber: { type: String, default: '' },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  icon: { type: String, default: '' }
}, { _id: false });

const ImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  alt: { type: String, default: '' },
  caption: { type: String, default: '' },
  link: { type: String, default: '' }
}, { _id: false });

const AnimationSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  animationType: { type: String, default: 'fadeIn' }, // Changed from 'type' to avoid conflicts
  delay: { type: Number, default: 0 },
  duration: { type: Number, default: 500 }
}, { _id: false });

const DisplayConditionsSchema = new mongoose.Schema({
  startDate: { type: Date },
  endDate: { type: Date },
  userRoles: [{ type: String }],
  deviceType: { type: String, default: 'all', enum: ['all', 'desktop', 'mobile', 'tablet'] }
}, { _id: false });

const SEOSchema = new mongoose.Schema({
  metaTitle: { type: String, default: '' },
  metaDescription: { type: String, default: '' },
  keywords: [{ type: String }]
}, { _id: false });

const AccordionItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  defaultOpen: { type: Boolean, default: false }
}, { _id: false });

const TimelineItemSchema = new mongoose.Schema({
  date: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  image: { type: String, default: '' }
}, { _id: false });

// Main schema
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
      trim: true,
      default: ''
    },
    type: {
      type: String,
      enum: [
        'text', 
        'key-value', 
        'image', 
        'card',
        'hero',
        'features-grid',
        'stats',
        'cta-section',
        'process-steps',
        'testimonial',
        'gallery',
        'video',
        'accordion',
        'timeline',
        'pricing',
        'team',
        'contact-form',
        'newsletter',
        'social-links',
        'custom-html'
      ], 
      default: 'text'
    },
    
    // Use the sub-schemas for nested objects
    layout: {
      type: LayoutSchema,
      default: () => ({})
    },
    
    typography: {
      type: TypographySchema,
      default: () => ({})
    },
    
    // Card-specific fields
    cardButtonText: { type: String, trim: true, default: '' },
    cardButtonLink: { type: String, trim: true, default: '' },
    cardButtonStyle: { type: String, default: 'primary', enum: ['primary', 'secondary', 'outline', 'ghost'] },
    
    // Hero-specific fields
    heroSubtitle: { type: String, trim: true, default: '' },
    heroImage: { type: String, trim: true, default: '' },
    heroButtons: [HeroButtonSchema],
    
    // Features grid fields
    features: [FeatureSchema],
    
    // Stats fields
    stats: [StatSchema],
    
    // Process steps fields
    steps: [StepSchema],
    
    // Gallery fields
    images: [ImageSchema],
    
    // Video fields
    videoUrl: { type: String, trim: true, default: '' },
    videoThumbnail: { type: String, trim: true, default: '' },
    videoPlatform: { type: String, default: 'youtube', enum: ['youtube', 'vimeo', 'custom'] },
    
    // Accordion fields
    accordionItems: [AccordionItemSchema],
    
    // Timeline fields
    timelineItems: [TimelineItemSchema],
    
    // Animation and interaction options
    animation: {
      type: AnimationSchema,
      default: () => ({})
    },
    
    // Conditional display
    displayConditions: {
      type: DisplayConditionsSchema,
      default: () => ({})
    },
    
    // SEO fields
    seo: {
      type: SEOSchema,
      default: () => ({})
    },
    
    // General fields
    isVisible: { type: Boolean, default: true },
    customCSS: { type: String, default: '' },
    customJS: { type: String, default: '' },
    
    updatedAt: { type: Date, default: Date.now }
  },
  { 
    versionKey: false,
    // Enable strict mode to help catch validation issues
    strict: true
  }
);

// Pre-save middleware to handle complex data
HomeContentSectionSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  
  // Ensure layout defaults are set
  if (!this.layout) {
    this.layout = {};
  }
  
  // Ensure typography defaults are set
  if (!this.typography) {
    this.typography = {};
  }
  
  // Set default values based on type
  if (this.type === 'hero') {
    if (!this.layout.background || this.layout.background === 'transparent') {
      this.layout.background = 'gradient-1';
    }
    if (!this.heroButtons) {
      this.heroButtons = [];
    }
  }
  
  if (this.type === 'features-grid') {
    if (this.layout.columns === 1) {
      this.layout.columns = 3;
    }
    if (!this.features) {
      this.features = [];
    }
  }
  
  // Initialize type-specific arrays if they don't exist
  const typeArrayFields = {
    'hero': 'heroButtons',
    'features-grid': 'features',
    'stats': 'stats',
    'process-steps': 'steps',
    'gallery': 'images',
    'accordion': 'accordionItems',
    'timeline': 'timelineItems'
  };
  
  const fieldName = typeArrayFields[this.type];
  if (fieldName && !this[fieldName]) {
    this[fieldName] = [];
  }
  
  // Clean up unused fields based on type (optional - helps keep data clean)
  if (this.type !== 'card') {
    this.cardButtonText = '';
    this.cardButtonLink = '';
  }
  
  if (this.type !== 'hero') {
    this.heroSubtitle = '';
    this.heroImage = '';
    if (this.heroButtons && this.heroButtons.length === 0) {
      this.heroButtons = undefined;
    }
  }
  
  if (this.type !== 'video') {
    this.videoUrl = '';
    this.videoThumbnail = '';
  }
  
  next();
});

// Pre-update middleware
HomeContentSectionSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  
  if (update.$set) {
    update.$set.updatedAt = new Date();
  } else {
    update.updatedAt = new Date();
  }
  
  next();
});

// Add some helpful methods
HomeContentSectionSchema.methods.toPublicJSON = function() {
  const obj = this.toObject();
  
  // Ensure nested objects have defaults
  if (!obj.layout) obj.layout = {};
  if (!obj.typography) obj.typography = {};
  if (!obj.animation) obj.animation = {};
  if (!obj.displayConditions) obj.displayConditions = {};
  if (!obj.seo) obj.seo = {};
  
  return obj;
};

// Static method to get sections by type
HomeContentSectionSchema.statics.findByType = function(type) {
  return this.find({ type, isVisible: true }).sort({ sectionIndex: 1 });
};

module.exports = mongoose.model('HomeContentSection', HomeContentSectionSchema);