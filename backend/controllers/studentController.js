const asyncHandler = require('express-async-handler');
const Student = require('../models/Student');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Result = require('../models/Result');
const path = require('path');
const fs = require('fs');

// @desc    Get all students with search, filter, pagination
// @route   GET /api/students
// @access  Admin, Teacher
const getStudents = asyncHandler(async (req, res) => {
  const {
    search, classId, status, page = 1, limit = 20, sortBy = 'createdAt', order = 'desc'
  } = req.query;

  const query = {};

  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { rollNumber: { $regex: search, $options: 'i' } },
      { fatherName: { $regex: search, $options: 'i' } },
    ];
  }

  if (classId) query['admission.currentClass'] = classId;
  if (status) query.status = status;

  const total = await Student.countDocuments(query);
  const students = await Student.find(query)
    .populate('admission.currentClass', 'name grade section')
    .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  res.json({
    success: true,
    data: students,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      limit: parseInt(limit),
    },
  });
});

// @desc    Get single student with full details
// @route   GET /api/students/:id
// @access  Admin, Teacher, Own Student
const getStudent = asyncHandler(async (req, res) => {
  const studentId = req.params.id;

  // Students can only view their own profile
  if (req.user.role === 'student') {
    const user = await User.findById(req.user._id);
    if (user.profileRef?.toString() !== studentId) {
      res.status(403);
      throw new Error('Access denied');
    }
  }

  const student = await Student.findById(studentId)
    .populate('admission.currentClass', 'name grade section classTeacher subjects')
    .populate('user', 'email isActive lastLogin');

  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  // Get attendance summary for current year
  const currentYear = new Date().getFullYear();
  const attendanceSummary = await Attendance.getStudentAttendance(studentId, null, currentYear);

  // Get results
  const results = await Result.find({ student: studentId })
    .populate('class', 'name grade')
    .sort({ academicYear: -1, createdAt: -1 });

  res.json({
    success: true,
    data: { ...student.toObject(), attendanceSummary, results },
  });
});

// @desc    Create student + user account
// @route   POST /api/students
// @access  Admin
const createStudent = asyncHandler(async (req, res) => {
  const {
    fullName, fatherName, fatherCNIC, dateOfBirth, phoneNumber,
    rollNumber, address, gender, admission, email, password
  } = req.body;

  // Check duplicate roll number
  const existingStudent = await Student.findOne({ rollNumber });
  if (existingStudent) {
    res.status(400);
    throw new Error('Roll number already exists');
  }

  // Create user account
  const userPassword = password || `sms${rollNumber}@123`;
  const user = await User.create({
    name: fullName,
    email,
    password: userPassword,
    role: 'student',
  });

  // Build admission object
  const admissionData = {
    admissionYear: admission.admissionYear,
    admissionClass: admission.admissionClass,
    currentClass: admission.currentClass || null,
  };

  // Create student profile
  const profilePhoto = req.file ? `/uploads/profiles/${req.file.filename}` : null;
  const student = await Student.create({
    fullName, fatherName, fatherCNIC, dateOfBirth, phoneNumber,
    rollNumber, address, gender, admission: admissionData,
    profilePhoto, user: user._id,
  });

  // Link profile to user
  await User.findByIdAndUpdate(user._id, {
    profileRef: student._id,
    profileModel: 'Student',
  });

  res.status(201).json({
    success: true,
    message: 'Student created successfully',
    data: student,
    credentials: { email, password: userPassword },
  });
});

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Admin
const updateStudent = asyncHandler(async (req, res) => {
  let student = await Student.findById(req.params.id);
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  // Handle photo update
  if (req.file) {
    // Delete old photo
    if (student.profilePhoto) {
      const oldPath = path.join(__dirname, '..', student.profilePhoto);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    req.body.profilePhoto = `/uploads/profiles/${req.file.filename}`;
  }

  // Handle admission updates
  if (req.body.admission) {
    req.body.admission = { ...student.admission.toObject(), ...req.body.admission };
  }

  student = await Student.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate('admission.currentClass', 'name grade section');

  // Update user name/email if provided
  if (req.body.fullName || req.body.email) {
    const updates = {};
    if (req.body.fullName) updates.name = req.body.fullName;
    if (req.body.email) updates.email = req.body.email;
    await User.findByIdAndUpdate(student.user, updates);
  }

  res.json({ success: true, message: 'Student updated successfully', data: student });
});

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Admin
const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  // Delete photo
  if (student.profilePhoto) {
    const photoPath = path.join(__dirname, '..', student.profilePhoto);
    if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
  }

  // Delete associated user
  if (student.user) await User.findByIdAndDelete(student.user);

  await student.deleteOne();

  res.json({ success: true, message: 'Student deleted successfully' });
});

// @desc    Get student attendance
// @route   GET /api/students/:id/attendance
// @access  Admin, Teacher, Own Student
const getStudentAttendance = asyncHandler(async (req, res) => {
  // Students can only view their own attendance
  if (req.user.role === 'student') {
    if (req.user.profileRef?.toString() !== req.params.id) {
      res.status(403);
      throw new Error('Access denied');
    }
  }

  const { month, year = new Date().getFullYear() } = req.query;

  const query = { year: parseInt(year), 'records.student': req.params.id };
  if (month) query.month = parseInt(month);

  const attendances = await Attendance.find(query)
    .populate('class', 'name grade')
    .sort({ date: 1 });

  const formatted = attendances.map(att => {
    const record = att.records.find(r => r.student.toString() === req.params.id);
    return {
      date: att.date,
      month: att.month,
      year: att.year,
      class: att.class,
      status: record?.status,
      remarks: record?.remarks,
    };
  });

  const summary = await Attendance.getStudentAttendance(req.params.id, month ? parseInt(month) : null, parseInt(year));

  res.json({ success: true, data: formatted, summary });
});

// @desc    Get student results
// @route   GET /api/students/:id/results
// @access  Admin, Teacher, Own Student
const getStudentResults = asyncHandler(async (req, res) => {
  // Students can only view their own results
  if (req.user.role === 'student') {
    if (req.user.profileRef?.toString() !== req.params.id) {
      res.status(403);
      throw new Error('Access denied');
    }
  }

  const results = await Result.find({ student: req.params.id })
    .populate('class', 'name grade section')
    .sort({ academicYear: -1, createdAt: -1 });

  res.json({ success: true, data: results });
});

// @desc    Update student status (Active/Left)
// @route   PUT /api/students/:id/status
// @access  Admin
const updateStudentStatus = asyncHandler(async (req, res) => {
  const { status, leftYear, leftClass } = req.body;

  const student = await Student.findById(req.params.id);
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  student.status = status;
  if (status === 'Left') {
    student.admission.leftYear = leftYear;
    student.admission.leftClass = leftClass;
  }

  await student.save();
  res.json({ success: true, message: 'Status updated', data: student });
});

module.exports = {
  getStudents, getStudent, createStudent, updateStudent,
  deleteStudent, getStudentAttendance, getStudentResults, updateStudentStatus,
};
