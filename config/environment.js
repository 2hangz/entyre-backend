const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
const loadEnvironment = () => {
  // Load .env file
  const envPath = path.join(process.cwd(), '.env');
  
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  } else {
    console.warn('Warning: .env file not found. Using environment variables.');
  }
};

// Validate required environment variables
const validateEnvironment = () => {
  const required = [
    'MONGODB_URI',
    'JWT_SECRET',
    'CLOUD_NAME',
    'CLOUD_API_KEY',
    'CLOUD_API_SECRET'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    console.error('Please check your .env file or environment configuration');
    process.exit(1);
  }
};

// Sanitize and validate environment variables
const getConfig = () => {
  loadEnvironment();
  validateEnvironment();

  return {
    // Server configuration
    port: parseInt(process.env.PORT) || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
    
    // Database configuration
    mongodb: {
      uri: process.env.MONGODB_URI,
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE) || 10,
        serverSelectionTimeoutMS: parseInt(process.env.DB_TIMEOUT) || 5000,
        socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT) || 45000,
      }
    },

    // JWT configuration
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      issuer: process.env.JWT_ISSUER || 'entyre-cms',
      audience: process.env.JWT_AUDIENCE || 'entyre-users'
    },

    // Cloudinary configuration
    cloudinary: {
      cloudName: process.env.CLOUD_NAME,
      apiKey: process.env.CLOUD_API_KEY,
      apiSecret: process.env.CLOUD_API_SECRET,
      secure: process.env.CLOUDINARY_SECURE !== 'false'
    },

    // CORS configuration
    cors: {
      origins: process.env.ALLOWED_ORIGINS 
        ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
        : ['http://localhost:3000', 'http://localhost:5173'],
      credentials: process.env.CORS_CREDENTIALS !== 'false'
    },

    // Rate limiting
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
      authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 5
    },

    // File upload configuration
    upload: {
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: process.env.ALLOWED_MIME_TYPES 
        ? process.env.ALLOWED_MIME_TYPES.split(',').map(type => type.trim())
        : ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      tempDir: process.env.UPLOAD_TEMP_DIR || './uploads'
    },

    // Security configuration
    security: {
      bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
      sessionSecret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
      helmetConfig: {
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:", "*.cloudinary.com"],
            connectSrc: ["'self'", "*.cloudinary.com"]
          }
        }
      }
    },

    // Python script configuration
    python: {
      executable: process.env.PYTHON_EXECUTABLE || 'python3',
      scriptTimeout: parseInt(process.env.PYTHON_SCRIPT_TIMEOUT) || 30000,
      dataDir: process.env.PYTHON_DATA_DIR || './data',
      outputDir: process.env.PYTHON_OUTPUT_DIR || './image'
    },

    // Logging configuration
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      format: process.env.LOG_FORMAT || 'combined'
    }
  };
};

// Validate JWT secret strength
const validateJWTSecret = (secret) => {
  if (!secret || secret === 'your-secret-key-here' || secret.length < 32) {
    console.error('WARNING: JWT_SECRET is weak or default. Please use a strong, unique secret.');
    if (process.env.NODE_ENV === 'production') {
      console.error('CRITICAL: Weak JWT secret in production environment!');
      process.exit(1);
    }
  }
};

// Initialize configuration
const config = getConfig();
validateJWTSecret(config.jwt.secret);

module.exports = config;