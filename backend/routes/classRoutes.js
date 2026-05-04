const express = require('express');
const router = express.Router();
const { getClasses, getClass, createClass, updateClass, deleteClass, getClassStudents } = require('../controllers/classController');
const { protect, adminOnly, adminOrTeacher } = require('../middleware/authMiddleware');

router.get('/', protect, getClasses);
router.get('/:id', protect, getClass);
router.get('/:id/students', protect, adminOrTeacher, getClassStudents);
router.post('/', protect, adminOnly, createClass);
router.put('/:id', protect, adminOnly, updateClass);
router.delete('/:id', protect, adminOnly, deleteClass);

module.exports = router;
