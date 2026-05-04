const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const logger = require('./utils/logger');

const app = express();
const isLocalTesting = process.env.NODE_ENV === 'development' || process.env.USE_MOCK_DB === 'true';

app.set('trust proxy', 1);

// Connect to MongoDB/mock DB once when the app is loaded.
const dbReady = connectDB();

const lazyRoute = (routePath) => {
  let router;

  return async (req, res, next) => {
    try {
      await dbReady;
      if (!router) router = require(routePath);
      return router(req, res, next);
    } catch (error) {
      return next(error);
    }
  };
};

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isLocalTesting ? 5000 : 100,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  skip: (req) => isLocalTesting && req.path === '/health',
});
app.use('/api/', limiter);

// Auth rate limiting (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isLocalTesting ? 1000 : 20,
  message: 'Too many login attempts, please try again after 15 minutes',
});

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authLimiter, lazyRoute('./routes/authRoutes'));
app.use('/api/students', lazyRoute('./routes/studentRoutes'));
app.use('/api/teachers', lazyRoute('./routes/teacherRoutes'));
app.use('/api/classes', lazyRoute('./routes/classRoutes'));
app.use('/api/attendance', lazyRoute('./routes/attendanceRoutes'));
app.use('/api/results', lazyRoute('./routes/resultRoutes'));
app.use('/api/reports', lazyRoute('./routes/reportRoutes'));
app.use('/api/notifications', lazyRoute('./routes/notificationRoutes'));
app.use('/api/fees', lazyRoute('./routes/feeRoutes'));

// Serve frontend build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
  });
}

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
let server;

if (require.main === module) {
  server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  if (server) {
    server.close(() => process.exit(1));
    return;
  }
  process.exit(1);
});

module.exports = app;
