const express = require('express');
const router = express.Router();
const { getDashboardStats, getTeacherDashboard, exportStudentsExcel, exportTeachersExcel, exportResultsExcel, getStudentReport } = require('../controllers/reportController');
const { protect, adminOnly, adminOrTeacher } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, adminOnly, getDashboardStats);
router.get('/teacher-dashboard', protect, getTeacherDashboard);
router.get('/student/:id', protect, getStudentReport);
router.get('/export/students', protect, adminOnly, exportStudentsExcel);
router.get('/export/teachers', protect, adminOnly, exportTeachersExcel);
router.get('/export/results/:classId', protect, adminOrTeacher, exportResultsExcel);

module.exports = router;
