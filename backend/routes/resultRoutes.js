const express = require('express');
const router = express.Router();
const { getClassResults, getStudentResults, createResult, updateResult, deleteResult, bulkCreateResults } = require('../controllers/resultController');
const { protect, adminOnly, adminOrTeacher } = require('../middleware/authMiddleware');

router.get('/class/:classId', protect, adminOrTeacher, getClassResults);
router.get('/student/:studentId', protect, getStudentResults);
router.post('/', protect, adminOrTeacher, createResult);
router.post('/bulk', protect, adminOrTeacher, bulkCreateResults);
router.put('/:id', protect, adminOrTeacher, updateResult);
router.delete('/:id', protect, adminOnly, deleteResult);

module.exports = router;
