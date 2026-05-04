const asyncHandler = require('express-async-handler');
const Fee = require('../models/Fee');
const Student = require('../models/Student');

// @desc    Get fees for a class
// @route   GET /api/fees/class/:classId
// @access  Admin, Teacher
const getClassFees = asyncHandler(async (req, res) => {
  const { academicYear, month, status } = req.query;
  const query = { class: req.params.classId };
  if (academicYear) query.academicYear = academicYear;
  if (month) query.month = parseInt(month);
  if (status) query.status = status;

  const fees = await Fee.find(query)
    .populate('student', 'fullName rollNumber')
    .populate('class', 'name grade section')
    .sort({ month: 1, createdAt: -1 });

  res.json({ success: true, data: fees });
});

// @desc    Get single student fees
// @route   GET /api/fees/student/:studentId
// @access  Admin, Teacher, Own Student
const getStudentFees = asyncHandler(async (req, res) => {
  // Students can only view their own fees
  if (req.user.role === 'student') {
    if (req.user.profileRef?.toString() !== req.params.studentId) {
      res.status(403);
      throw new Error('Access denied');
    }
  }

  const { academicYear } = req.query;
  const query = { student: req.params.studentId };
  if (academicYear) query.academicYear = academicYear;

  const fees = await Fee.find(query)
    .populate('class', 'name grade section')
    .sort({ academicYear: -1, month: 1 });

  // Calculate summary
  const totalAmount = fees.reduce((sum, f) => sum + f.amount, 0);
  const totalPaid = fees.reduce((sum, f) => sum + f.paidAmount, 0);
  const totalFine = fees.reduce((sum, f) => sum + f.fineAmount, 0);
  const totalDue = fees.reduce((sum, f) => sum + f.dueAmount, 0);

  res.json({
    success: true,
    data: fees,
    summary: { totalAmount, totalPaid, totalFine, totalDue },
  });
});

// @desc    Create fee record
// @route   POST /api/fees
// @access  Admin, Teacher
const createFee = asyncHandler(async (req, res) => {
  const { student, class: classId, academicYear, month, feeType, amount, paidAmount, fineAmount, remarks } = req.body;

  // Check if fee record already exists for this student/month/year/feeType
  const existing = await Fee.findOne({ student, academicYear, month, feeType });
  if (existing) {
    res.status(400);
    throw new Error('Fee record already exists for this student, month, and fee type. Use update instead.');
  }

  const fee = await Fee.create({
    student, class: classId, academicYear, month, feeType, amount, paidAmount: paidAmount || 0,
    fineAmount: fineAmount || 0, remarks, enteredBy: req.user._id,
  });

  const populated = await Fee.findById(fee._id)
    .populate('student', 'fullName rollNumber')
    .populate('class', 'name grade');

  res.status(201).json({ success: true, message: 'Fee record added', data: populated });
});

// @desc    Update fee record
// @route   PUT /api/fees/:id
// @access  Admin, Teacher
const updateFee = asyncHandler(async (req, res) => {
  let fee = await Fee.findById(req.params.id);
  if (!fee) { res.status(404); throw new Error('Fee record not found'); }

  fee = await Fee.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    .populate('student', 'fullName rollNumber')
    .populate('class', 'name grade');

  res.json({ success: true, message: 'Fee record updated', data: fee });
});

// @desc    Delete fee record
// @route   DELETE /api/fees/:id
// @access  Admin
const deleteFee = asyncHandler(async (req, res) => {
  const fee = await Fee.findById(req.params.id);
  if (!fee) { res.status(404); throw new Error('Fee record not found'); }
  await fee.deleteOne();
  res.json({ success: true, message: 'Fee record deleted' });
});

// @desc    Get fee summary (dashboard stats)
// @route   GET /api/fees/summary
// @access  Admin
const getFeeSummary = asyncHandler(async (req, res) => {
  const { academicYear } = req.query;
  const query = {};
  if (academicYear) query.academicYear = academicYear;

  const fees = await Fee.find(query);

  const totalAmount = fees.reduce((sum, f) => sum + f.amount, 0);
  const totalPaid = fees.reduce((sum, f) => sum + f.paidAmount, 0);
  const totalFine = fees.reduce((sum, f) => sum + f.fineAmount, 0);
  const totalDue = fees.reduce((sum, f) => sum + f.dueAmount, 0);

  const statusCounts = {
    Paid: fees.filter(f => f.status === 'Paid').length,
    Partial: fees.filter(f => f.status === 'Partial').length,
    Unpaid: fees.filter(f => f.status === 'Unpaid').length,
    Overdue: fees.filter(f => f.status === 'Overdue').length,
  };

  res.json({
    success: true,
    data: { totalAmount, totalPaid, totalFine, totalDue, statusCounts, totalRecords: fees.length },
  });
});

module.exports = { getClassFees, getStudentFees, createFee, updateFee, deleteFee, getFeeSummary };

