const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const logger = require('../utils/logger');

// Protect routes - verify JWT
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    logger.warn('Unauthorized access attempt - no token provided', { path: req.originalUrl });
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      logger.warn('User not found for token', { userId: decoded.id });
      res.status(401);
      throw new Error('User not found');
    }

    if (!req.user.isActive) {
      logger.warn('Inactive user access attempt', { userId: req.user._id, email: req.user.email });
      res.status(401);
      throw new Error('Account has been deactivated');
    }

    next();
  } catch (error) {
    logger.warn('Token verification failed', { error: error.message });
    res.status(401);
    throw new Error('Not authorized, invalid token');
  }
});

// Role-based access control
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      logger.warn('Unauthorized role access attempt', {
        userId: req.user._id,
        userRole: req.user.role,
        requiredRoles: roles,
        path: req.originalUrl,
      });
      res.status(403);
      throw new Error(`Role '${req.user.role}' is not authorized to access this route`);
    }
    next();
  };
};

// Admin only
const adminOnly = authorize('admin');

// Admin and Teacher
const adminOrTeacher = authorize('admin', 'teacher');

module.exports = { protect, authorize, adminOnly, adminOrTeacher };
