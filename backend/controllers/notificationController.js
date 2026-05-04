const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Create notification
// @route   POST /api/notifications
// @access  Admin
const createNotification = asyncHandler(async (req, res) => {
  const { title, message, type, targetRole } = req.body;

  // Get target users
  const query = { isActive: true };
  if (targetRole !== 'all') query.role = targetRole;
  const users = await User.find(query).select('_id');

  const notification = await Notification.create({
    title, message, type, targetRole,
    recipients: users.map(u => ({ user: u._id })),
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, message: 'Notification sent', data: notification });
});

// @desc    Get my notifications
// @route   GET /api/notifications/my
// @access  All authenticated
const getMyNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query;

  const query = {
    'recipients': { $elemMatch: { user: req.user._id, ...(unreadOnly === 'true' ? { isRead: false } : {}) } },
  };

  const notifications = await Notification.find(query)
    .populate('createdBy', 'name role')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const unreadCount = await Notification.countDocuments({
    'recipients': { $elemMatch: { user: req.user._id, isRead: false } },
  });

  const formatted = notifications.map(n => {
    const myRecord = n.recipients.find(r => r.user.toString() === req.user._id.toString());
    return { ...n.toObject(), isRead: myRecord?.isRead, readAt: myRecord?.readAt };
  });

  res.json({ success: true, data: formatted, unreadCount });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  All authenticated
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    'recipients.user': req.user._id,
  });

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  const recipient = notification.recipients.find(r => r.user.toString() === req.user._id.toString());
  if (recipient) {
    recipient.isRead = true;
    recipient.readAt = new Date();
    await notification.save();
  }

  res.json({ success: true, message: 'Marked as read' });
});

// @desc    Mark all as read
// @route   PUT /api/notifications/mark-all-read
// @access  All authenticated
const markAllAsRead = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({
    'recipients': { $elemMatch: { user: req.user._id, isRead: false } },
  });

  for (const notification of notifications) {
    const recipient = notification.recipients.find(r => r.user.toString() === req.user._id.toString());
    if (recipient) {
      recipient.isRead = true;
      recipient.readAt = new Date();
      await notification.save();
    }
  }

  res.json({ success: true, message: 'All notifications marked as read' });
});

// @desc    Get all notifications (admin)
// @route   GET /api/notifications
// @access  Admin
const getAllNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find()
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 })
    .limit(50);
  res.json({ success: true, data: notifications });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Admin
const deleteNotification = asyncHandler(async (req, res) => {
  await Notification.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Notification deleted' });
});

module.exports = { createNotification, getMyNotifications, markAsRead, markAllAsRead, getAllNotifications, deleteNotification };
