const express = require('express');
const router = express.Router();
const { login, getMe, changePassword, registerAdmin, getUsers, toggleUserStatus } = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/register-admin', registerAdmin);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);
router.get('/users', protect, adminOnly, getUsers);
router.put('/users/:id/toggle-status', protect, adminOnly, toggleUserStatus);

module.exports = router;
