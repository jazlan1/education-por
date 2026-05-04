const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB Connected for seeding...');
};

const seed = async () => {
  await connectDB();

  try {
    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Student.deleteMany({}),
      Teacher.deleteMany({}),
      Class.deleteMany({}),
    ]);
    console.log('Cleared existing data');

    // Create Admin
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@school.com',
      password: 'admin123',
      role: 'admin',
      isActive: true,
    });
    console.log('✅ Admin created: admin@school.com / admin123');

    // Create Classes
    const classesData = [
      { name: 'Grade 1-A', grade: 1, section: 'A', academicYear: '2024-25', maxStudents: 35 },
      { name: 'Grade 2-A', grade: 2, section: 'A', academicYear: '2024-25', maxStudents: 35 },
      { name: 'Grade 3-A', grade: 3, section: 'A', academicYear: '2024-25', maxStudents: 35 },
      { name: 'Grade 4-A', grade: 4, section: 'A', academicYear: '2024-25', maxStudents: 35 },
      { name: 'Grade 5-A', grade: 5, section: 'A', academicYear: '2024-25', maxStudents: 35 },
    ];
    const classes = await Class.insertMany(classesData);
    console.log(`✅ ${classes.length} classes created`);

    // Create Teachers
    const teachersData = [
      {
        fullName: 'Muhammad Ali',
        cnic: '35202-1234567-1',
        qualification: 'M.Ed',
        joiningYear: 2018,
        subjects: ['Mathematics', 'Science'],
        phoneNumber: '03001234567',
        address: 'House 12, Street 5, Lahore',
        email: 'teacher1@school.com',
        gender: 'Male',
        isActive: true,
      },
      {
        fullName: 'Fatima Khan',
        cnic: '35202-7654321-2',
        qualification: 'B.Ed',
        joiningYear: 2020,
        subjects: ['English', 'Urdu'],
        phoneNumber: '03119876543',
        address: 'House 45, Block B, Lahore',
        email: 'teacher2@school.com',
        gender: 'Female',
        isActive: true,
      },
    ];

    for (const td of teachersData) {
      const tUser = await User.create({
        name: td.fullName,
        email: td.email,
        password: 'teacher123',
        role: 'teacher',
        isActive: true,
      });

      const teacher = await Teacher.create({ ...td, user: tUser._id, assignedClasses: [classes[0]._id] });
      await User.findByIdAndUpdate(tUser._id, { profileRef: teacher._id, profileModel: 'Teacher' });
    }
    console.log(`✅ ${teachersData.length} teachers created (password: teacher123)`);

    // Create Students
    const studentsData = [
      { fullName: 'Ahmed Hassan', fatherName: 'Hassan Ali', fatherCNIC: '35202-1111111-1', dateOfBirth: '2014-03-15', phoneNumber: '03001111111', rollNumber: 'GR1-001', address: 'House 1, Lahore', gender: 'Male', email: 'student1@school.com', classIdx: 0 },
      { fullName: 'Sara Malik', fatherName: 'Malik Farooq', fatherCNIC: '35202-2222222-2', dateOfBirth: '2013-07-22', phoneNumber: '03002222222', rollNumber: 'GR2-001', address: 'House 2, Lahore', gender: 'Female', email: 'student2@school.com', classIdx: 1 },
      { fullName: 'Bilal Ahmed', fatherName: 'Ahmed Raza', fatherCNIC: '35202-3333333-3', dateOfBirth: '2012-11-08', phoneNumber: '03003333333', rollNumber: 'GR3-001', address: 'House 3, Lahore', gender: 'Male', email: 'student3@school.com', classIdx: 2 },
    ];

    for (const sd of studentsData) {
      const sUser = await User.create({
        name: sd.fullName,
        email: sd.email,
        password: 'student123',
        role: 'student',
        isActive: true,
      });

      const student = await Student.create({
        fullName: sd.fullName,
        fatherName: sd.fatherName,
        fatherCNIC: sd.fatherCNIC,
        dateOfBirth: sd.dateOfBirth,
        phoneNumber: sd.phoneNumber,
        rollNumber: sd.rollNumber,
        address: sd.address,
        gender: sd.gender,
        status: 'Active',
        admission: {
          admissionYear: 2020,
          admissionClass: classes[sd.classIdx].name,
          currentClass: classes[sd.classIdx]._id,
        },
        user: sUser._id,
      });

      await User.findByIdAndUpdate(sUser._id, { profileRef: student._id, profileModel: 'Student' });
    }
    console.log(`✅ ${studentsData.length} students created (password: student123)`);

    console.log('\n🎉 Seeding complete!');
    console.log('📋 Login Credentials:');
    console.log('   Admin:   admin@school.com    / admin123');
    console.log('   Teacher: teacher1@school.com / teacher123');
    console.log('   Student: student1@school.com / student123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    process.exit(1);
  }
};

seed();
