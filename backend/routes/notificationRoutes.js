const express = require('express');
const router = express.Router();
const { createNotification, getMyNotifications, markAsRead, markAllAsRead, getAllNotifications, deleteNotification } = require('../controllers/notificationController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', protect, adminOnly, getAllNotifications);
router.post('/', protect, adminOnly, createNotification);
router.get('/my', protect, getMyNotifications);
router.put('/mark-all-read', protect, markAllAsRead);
router.put('/:id/read', protect, markAsRead);
router.delete('/:id', protect, adminOnly, deleteNotification);

module.exports = router;
