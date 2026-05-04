const express = require('express');
const router = express.Router();
const {
  getStudents, getStudent, createStudent, updateStudent,
  deleteStudent, getStudentAttendance, getStudentResults, updateStudentStatus,
} = require('../controllers/studentController');
const { protect, adminOnly, adminOrTeacher } = require('../middleware/authMiddleware');
const { uploadProfilePhoto } = require('../middleware/uploadMiddleware');

router.get('/', protect, adminOrTeacher, getStudents);
router.get('/:id', protect, getStudent);
router.post('/', protect, adminOnly, uploadProfilePhoto, createStudent);
router.put('/:id', protect, adminOnly, uploadProfilePhoto, updateStudent);
router.delete('/:id', protect, adminOnly, deleteStudent);
router.put('/:id/status', protect, adminOnly, updateStudentStatus);
router.get('/:id/attendance', protect, getStudentAttendance);
router.get('/:id/results', protect, getStudentResults);

module.exports = router;
