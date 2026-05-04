const asyncHandler = require('express-async-handler');
const Result = require('../models/Result');
const Student = require('../models/Student');

// @desc    Get results for a class
// @route   GET /api/results/class/:classId
// @access  Admin, Teacher
const getClassResults = asyncHandler(async (req, res) => {
  const { academicYear, examType } = req.query;
  const query = { class: req.params.classId };
  if (academicYear) query.academicYear = academicYear;
  if (examType) query.examType = examType;

  const results = await Result.find(query)
    .populate('student', 'fullName rollNumber profilePhoto')
    .populate('class', 'name grade section')
    .sort({ position: 1, percentage: -1 });

  res.json({ success: true, data: results });
});

// @desc    Get single student result
// @route   GET /api/results/student/:studentId
// @access  Admin, Teacher, Own Student
const getStudentResults = asyncHandler(async (req, res) => {
  // Students can only view their own results
  if (req.user.role === 'student') {
    if (req.user.profileRef?.toString() !== req.params.studentId) {
      res.status(403);
      throw new Error('Access denied');
    }
  }

  const { academicYear, examType } = req.query;
  const query = { student: req.params.studentId };
  if (academicYear) query.academicYear = academicYear;
  if (examType) query.examType = examType;

  const results = await Result.find(query)
    .populate('class', 'name grade section')
    .sort({ academicYear: -1, createdAt: -1 });

  res.json({ success: true, data: results });
});

// @desc    Create result
// @route   POST /api/results
// @access  Admin, Teacher
const createResult = asyncHandler(async (req, res) => {
  const { student, class: classId, academicYear, examType, subjects, remarks } = req.body;

  // Check if result already exists
  const existing = await Result.findOne({ student, class: classId, academicYear, examType });
  if (existing) { res.status(400); throw new Error('Result already exists. Use update instead.'); }

  const result = await Result.create({
    student, class: classId, academicYear, examType, subjects, remarks,
    enteredBy: req.user._id,
  });

  // Calculate positions for this class/exam
  await calculatePositions(classId, academicYear, examType);

  const populated = await Result.findById(result._id)
    .populate('student', 'fullName rollNumber')
    .populate('class', 'name grade');

  res.status(201).json({ success: true, message: 'Result added successfully', data: populated });
});

// @desc    Update result
// @route   PUT /api/results/:id
// @access  Admin, Teacher
const updateResult = asyncHandler(async (req, res) => {
  let result = await Result.findById(req.params.id);
  if (!result) { res.status(404); throw new Error('Result not found'); }

  result = await Result.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    .populate('student', 'fullName rollNumber')
    .populate('class', 'name grade');

  // Recalculate positions
  await calculatePositions(result.class._id, result.academicYear, result.examType);

  res.json({ success: true, message: 'Result updated', data: result });
});

// @desc    Delete result
// @route   DELETE /api/results/:id
// @access  Admin
const deleteResult = asyncHandler(async (req, res) => {
  const result = await Result.findById(req.params.id);
  if (!result) { res.status(404); throw new Error('Result not found'); }
  await result.deleteOne();
  res.json({ success: true, message: 'Result deleted' });
});

// @desc    Bulk create results for entire class
// @route   POST /api/results/bulk
// @access  Admin, Teacher
const bulkCreateResults = asyncHandler(async (req, res) => {
  const { classId, academicYear, examType, resultsData } = req.body;

  const created = [];
  const errors = [];

  for (const data of resultsData) {
    try {
      const existing = await Result.findOne({ student: data.student, class: classId, academicYear, examType });
      if (existing) {
        await Result.findByIdAndUpdate(existing._id, { subjects: data.subjects, remarks: data.remarks });
        created.push({ student: data.student, action: 'updated' });
      } else {
        await Result.create({ student: data.student, class: classId, academicYear, examType, subjects: data.subjects, enteredBy: req.user._id });
        created.push({ student: data.student, action: 'created' });
      }
    } catch (err) {
      errors.push({ student: data.student, error: err.message });
    }
  }

  await calculatePositions(classId, academicYear, examType);

  res.json({ success: true, message: 'Bulk results processed', created, errors });
});

// Helper: calculate and assign positions in a class
async function calculatePositions(classId, academicYear, examType) {
  const results = await Result.find({ class: classId, academicYear, examType, status: 'Pass' })
    .sort({ percentage: -1 });

  for (let i = 0; i < results.length; i++) {
    results[i].position = i + 1;
    await results[i].save();
  }
}

module.exports = { getClassResults, getStudentResults, createResult, updateResult, deleteResult, bulkCreateResults };
