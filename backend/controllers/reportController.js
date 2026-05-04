const asyncHandler = require('express-async-handler');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');
const Result = require('../models/Result');
const XLSX = require('xlsx');

// @desc    Get dashboard stats
// @route   GET /api/reports/dashboard
// @access  Admin
const getDashboardStats = asyncHandler(async (req, res) => {
  const [totalStudents, activeStudents, leftStudents, totalTeachers, activeTeachers, totalClasses] = await Promise.all([
    Student.countDocuments(),
    Student.countDocuments({ status: 'Active' }),
    Student.countDocuments({ status: 'Left' }),
    Teacher.countDocuments(),
    Teacher.countDocuments({ isActive: true }),
    Class.countDocuments({ isActive: true }),
  ]);

  // Today's attendance
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayAttendance = await Attendance.find({ date: today });
  let todayPresent = 0, todayTotal = 0;
  todayAttendance.forEach(att => {
    att.records.forEach(r => {
      todayTotal++;
      if (r.status === 'Present' || r.status === 'Late') todayPresent++;
    });
  });

  // Recent students
  const recentStudents = await Student.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select('fullName rollNumber admission.currentClass status profilePhoto createdAt')
    .populate('admission.currentClass', 'name grade');

  // Class-wise student count
  const classStats = await Student.aggregate([
    { $match: { status: 'Active' } },
    { $group: { _id: '$admission.currentClass', count: { $sum: 1 } } },
    { $lookup: { from: 'classes', localField: '_id', foreignField: '_id', as: 'classInfo' } },
    { $unwind: { path: '$classInfo', preserveNullAndEmpty: true } },
    { $project: { className: '$classInfo.name', grade: '$classInfo.grade', count: 1 } },
    { $sort: { grade: 1 } },
  ]);

  // Gender distribution
  const genderStats = await Student.aggregate([
    { $match: { status: 'Active' } },
    { $group: { _id: '$gender', count: { $sum: 1 } } },
  ]);

  res.json({
    success: true,
    data: {
      counts: { totalStudents, activeStudents, leftStudents, totalTeachers, activeTeachers, totalClasses },
      todayAttendance: {
        present: todayPresent,
        total: todayTotal,
        percentage: todayTotal > 0 ? Math.round((todayPresent / todayTotal) * 100) : 0,
        classesMarked: todayAttendance.length,
      },
      recentStudents,
      classStats,
      genderStats,
    },
  });
});

// @desc    Get teacher dashboard stats
// @route   GET /api/reports/teacher-dashboard
// @access  Teacher
const getTeacherDashboard = asyncHandler(async (req, res) => {
  const User = require('../models/User');
  const user = await User.findById(req.user._id);
  const teacher = await Teacher.findById(user.profileRef).populate('assignedClasses');

  if (!teacher) { res.status(404); throw new Error('Teacher profile not found'); }

  const classIds = teacher.assignedClasses.map(c => c._id);
  const totalStudents = await Student.countDocuments({ 'admission.currentClass': { $in: classIds }, status: 'Active' });

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayAttendanceMarked = await Attendance.countDocuments({ class: { $in: classIds }, date: today });

  res.json({
    success: true,
    data: {
      teacher,
      assignedClasses: teacher.assignedClasses,
      totalStudents,
      attendanceMarkedToday: todayAttendanceMarked,
      pendingAttendance: classIds.length - todayAttendanceMarked,
    },
  });
});

// @desc    Export students to Excel
// @route   GET /api/reports/export/students
// @access  Admin
const exportStudentsExcel = asyncHandler(async (req, res) => {
  const { classId, status } = req.query;
  const query = {};
  if (classId) query['admission.currentClass'] = classId;
  if (status) query.status = status;

  const students = await Student.find(query)
    .populate('admission.currentClass', 'name grade section')
    .sort({ rollNumber: 1 });

  const data = students.map((s, i) => ({
    'Sr#': i + 1,
    'Roll No': s.rollNumber,
    'Full Name': s.fullName,
    'Father Name': s.fatherName,
    'Father CNIC': s.fatherCNIC,
    'Date of Birth': s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString() : '',
    'Gender': s.gender,
    'Phone': s.phoneNumber,
    'Class': s.admission?.currentClass?.name || 'N/A',
    'Admission Year': s.admission?.admissionYear,
    'Status': s.status,
    'Address': s.address,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = Object.keys(data[0] || {}).map(() => ({ wch: 18 }));
  XLSX.utils.book_append_sheet(wb, ws, 'Students');

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Disposition', 'attachment; filename=students.xlsx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
});

// @desc    Export teachers to Excel
// @route   GET /api/reports/export/teachers
// @access  Admin
const exportTeachersExcel = asyncHandler(async (req, res) => {
  const teachers = await Teacher.find().sort({ fullName: 1 });

  const data = teachers.map((t, i) => ({
    'Sr#': i + 1,
    'Full Name': t.fullName,
    'CNIC': t.cnic,
    'Email': t.email,
    'Phone': t.phoneNumber,
    'Qualification': t.qualification,
    'Subjects': t.subjects?.join(', '),
    'Joining Year': t.joiningYear,
    'Gender': t.gender,
    'Status': t.isActive ? 'Active' : 'Inactive',
    'Address': t.address,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = Object.keys(data[0] || {}).map(() => ({ wch: 18 }));
  XLSX.utils.book_append_sheet(wb, ws, 'Teachers');

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename=teachers.xlsx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
});

// @desc    Export class results to Excel
// @route   GET /api/reports/export/results/:classId
// @access  Admin, Teacher
const exportResultsExcel = asyncHandler(async (req, res) => {
  const { academicYear, examType } = req.query;
  const query = { class: req.params.classId };
  if (academicYear) query.academicYear = academicYear;
  if (examType) query.examType = examType;

  const results = await Result.find(query)
    .populate('student', 'fullName rollNumber')
    .sort({ position: 1 });

  const data = results.map(r => ({
    'Position': r.position || '-',
    'Roll No': r.student?.rollNumber,
    'Student Name': r.student?.fullName,
    'Total Marks': r.totalMarks,
    'Obtained Marks': r.obtainedMarks,
    'Percentage': `${r.percentage}%`,
    'Grade': r.grade,
    'Status': r.status,
    'Exam Type': r.examType,
    'Academic Year': r.academicYear,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Results');

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename=results.xlsx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
});

// @desc    Get student full report (for print/PDF)
// @route   GET /api/reports/student/:id
// @access  Admin, Teacher, Own Student
const getStudentReport = asyncHandler(async (req, res) => {
  // Students can only view their own report
  if (req.user.role === 'student') {
    if (req.user.profileRef?.toString() !== req.params.id) {
      res.status(403);
      throw new Error('Access denied');
    }
  }

  const student = await Student.findById(req.params.id)
    .populate('admission.currentClass', 'name grade section classTeacher')
    .populate('user', 'email lastLogin');

  if (!student) { res.status(404); throw new Error('Student not found'); }

  const results = await Result.find({ student: req.params.id })
    .populate('class', 'name grade')
    .sort({ academicYear: -1 });

  const currentYear = new Date().getFullYear();
  const attendanceSummary = await Attendance.getStudentAttendance(req.params.id, null, currentYear);

  const monthlyAttendance = [];
  for (let m = 1; m <= 12; m++) {
    const summary = await Attendance.getStudentAttendance(req.params.id, m, currentYear);
    if (summary.total > 0) monthlyAttendance.push({ month: m, ...summary });
  }

  res.json({
    success: true,
    data: {
      student,
      results,
      attendance: { annual: attendanceSummary, monthly: monthlyAttendance, year: currentYear },
      generatedAt: new Date(),
    },
  });
});

module.exports = {
  getDashboardStats, getTeacherDashboard, exportStudentsExcel,
  exportTeachersExcel, exportResultsExcel, getStudentReport,
};
