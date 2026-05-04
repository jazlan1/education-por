const express = require('express');
const router = express.Router();
const { markAttendance, getClassAttendance, getMonthlyAttendance, getTodayAttendance, getStudentAttendanceSummary } = require('../controllers/attendanceController');
const { protect, adminOrTeacher } = require('../middleware/authMiddleware');

router.post('/', protect, adminOrTeacher, markAttendance);
router.get('/class/:classId', protect, adminOrTeacher, getClassAttendance);
router.get('/class/:classId/monthly', protect, adminOrTeacher, getMonthlyAttendance);
router.get('/class/:classId/today', protect, adminOrTeacher, getTodayAttendance);
router.get('/student/:studentId/summary', protect, getStudentAttendanceSummary);

module.exports = router;
