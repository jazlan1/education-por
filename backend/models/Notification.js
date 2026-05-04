const mongoose = require('mongoose');

// Check if we should use mock database
if (process.env.USE_MOCK_DB === 'true') {
  // Export mock model instead
  module.exports = require('../config/mock-db').Notification;
  return;
}

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error'],
    default: 'info',
  },
  recipients: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
  }],
  targetRole: {
    type: String,
    enum: ['all', 'admin', 'teacher', 'student'],
    default: 'all',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Notification', notificationSchema);
