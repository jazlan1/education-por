const mongoose = require('mongoose');

// Check if we should use mock database
if (process.env.USE_MOCK_DB === 'true') {
  // Export mock model instead
  module.exports = require('../config/mock-db').Student;
  return;
}

const admissionSchema = new mongoose.Schema({
  admissionYear: { type: Number, required: true },
  admissionClass: { type: String, required: true },
  currentClass: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  leftYear: { type: Number },
  leftClass: { type: String },
}, { _id: false });

const studentSchema = new mongoose.Schema({
  // Personal Info
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
  },
  fatherName: {
    type: String,
    required: [true, 'Father name is required'],
    trim: true,
  },
  fatherCNIC: {
    type: String,
    required: [true, 'Father CNIC is required'],
    match: [/^\d{5}-\d{7}-\d{1}$/, 'CNIC format: XXXXX-XXXXXXX-X'],
  },
  profilePhoto: {
    type: String,
    default: null,
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required'],
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^(\+92|0)[0-9]{10}$/, 'Invalid phone number'],
  },
  rollNumber: {
    type: String,
    required: [true, 'Roll number is required'],
    unique: true,
    trim: true,
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true,
  },

  // Admission Record
  admission: {
    type: admissionSchema,
    required: true,
  },

  // Status
  status: {
    type: String,
    enum: ['Active', 'Left', 'Graduated'],
    default: 'Active',
  },

  // User account reference
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Indexes for efficient searching
studentSchema.index({ rollNumber: 1 });
studentSchema.index({ fullName: 'text', fatherName: 'text' });
studentSchema.index({ 'admission.currentClass': 1 });
studentSchema.index({ status: 1 });

module.exports = mongoose.model('Student', studentSchema);
