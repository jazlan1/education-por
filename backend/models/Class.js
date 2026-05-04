const mongoose = require('mongoose');

// Check if we should use mock database
if (process.env.USE_MOCK_DB === 'true') {
  // Export mock model instead
  module.exports = require('../config/mock-db').Class;
  return;
}

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Class name is required'],
    unique: true,
    trim: true,
  },
  section: {
    type: String,
    trim: true,
    default: 'A',
  },
  grade: {
    type: Number,
    required: true,
    min: 1,
    max: 12,
  },
  classTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
  },
  subjects: [{
    name: String,
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  }],
  academicYear: {
    type: String,
    required: true,
  },
  maxStudents: {
    type: Number,
    default: 40,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual to count enrolled students
classSchema.virtual('studentCount', {
  ref: 'Student',
  localField: '_id',
  foreignField: 'admission.currentClass',
  count: true,
});

module.exports = mongoose.model('Class', classSchema);
