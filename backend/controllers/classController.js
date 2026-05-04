const asyncHandler = require('express-async-handler');
const Class = require('../models/Class');
const Student = require('../models/Student');

const getClasses = asyncHandler(async (req, res) => {
  const { academicYear, isActive } = req.query;
  const query = {};
  if (academicYear) query.academicYear = academicYear;
  if (isActive !== undefined) query.isActive = isActive === 'true';

  const classes = await Class.find(query)
    .populate('classTeacher', 'fullName')
    .populate({ path: 'studentCount' })
    .sort({ grade: 1, section: 1 });

  res.json({ success: true, data: classes });
});

const getClass = asyncHandler(async (req, res) => {
  const cls = await Class.findById(req.params.id)
    .populate('classTeacher', 'fullName subjects phoneNumber')
    .populate('subjects.teacher', 'fullName');

  if (!cls) { res.status(404); throw new Error('Class not found'); }

  const students = await Student.find({ 'admission.currentClass': req.params.id, status: 'Active' })
    .select('fullName rollNumber gender profilePhoto');

  res.json({ success: true, data: { ...cls.toObject(), students } });
});

const createClass = asyncHandler(async (req, res) => {
  const existing = await Class.findOne({ name: req.body.name, academicYear: req.body.academicYear });
  if (existing) { res.status(400); throw new Error('Class already exists for this academic year'); }

  const cls = await Class.create(req.body);
  res.status(201).json({ success: true, message: 'Class created', data: cls });
});

const updateClass = asyncHandler(async (req, res) => {
  const cls = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    .populate('classTeacher', 'fullName');
  if (!cls) { res.status(404); throw new Error('Class not found'); }
  res.json({ success: true, message: 'Class updated', data: cls });
});

const deleteClass = asyncHandler(async (req, res) => {
  const studentCount = await Student.countDocuments({ 'admission.currentClass': req.params.id });
  if (studentCount > 0) { res.status(400); throw new Error(`Cannot delete: ${studentCount} students enrolled`); }

  await Class.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Class deleted' });
});

const getClassStudents = asyncHandler(async (req, res) => {
  const { status = 'Active' } = req.query;
  const students = await Student.find({ 'admission.currentClass': req.params.id, status })
    .select('fullName rollNumber gender dateOfBirth profilePhoto phoneNumber');
  res.json({ success: true, data: students, count: students.length });
});

module.exports = { getClasses, getClass, createClass, updateClass, deleteClass, getClassStudents };
