const mongoose = require('mongoose');
const logger = require('../utils/logger');
const { connectDB: connectMockDB, User: MockUser, Student: MockStudent, Teacher: MockTeacher, Class: MockClass, Attendance: MockAttendance, Result: MockResult, Notification: MockNotification, Fee: MockFee } = require('./mock-db');

// Database connection function
const connectDB = async () => {
  // Check if we should use mock database
  if (process.env.USE_MOCK_DB === 'true') {
    console.log('🔄 Using Mock Database for testing...');
    await connectMockDB();

    // Export mock models
    module.exports.User = MockUser;
    module.exports.Student = MockStudent;
    module.exports.Teacher = MockTeacher;
    module.exports.Class = MockClass;
    module.exports.Attendance = MockAttendance;
    module.exports.Result = MockResult;
    module.exports.Notification = MockNotification;
    module.exports.Fee = MockFee;
    return;
  }

  // Try to connect to MongoDB Atlas
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
    });
    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Export real models
    module.exports.User = require('../models/User');
    module.exports.Student = require('../models/Student');
    module.exports.Teacher = require('../models/Teacher');
    module.exports.Class = require('../models/Class');
    module.exports.Attendance = require('../models/Attendance');
    module.exports.Result = require('../models/Result');
    module.exports.Notification = require('../models/Notification');
    module.exports.Fee = require('../models/Fee');

  } catch (error) {
    logger.warn(`⚠️  MongoDB Connection Failed: ${error.message}`);
    console.warn(`⚠️  MongoDB Connection Failed: ${error.message}`);
    console.log('🔄 Switching to Mock Database for testing...');

    // Set mock DB flag so model files use mock models
    process.env.USE_MOCK_DB = 'true';

    // Clear require cache for model files so they reload as mock models
    const modelNames = ['User', 'Student', 'Teacher', 'Class', 'Attendance', 'Result', 'Notification', 'Fee'];
    modelNames.forEach(name => {
      try {
        const key = require.resolve(`../models/${name}`);
        if (require.cache[key]) delete require.cache[key];
      } catch {}
    });

    // Use mock database as fallback
    await connectMockDB();

    // Export mock models
    module.exports.User = MockUser;
    module.exports.Student = MockStudent;
    module.exports.Teacher = MockTeacher;
    module.exports.Class = MockClass;
    module.exports.Attendance = MockAttendance;
    module.exports.Result = MockResult;
    module.exports.Notification = MockNotification;
    module.exports.Fee = MockFee;
  }
};

module.exports = connectDB;
