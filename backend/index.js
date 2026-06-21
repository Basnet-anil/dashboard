require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 5000;

const sanitizeObject = (target) => {
  if (!target || typeof target !== 'object') return;

  Object.keys(target).forEach((key) => {
    const value = target[key];
    if (key.startsWith('$') || key.includes('.')) {
      delete target[key];
    } else if (value && typeof value === 'object') {
      sanitizeObject(value);
    }
  });
};

const sanitizeRequest = (req, res, next) => {
  sanitizeObject(req.body);
  sanitizeObject(req.params);
  // Don't mutate req.query in Express 5; query validation and escaping are handled per route.
  next();
};

// Security middleware
app.use(helmet());
app.use(sanitizeRequest);

// Logging (disable in production if needed)
if (process.env.NODE_ENV !== 'test') app.use(morgan('combined'));

// Body parsing with limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// CORS: restrict origins via environment variable
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    // In production, check against allowed origins
    if (allowedOrigins.length > 0) {
      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
    } else {
      // Development mode - allow localhost and Vercel domains
      if (origin.includes('localhost') || origin.includes('vercel.app')) {
        return callback(null, true);
      }
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: process.env.RATE_LIMIT_MAX ? Number(process.env.RATE_LIMIT_MAX) : 120,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Serve static files from the public folder
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

// Swagger UI configuration
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
try {
  const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customSiteTitle: 'Dashboard API Documentation'
  }));
} catch (err) {
  console.log('Swagger document not found or invalid', err);
}

// Basic route
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Dashboard API is running. Go to /api-docs.html for API Documentation.' });
});

// Auth route (public)
app.use('/api/auth', require('./routes/auth'));

// Protect remaining API routes with auth middleware
const { authMiddleware } = require('./middleware/auth');
// app.use('/api', authMiddleware); // Disabled for development as frontend doesn't use tokens yet

// Protected routes
app.use('/api/customers', require('./routes/customers'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/vendors', require('./routes/vendors'));
app.use('/api/purchases', require('./routes/purchases'));
app.use('/api/hr', require('./routes/hr'));
app.use('/api/bank', require('./routes/bank'));
app.use('/api/company', require('./routes/company'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/payroll', require('./routes/payroll'));

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('=== ERROR DETAILS ===');
  console.error('URL:', req.method, req.originalUrl);
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
  console.error('==================');
  
  const status = err.status || 500;
  const userMessage = err.message || 'An unexpected error occurred';
  
  res.status(status).json({ 
    error: userMessage,
    message: `Error while trying to ${req.method} ${req.originalUrl}: ${userMessage}`,
    help: 'Check the server console logs for detailed error information.'
  });
});

const startServer = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Missing MONGODB_URI in environment. Please set it in .env.');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || undefined });
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

startServer();
