// teacherRoutes.js
const express = require('express');
const router = express.Router();
const { getTeachers, getTeacher, createTeacher, updateTeacher, deleteTeacher, assignClass } = require('../controllers/teacherController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { uploadProfilePhoto } = require('../middleware/uploadMiddleware');

router.get('/', protect, adminOnly, getTeachers);
router.get('/:id', protect, getTeacher);
router.post('/', protect, adminOnly, uploadProfilePhoto, createTeacher);
router.put('/:id', protect, adminOnly, uploadProfilePhoto, updateTeacher);
router.delete('/:id', protect, adminOnly, deleteTeacher);
router.put('/:id/assign-class', protect, adminOnly, assignClass);

module.exports = router;
