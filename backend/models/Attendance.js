const mongoose = require('mongoose');

// Check if we should use mock database
if (process.env.USE_MOCK_DB === 'true') {
  // Export mock model instead
  module.exports = require('../config/mock-db').Attendance;
  return;
}

const attendanceRecordSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Late', 'Excused'],
    required: true,
  },
  remarks: {
    type: String,
    trim: true,
  },
}, { _id: false });

const attendanceSchema = new mongoose.Schema({
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  month: {
    type: Number, // 1-12
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  records: [attendanceRecordSchema],
}, {
  timestamps: true,
});

// Unique attendance per class per date
attendanceSchema.index({ class: 1, date: 1 }, { unique: true });
attendanceSchema.index({ 'records.student': 1, month: 1, year: 1 });

// Static method to calculate attendance percentage for a student
attendanceSchema.statics.getStudentAttendance = async function(studentId, month, year) {
  const query = { year };
  if (month) query.month = month;

  const records = await this.find(query);
  let present = 0, total = 0;

  records.forEach(att => {
    const studentRecord = att.records.find(r => r.student.toString() === studentId.toString());
    if (studentRecord) {
      total++;
      if (studentRecord.status === 'Present' || studentRecord.status === 'Late') present++;
    }
  });

  return {
    present,
    total,
    absent: total - present,
    percentage: total > 0 ? Math.round((present / total) * 100) : 0,
  };
};

module.exports = mongoose.model('Attendance', attendanceSchema);
