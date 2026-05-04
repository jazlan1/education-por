const asyncHandler = require('express-async-handler');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Class = require('../models/Class');

const normalizeAttendanceDate = (value) => {
  const normalized = new Date(value);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

// @desc    Mark attendance for a class on a date
// @route   POST /api/attendance
// @access  Admin, Teacher
const markAttendance = asyncHandler(async (req, res) => {
  const { classId, date, records } = req.body;

  if (!classId || !date || !Array.isArray(records) || records.length === 0) {
    res.status(400);
    throw new Error('Class, date, and attendance records are required');
  }

  const attendanceDate = normalizeAttendanceDate(date);
  const month = attendanceDate.getMonth() + 1;
  const year = attendanceDate.getFullYear();

  const targetClass = await Class.findById(classId);
  if (!targetClass) {
    res.status(404);
    throw new Error('Class not found');
  }

  const students = await Student.find({ 'admission.currentClass': classId, status: 'Active' })
    .select('_id fullName rollNumber');

  if (!students.length) {
    res.status(400);
    throw new Error('No active students found in this class');
  }

  const validStudentIds = new Set(students.map(student => String(student._id)));
  const recordStudentIds = records.map(record => String(record.student));
  const invalidRecord = recordStudentIds.find(studentId => !validStudentIds.has(studentId));
  if (invalidRecord) {
    res.status(400);
    throw new Error('Attendance contains a student outside the selected class');
  }

  const missingStudents = students.filter(student => !recordStudentIds.includes(String(student._id)));
  if (missingStudents.length > 0) {
    res.status(400);
    throw new Error('Attendance must be submitted for every active student in the class');
  }

  const duplicateIds = recordStudentIds.filter((studentId, index) => recordStudentIds.indexOf(studentId) !== index);
  if (duplicateIds.length > 0) {
    res.status(400);
    throw new Error('Duplicate attendance records found for the same student');
  }

  // Check if already marked
  const existing = await Attendance.findOne({ class: classId, date: attendanceDate });
  if (existing) {
    // Update existing
    existing.records = records;
    existing.markedBy = req.user._id;
    await existing.save();
    return res.json({ success: true, message: 'Attendance updated', data: existing });
  }

  const attendance = await Attendance.create({
    class: classId,
    date: attendanceDate,
    month,
    year,
    markedBy: req.user._id,
    records,
  });

  res.status(201).json({ success: true, message: 'Attendance marked', data: attendance });
});

// @desc    Get attendance for a class on a specific date
// @route   GET /api/attendance/class/:classId
// @access  Admin, Teacher
const getClassAttendance = asyncHandler(async (req, res) => {
  const { date, month, year = new Date().getFullYear() } = req.query;
  const { classId } = req.params;

  const query = { class: classId, year: parseInt(year) };
  if (date) query.date = normalizeAttendanceDate(date);
  if (month) query.month = parseInt(month);

  const attendance = await Attendance.find(query)
    .populate('records.student', 'fullName rollNumber profilePhoto')
    .populate('markedBy', 'name')
    .sort({ date: -1 });

  res.json({ success: true, data: attendance });
});

// @desc    Get attendance sheet for a class (monthly view)
// @route   GET /api/attendance/class/:classId/monthly
// @access  Admin, Teacher
const getMonthlyAttendance = asyncHandler(async (req, res) => {
  const { month = new Date().getMonth() + 1, year = new Date().getFullYear() } = req.query;
  const { classId } = req.params;

  const students = await Student.find({ 'admission.currentClass': classId, status: 'Active' })
    .select('fullName rollNumber');

  const attendances = await Attendance.find({ class: classId, month: parseInt(month), year: parseInt(year) })
    .sort({ date: 1 });

  // Build matrix: student -> dates
  const matrix = students.map(student => {
    const dailyData = {};
    let present = 0, absent = 0, late = 0;

    attendances.forEach(att => {
      const record = att.records.find(r => r.student.toString() === student._id.toString());
      const dayKey = new Date(att.date).getDate();
      if (record) {
        dailyData[dayKey] = record.status;
        if (record.status === 'Present') present++;
        else if (record.status === 'Absent') absent++;
        else if (record.status === 'Late') late++;
      }
    });

    const total = attendances.length;
    const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    return {
      student: { _id: student._id, fullName: student.fullName, rollNumber: student.rollNumber },
      dailyData,
      summary: { present, absent, late, total, percentage },
    };
  });

  res.json({
    success: true,
    data: matrix,
    dates: attendances.map(a => ({ date: a.date, day: new Date(a.date).getDate() })),
    month: parseInt(month),
    year: parseInt(year),
  });
});

// @desc    Get today's attendance status for a class
// @route   GET /api/attendance/class/:classId/today
// @access  Admin, Teacher
const getTodayAttendance = asyncHandler(async (req, res) => {
  const today = normalizeAttendanceDate(new Date());

  const attendance = await Attendance.findOne({ class: req.params.classId, date: today })
    .populate('records.student', 'fullName rollNumber profilePhoto');

  res.json({ success: true, data: attendance, isMarked: !!attendance });
});

// @desc    Get student's monthly attendance summary
// @route   GET /api/attendance/student/:studentId/summary
// @access  Admin, Teacher, Own Student
const getStudentAttendanceSummary = asyncHandler(async (req, res) => {
  // Students can only view their own attendance
  if (req.user.role === 'student') {
    if (req.user.profileRef?.toString() !== req.params.studentId) {
      res.status(403);
      throw new Error('Access denied');
    }
  }

  const { year = new Date().getFullYear() } = req.query;
  const { studentId } = req.params;

  const monthlySummary = [];
  for (let m = 1; m <= 12; m++) {
    const summary = await Attendance.getStudentAttendance(studentId, m, parseInt(year));
    monthlySummary.push({ month: m, ...summary });
  }

  const annual = await Attendance.getStudentAttendance(studentId, null, parseInt(year));

  res.json({ success: true, data: { monthly: monthlySummary, annual }, year: parseInt(year) });
});

module.exports = { markAttendance, getClassAttendance, getMonthlyAttendance, getTodayAttendance, getStudentAttendanceSummary };
