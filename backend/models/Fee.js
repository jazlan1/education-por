const mongoose = require('mongoose');

// Check if we should use mock database
if (process.env.USE_MOCK_DB === 'true') {
  module.exports = require('../config/mock-db').Fee;
  return;
}

const feeSchema = new mongoose.Schema({
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
  month: {
    type: Number, // 1-12
    required: true,
  },
  feeType: {
    type: String,
    enum: ['Tuition', 'Admission', 'Exam', 'Transport', 'Fine', 'Other'],
    default: 'Tuition',
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  fineAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  dueAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  status: {
    type: String,
    enum: ['Paid', 'Partial', 'Unpaid', 'Overdue'],
    default: 'Unpaid',
  },
  paidDate: {
    type: Date,
  },
  remarks: {
    type: String,
    trim: true,
  },
  enteredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Calculate due amount before saving
feeSchema.pre('save', function(next) {
  this.dueAmount = Math.max(0, this.amount + this.fineAmount - this.paidAmount);

  if (this.paidAmount >= this.amount + this.fineAmount) {
    this.status = 'Paid';
  } else if (this.paidAmount > 0) {
    this.status = 'Partial';
  } else {
    this.status = 'Unpaid';
  }

  // Auto-set paid date if fully paid
  if (this.status === 'Paid' && !this.paidDate) {
    this.paidDate = new Date();
  }

  next();
});

feeSchema.index({ student: 1, academicYear: 1, month: 1 });
feeSchema.index({ class: 1, academicYear: 1 });
feeSchema.index({ status: 1 });

module.exports = mongoose.model('Fee', feeSchema);

