const asyncHandler = require('express-async-handler');
const Teacher = require('../models/Teacher');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

// @desc    Get all teachers
// @route   GET /api/teachers
// @access  Admin
const getTeachers = asyncHandler(async (req, res) => {
  const { search, isActive, page = 1, limit = 20 } = req.query;
  const query = {};

  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { subjects: { $in: [new RegExp(search, 'i')] } },
    ];
  }

  if (isActive !== undefined) query.isActive = isActive === 'true';

  const total = await Teacher.countDocuments(query);
  const teachers = await Teacher.find(query)
    .populate('assignedClasses', 'name grade section')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  res.json({
    success: true,
    data: teachers,
    pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
  });
});

// @desc    Get single teacher
// @route   GET /api/teachers/:id
// @access  Admin, Own Teacher
const getTeacher = asyncHandler(async (req, res) => {
  if (req.user.role === 'teacher') {
    const user = await User.findById(req.user._id);
    if (user.profileRef?.toString() !== req.params.id) {
      res.status(403);
      throw new Error('Access denied');
    }
  }

  const teacher = await Teacher.findById(req.params.id)
    .populate('assignedClasses', 'name grade section academicYear')
    .populate('user', 'email isActive lastLogin');

  if (!teacher) {
    res.status(404);
    throw new Error('Teacher not found');
  }

  res.json({ success: true, data: teacher });
});

// @desc    Create teacher + user account
// @route   POST /api/teachers
// @access  Admin
const createTeacher = asyncHandler(async (req, res) => {
  const { fullName, cnic, qualification, joiningYear, subjects, phoneNumber, address, email, gender, password } = req.body;

  const existingCNIC = await Teacher.findOne({ cnic });
  if (existingCNIC) {
    res.status(400);
    throw new Error('Teacher with this CNIC already exists');
  }

  const userPassword = password || `teacher${cnic.replace(/-/g, '')}@sms`;
  const user = await User.create({ name: fullName, email, password: userPassword, role: 'teacher' });

  const profilePhoto = req.file ? `/uploads/profiles/${req.file.filename}` : null;
  const teacher = await Teacher.create({
    fullName, cnic, qualification, joiningYear, subjects: Array.isArray(subjects) ? subjects : [subjects],
    phoneNumber, address, email, gender, profilePhoto, user: user._id,
  });

  await User.findByIdAndUpdate(user._id, { profileRef: teacher._id, profileModel: 'Teacher' });

  res.status(201).json({
    success: true,
    message: 'Teacher created successfully',
    data: teacher,
    credentials: { email, password: userPassword },
  });
});

// @desc    Update teacher
// @route   PUT /api/teachers/:id
// @access  Admin
const updateTeacher = asyncHandler(async (req, res) => {
  let teacher = await Teacher.findById(req.params.id);
  if (!teacher) {
    res.status(404);
    throw new Error('Teacher not found');
  }

  if (req.file) {
    if (teacher.profilePhoto) {
      const oldPath = path.join(__dirname, '..', teacher.profilePhoto);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    req.body.profilePhoto = `/uploads/profiles/${req.file.filename}`;
  }

  if (req.body.subjects && !Array.isArray(req.body.subjects)) {
    req.body.subjects = [req.body.subjects];
  }

  teacher = await Teacher.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    .populate('assignedClasses', 'name grade section');

  if (req.body.fullName || req.body.email) {
    const updates = {};
    if (req.body.fullName) updates.name = req.body.fullName;
    if (req.body.email) updates.email = req.body.email;
    await User.findByIdAndUpdate(teacher.user, updates);
  }

  res.json({ success: true, message: 'Teacher updated successfully', data: teacher });
});

// @desc    Delete teacher
// @route   DELETE /api/teachers/:id
// @access  Admin
const deleteTeacher = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id);
  if (!teacher) {
    res.status(404);
    throw new Error('Teacher not found');
  }

  if (teacher.profilePhoto) {
    const photoPath = path.join(__dirname, '..', teacher.profilePhoto);
    if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
  }

  if (teacher.user) await User.findByIdAndDelete(teacher.user);
  await teacher.deleteOne();

  res.json({ success: true, message: 'Teacher deleted successfully' });
});

// @desc    Assign class to teacher
// @route   PUT /api/teachers/:id/assign-class
// @access  Admin
const assignClass = asyncHandler(async (req, res) => {
  const { classId, action } = req.body; // action: 'add' | 'remove'

  const teacher = await Teacher.findById(req.params.id);
  if (!teacher) {
    res.status(404);
    throw new Error('Teacher not found');
  }

  if (action === 'add') {
    if (!teacher.assignedClasses.includes(classId)) {
      teacher.assignedClasses.push(classId);
    }
  } else {
    teacher.assignedClasses = teacher.assignedClasses.filter(c => c.toString() !== classId);
  }

  await teacher.save();
  res.json({ success: true, message: `Class ${action === 'add' ? 'assigned' : 'removed'} successfully` });
});

module.exports = { getTeachers, getTeacher, createTeacher, updateTeacher, deleteTeacher, assignClass };
