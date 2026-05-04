const express = require('express');
const router = express.Router();
const { getClassFees, getStudentFees, createFee, updateFee, deleteFee, getFeeSummary } = require('../controllers/feeController');
const { protect, adminOnly, adminOrTeacher } = require('../middleware/authMiddleware');

router.get('/class/:classId', protect, adminOrTeacher, getClassFees);
router.get('/student/:studentId', protect, getStudentFees);
router.get('/summary', protect, adminOnly, getFeeSummary);
router.post('/', protect, adminOrTeacher, createFee);
router.put('/:id', protect, adminOrTeacher, updateFee);
router.delete('/:id', protect, adminOnly, deleteFee);

module.exports = router;

