const mongoose = require('mongoose');

// Check if we should use mock database
if (process.env.USE_MOCK_DB === 'true') {
  // Export mock model instead
  module.exports = require('../config/mock-db').Result;
  return;
}

const subjectResultSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  totalMarks: { type: Number, required: true },
  obtainedMarks: { type: Number, required: true },
  grade: { type: String },
  remarks: { type: String },
}, { _id: false });

const resultSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
  },
  academicYear: {
    type: String,
    required: true,
  },
  examType: {
    type: String,
    enum: ['Monthly', 'Mid-Term', 'First-Yearly', 'Second-Yearly', 'Third-Yearly', 'Pre-Board', 'Final', 'Annual'],
    required: true,
  },
  subjects: [subjectResultSchema],
  totalMarks: { type: Number },
  obtainedMarks: { type: Number },
  percentage: { type: Number },
  grade: { type: String },
  position: {
    type: Number, // 1st, 2nd, 3rd
  },
  status: {
    type: String,
    enum: ['Pass', 'Fail', 'Absent'],
    default: 'Pass',
  },
  remarks: { type: String },
  enteredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Calculate totals and grade before saving
resultSchema.pre('save', function(next) {
  if (this.subjects && this.subjects.length > 0) {
    this.totalMarks = this.subjects.reduce((sum, s) => sum + s.totalMarks, 0);
    this.obtainedMarks = this.subjects.reduce((sum, s) => sum + s.obtainedMarks, 0);
    this.percentage = Math.round((this.obtainedMarks / this.totalMarks) * 100);
    this.grade = this.calculateGrade(this.percentage);
    this.status = this.percentage >= 40 ? 'Pass' : 'Fail';
  }
  next();
});

resultSchema.methods.calculateGrade = function(percentage) {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
};

resultSchema.index({ student: 1, academicYear: 1, examType: 1 });
resultSchema.index({ class: 1, academicYear: 1 });

module.exports = mongoose.model('Result', resultSchema);
