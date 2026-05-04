const mongoose = require('mongoose');

// Check if we should use mock database
if (process.env.USE_MOCK_DB === 'true') {
  // Export mock model instead
  module.exports = require('../config/mock-db').Teacher;
  return;
}

const teacherSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
  },
  cnic: {
    type: String,
    required: [true, 'CNIC is required'],
    unique: true,
    match: [/^\d{5}-\d{7}-\d{1}$/, 'CNIC format: XXXXX-XXXXXXX-X'],
  },
  qualification: {
    type: String,
    required: [true, 'Qualification is required'],
    trim: true,
  },
  joiningYear: {
    type: Number,
    required: [true, 'Joining year is required'],
    min: 1990,
    max: new Date().getFullYear(),
  },
  subjects: [{
    type: String,
    trim: true,
  }],
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^(\+92|0)[0-9]{10}$/, 'Invalid phone number'],
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
  },
  profilePhoto: {
    type: String,
    default: null,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
  },
  assignedClasses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

teacherSchema.index({ fullName: 'text' });
teacherSchema.index({ cnic: 1 });

module.exports = mongoose.model('Teacher', teacherSchema);
