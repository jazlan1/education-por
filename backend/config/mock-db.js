const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const DB_FILE = path.join(__dirname, '../../mock-db.json');

let mockDB = {
  users: [],
  students: [],
  teachers: [],
  classes: [],
  attendance: [],
  results: [],
  notifications: [],
  fees: []
};

const getValueByPath = (obj, pathString) => {
  if (!obj || !pathString) return undefined;
  return pathString.split('.').reduce((value, key) => value?.[key], obj);
};

const arrayContainsValue = (value, expected) => {
  if (!Array.isArray(value)) return false;

  return value.some(item => {
    if (item && typeof item === 'object') {
      return Object.values(item).some(nested => String(nested) === String(expected));
    }
    return String(item) === String(expected);
  });
};

const matchesCondition = (value, condition) => {
  if (condition && typeof condition === 'object' && !Array.isArray(condition)) {
    if (condition.$ne !== undefined) {
      return String(value) !== String(condition.$ne);
    }
    if (condition.$in !== undefined) {
      const haystack = condition.$in || [];
      if (Array.isArray(value)) {
        return value.some(item => haystack.some(expected => String(item) === String(expected)));
      }
      return haystack.some(expected => String(value) === String(expected));
    }
    if (condition.$regex !== undefined) {
      const regex = new RegExp(condition.$regex, condition.$options || '');
      return regex.test(String(value || ''));
    }
  }

  if (Array.isArray(value)) {
    return arrayContainsValue(value, condition);
  }

  const valueDate = Date.parse(value);
  const conditionDate = Date.parse(condition);
  if (!Number.isNaN(valueDate) && !Number.isNaN(conditionDate)) {
    return valueDate === conditionDate;
  }

  return String(value) === String(condition);
};

const matchesQuery = (item, query = {}) => {
  if (!query || Object.keys(query).length === 0) return true;

  return Object.entries(query).every(([key, condition]) => {
    if (key === '$or' && Array.isArray(condition)) {
      return condition.some(subQuery => matchesQuery(item, subQuery));
    }

    const value = getValueByPath(item, key);
    return matchesCondition(value, condition);
  });
};

const calculateResultFields = (result) => {
  if (!result?.subjects?.length) return result;

  const totalMarks = result.subjects.reduce((sum, subject) => sum + Number(subject.totalMarks || 0), 0);
  const obtainedMarks = result.subjects.reduce((sum, subject) => sum + Number(subject.obtainedMarks || 0), 0);
  const percentage = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 100) : 0;

  let grade = 'F';
  if (percentage >= 90) grade = 'A+';
  else if (percentage >= 80) grade = 'A';
  else if (percentage >= 70) grade = 'B';
  else if (percentage >= 60) grade = 'C';
  else if (percentage >= 50) grade = 'D';

  return {
    ...result,
    totalMarks,
    obtainedMarks,
    percentage,
    grade,
    status: percentage >= 40 ? 'Pass' : 'Fail'
  };
};

const saveMockDB = () => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(mockDB, null, 2));
  } catch (error) {
    logger.error('Mock database save error', error.message);
  }
};

const hydrateDocument = (doc, collectionName) => {
  if (!doc) return doc;

  const hydrated = {
    ...doc,
    toObject() {
      return JSON.parse(JSON.stringify(this));
    },
    async save() {
      const collection = mockDB[collectionName];
      const index = collection.findIndex(item => item._id === this._id);
      if (index === -1) return this;

      const updatedItem = {
        ...collection[index],
        ...this,
        updatedAt: new Date()
      };

      if (collectionName === 'results') {
        Object.assign(updatedItem, calculateResultFields(updatedItem));
      }

      collection[index] = updatedItem;
      Object.assign(this, updatedItem);
      saveMockDB();
      return this;
    },
    async deleteOne() {
      const collection = mockDB[collectionName];
      const index = collection.findIndex(item => item._id === this._id);
      if (index !== -1) {
        collection.splice(index, 1);
        saveMockDB();
      }
      return this;
    }
  };

  if (collectionName === 'users') {
    hydrated.comparePassword = async function(candidatePassword) {
      return this.password === candidatePassword;
    };

    hydrated.updateLastLogin = async function() {
      this.lastLogin = new Date();
      await this.save();
      return this;
    };
  }

  return hydrated;
};

const createQuery = (resolver) => {
  const queryObject = {
    _selectedFields: null,
    _sortObj: null,
    _limit: null,
    _skip: null,
    _populatePaths: [],
    select(fields) {
      this._selectedFields = fields;
      return this;
    },
    populate(path) {
      this._populatePaths.push(path);
      return this;
    },
    sort(sortObj) {
      this._sortObj = sortObj;
      return this;
    },
    limit(num) {
      this._limit = num;
      return this;
    },
    skip(num) {
      this._skip = num;
      return this;
    },
    then(resolve, reject) {
      return resolver(this).then(resolve, reject);
    },
    catch(reject) {
      return resolver(this).catch(reject);
    },
    finally(handler) {
      return resolver(this).finally(handler);
    }
  };

  return queryObject;
};

const applySelection = (item, selectedFields) => {
  if (!item || !selectedFields) return item;

  const parts = selectedFields.split(' ').filter(Boolean);
  const explicitInclude = parts.filter(field => !field.startsWith('-') && !field.startsWith('+'));
  const plusInclude = parts.filter(field => field.startsWith('+')).map(field => field.slice(1));
  const exclude = parts.filter(field => field.startsWith('-')).map(field => field.slice(1));

  let selectedItem;
  if (explicitInclude.length > 0) {
    selectedItem = {};
    if (item._id !== undefined) selectedItem._id = item._id;
    explicitInclude.forEach(field => {
      if (item[field] !== undefined) selectedItem[field] = item[field];
    });
  } else {
    selectedItem = { ...item };
  }

  plusInclude.forEach(field => {
    if (item[field] !== undefined) selectedItem[field] = item[field];
  });
  exclude.forEach(field => delete selectedItem[field]);
  return selectedItem;
};

const evaluateExpression = (doc, expression) => {
  if (typeof expression === 'string' && expression.startsWith('$')) {
    return getValueByPath(doc, expression.slice(1));
  }

  if (expression && typeof expression === 'object' && !Array.isArray(expression)) {
    const evaluated = {};
    Object.entries(expression).forEach(([key, value]) => {
      evaluated[key] = evaluateExpression(doc, value);
    });
    return evaluated;
  }

  return expression;
};

const applyAggregatePipeline = (collectionName, pipeline = []) => {
  let results = [...mockDB[collectionName]];

  pipeline.forEach(stage => {
    const [operator, config] = Object.entries(stage)[0];

    if (operator === '$match') {
      results = results.filter(item => matchesQuery(item, config));
      return;
    }

    if (operator === '$group') {
      const grouped = new Map();

      results.forEach(item => {
        const groupId = evaluateExpression(item, config._id);
        const mapKey = JSON.stringify(groupId);

        if (!grouped.has(mapKey)) {
          grouped.set(mapKey, { _id: groupId });
        }

        const group = grouped.get(mapKey);
        Object.entries(config).forEach(([field, accumulator]) => {
          if (field === '_id') return;

          if (accumulator.$sum !== undefined) {
            const increment = accumulator.$sum === 1
              ? 1
              : Number(evaluateExpression(item, accumulator.$sum) || 0);
            group[field] = (group[field] || 0) + increment;
          }
        });
      });

      results = Array.from(grouped.values());
      return;
    }

    if (operator === '$lookup') {
      results = results.map(item => {
        const foreignCollection = mockDB[config.from] || [];
        const localValue = getValueByPath(item, config.localField);
        const matches = foreignCollection.filter(foreignItem => {
          const foreignValue = getValueByPath(foreignItem, config.foreignField);
          return String(localValue) === String(foreignValue);
        });

        return {
          ...item,
          [config.as]: matches
        };
      });
      return;
    }

    if (operator === '$unwind') {
      const path = (config.path || '').replace(/^\$/, '');
      const preserveNull = Boolean(config.preserveNullAndEmpty);
      const unwound = [];

      results.forEach(item => {
        const value = getValueByPath(item, path);
        if (Array.isArray(value) && value.length > 0) {
          value.forEach(entry => {
            unwound.push({
              ...item,
              [path]: entry
            });
          });
        } else if (preserveNull) {
          unwound.push({
            ...item,
            [path]: null
          });
        }
      });

      results = unwound;
      return;
    }

    if (operator === '$project') {
      results = results.map(item => {
        const projected = {};

        Object.entries(config).forEach(([field, value]) => {
          if (value === 1) {
            projected[field] = item[field];
          } else if (value !== 0) {
            projected[field] = evaluateExpression(item, value);
          }
        });

        return projected;
      });
      return;
    }

    if (operator === '$sort') {
      const [sortKey, sortOrder] = Object.entries(config)[0];
      results.sort((a, b) => {
        const aValue = getValueByPath(a, sortKey);
        const bValue = getValueByPath(b, sortKey);
        if (aValue < bValue) return sortOrder === 1 ? -1 : 1;
        if (aValue > bValue) return sortOrder === 1 ? 1 : -1;
        return 0;
      });
    }
  });

  return results;
};

const ensureMockShape = () => {
  if (!mockDB.users?.length) {
    initializeMockData();
    return;
  }

  mockDB.users = mockDB.users.map(user => ({
    ...user,
    email: user.email || `${user.role || 'user'}@school.com`,
    isActive: user.isActive !== false
  }));

  mockDB.students = (mockDB.students || []).map(student => ({
    _id: student._id,
    fullName: student.fullName || [student.firstName, student.lastName].filter(Boolean).join(' ') || 'Student Demo',
    fatherName: student.fatherName || student.guardian?.name || 'Parent Demo',
    fatherCNIC: student.fatherCNIC || '12345-1234567-1',
    dateOfBirth: student.dateOfBirth || '2005-05-15',
    phoneNumber: student.phoneNumber || student.phone || '03001234567',
    rollNumber: student.rollNumber || 'STU001',
    address: student.address || 'School Road',
    gender: student.gender === 'female' ? 'Female' : student.gender === 'male' ? 'Male' : (student.gender || 'Female'),
    admission: {
      admissionYear: student.admission?.admissionYear || 2023,
      admissionClass: student.admission?.admissionClass || '10th',
      currentClass: student.admission?.currentClass || 'class_001',
      leftYear: student.admission?.leftYear,
      leftClass: student.admission?.leftClass
    },
    status: student.status || 'Active',
    user: student.user || 'student_001',
    profilePhoto: student.profilePhoto || null,
    createdAt: student.createdAt || new Date(),
    updatedAt: student.updatedAt || new Date()
  }));

  mockDB.teachers = (mockDB.teachers || []).map(teacher => ({
    _id: teacher._id,
    fullName: teacher.fullName || [teacher.firstName, teacher.lastName].filter(Boolean).join(' ') || 'Teacher Demo',
    cnic: teacher.cnic || '12345-1234567-2',
    qualification: teacher.qualification || 'B.Ed',
    joiningYear: teacher.joiningYear || 2021,
    subjects: teacher.subjects || (teacher.specialization ? [teacher.specialization] : ['Mathematics']),
    phoneNumber: teacher.phoneNumber || teacher.phone || '03001234568',
    address: teacher.address || 'Teacher Colony',
    email: teacher.email || 'teacher@school.com',
    gender: teacher.gender || 'Male',
    assignedClasses: teacher.assignedClasses || [],
    isActive: teacher.isActive !== false,
    user: teacher.user || 'teacher_001',
    profilePhoto: teacher.profilePhoto || null,
    createdAt: teacher.createdAt || new Date(),
    updatedAt: teacher.updatedAt || new Date()
  }));

  mockDB.classes = (mockDB.classes || []).map(cls => ({
    _id: cls._id,
    name: cls.name || 'Grade 10-A',
    grade: Number(cls.grade || 10),
    section: cls.section || 'A',
    classTeacher: cls.classTeacher || cls.teacher || 'teacher_profile_001',
    subjects: Array.isArray(cls.subjects)
      ? cls.subjects.map(subject => typeof subject === 'string' ? { name: subject, teacher: 'teacher_profile_001' } : subject)
      : [],
    academicYear: cls.academicYear || '2025-2026',
    maxStudents: cls.maxStudents || 40,
    isActive: cls.isActive !== false,
    createdAt: cls.createdAt || new Date(),
    updatedAt: cls.updatedAt || new Date()
  }));

  mockDB.attendance = (mockDB.attendance || []).map(record => ({
    ...record,
    records: record.records || []
  }));

  mockDB.results = (mockDB.results || []).map(result => calculateResultFields(result));
  mockDB.notifications = mockDB.notifications || [];
  mockDB.fees = mockDB.fees || [];
};

const initializeMockData = () => {
  mockDB = {
    users: [
      {
        _id: 'admin_001',
        name: 'Admin User',
        email: 'admin@school.com',
        password: 'admin123',
        role: 'admin',
        profileRef: null,
        profileModel: null,
        isActive: true,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'teacher_001',
        name: 'John Smith',
        email: 'teacher@school.com',
        password: 'teacher123',
        role: 'teacher',
        profileRef: 'teacher_profile_001',
        profileModel: 'Teacher',
        isActive: true,
        lastLogin: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'student_001',
        name: 'Alice Johnson',
        email: 'student@school.com',
        password: 'student123',
        role: 'student',
        profileRef: 'student_profile_001',
        profileModel: 'Student',
        isActive: true,
        lastLogin: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    students: [
      {
        _id: 'student_profile_001',
        fullName: 'Alice Johnson',
        fatherName: 'Bob Johnson',
        fatherCNIC: '12345-1234567-1',
        dateOfBirth: '2005-05-15',
        phoneNumber: '03001234567',
        rollNumber: 'STU001',
        address: '123 Main St, City, State',
        gender: 'Female',
        admission: {
          admissionYear: 2023,
          admissionClass: '10th',
          currentClass: 'class_001'
        },
        status: 'Active',
        user: 'student_001',
        profilePhoto: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    teachers: [
      {
        _id: 'teacher_profile_001',
        fullName: 'John Smith',
        cnic: '12345-1234567-2',
        qualification: 'M.Sc Mathematics, B.Ed',
        joiningYear: 2021,
        subjects: ['Mathematics', 'Science'],
        phoneNumber: '03001234568',
        address: '456 Teacher Street',
        email: 'teacher@school.com',
        gender: 'Male',
        assignedClasses: ['class_001'],
        isActive: true,
        user: 'teacher_001',
        profilePhoto: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    classes: [
      {
        _id: 'class_001',
        name: 'Grade 10-A',
        grade: 10,
        section: 'A',
        classTeacher: 'teacher_profile_001',
        subjects: [
          { name: 'Mathematics', teacher: 'teacher_profile_001' },
          { name: 'Science', teacher: 'teacher_profile_001' },
          { name: 'English', teacher: 'teacher_profile_001' }
        ],
        academicYear: '2025-2026',
        maxStudents: 40,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    attendance: [
      {
        _id: 'attendance_001',
        class: 'class_001',
        date: '2026-04-20T00:00:00.000Z',
        month: 4,
        year: 2026,
        markedBy: 'admin_001',
        records: [
          { student: 'student_profile_001', status: 'Present', remarks: '' }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    results: [
      calculateResultFields({
        _id: 'result_001',
        student: 'student_profile_001',
        class: 'class_001',
        academicYear: '2025-2026',
        examType: 'Mid-Term',
        subjects: [
          { subject: 'Mathematics', totalMarks: 100, obtainedMarks: 88 },
          { subject: 'Science', totalMarks: 100, obtainedMarks: 81 },
          { subject: 'English', totalMarks: 100, obtainedMarks: 77 }
        ],
        remarks: 'Good progress',
        enteredBy: 'admin_001',
        createdAt: new Date(),
        updatedAt: new Date()
      })
    ],
    notifications: [
      {
        _id: 'notification_001',
        title: 'Welcome',
        message: 'Mock mode is active for local testing.',
        type: 'info',
        audience: 'all',
        createdBy: 'admin_001',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    fees: [
      {
        _id: 'fee_001',
        student: 'student_profile_001',
        class: 'class_001',
        academicYear: '2025-2026',
        month: 1,
        feeType: 'Tuition',
        amount: 5000,
        paidAmount: 5000,
        fineAmount: 0,
        dueAmount: 0,
        status: 'Paid',
        paidDate: new Date('2025-01-05'),
        remarks: 'Paid on time',
        enteredBy: 'admin_001',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'fee_002',
        student: 'student_profile_001',
        class: 'class_001',
        academicYear: '2025-2026',
        month: 2,
        feeType: 'Tuition',
        amount: 5000,
        paidAmount: 3000,
        fineAmount: 500,
        dueAmount: 2500,
        status: 'Partial',
        paidDate: new Date('2025-02-10'),
        remarks: 'Partial payment with late fine',
        enteredBy: 'admin_001',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'fee_003',
        student: 'student_profile_001',
        class: 'class_001',
        academicYear: '2025-2026',
        month: 3,
        feeType: 'Tuition',
        amount: 5000,
        paidAmount: 0,
        fineAmount: 1000,
        dueAmount: 6000,
        status: 'Unpaid',
        remarks: 'Unpaid with penalty',
        enteredBy: 'admin_001',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
  };
};

const loadMockDB = () => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      mockDB = JSON.parse(data);
      ensureMockShape();
      logger.info('Mock database loaded from file');
    } else {
      initializeMockData();
      saveMockDB();
      logger.info('Mock database initialized with sample data');
    }
  } catch (error) {
    logger.error('Mock database load error', error.message);
    initializeMockData();
    saveMockDB();
  }
};

const createMockModel = (collectionName) => ({
  find(query = {}) {
    return createQuery(async (queryObject) => {
      let results = [...mockDB[collectionName]].filter(item => matchesQuery(item, query));

      if (queryObject._sortObj) {
        const sortKey = Object.keys(queryObject._sortObj)[0];
        const sortOrder = queryObject._sortObj[sortKey];
        results.sort((a, b) => {
          const aValue = getValueByPath(a, sortKey);
          const bValue = getValueByPath(b, sortKey);
          if (aValue < bValue) return sortOrder === 1 ? -1 : 1;
          if (aValue > bValue) return sortOrder === 1 ? 1 : -1;
          return 0;
        });
      }

      if (queryObject._skip) results = results.slice(queryObject._skip);
      if (queryObject._limit) results = results.slice(0, queryObject._limit);

      return results
        .map(item => applySelection(item, queryObject._selectedFields))
        .map(item => hydrateDocument(item, collectionName));
    });
  },

  findOne(query = {}) {
    return createQuery(async (queryObject) => {
      const result = mockDB[collectionName].find(item => matchesQuery(item, query));
      return hydrateDocument(applySelection(result, queryObject._selectedFields), collectionName);
    });
  },

  findById(id) {
    return createQuery(async (queryObject) => {
      const result = mockDB[collectionName].find(item => item._id === id);
      return hydrateDocument(applySelection(result, queryObject._selectedFields), collectionName);
    });
  },

  async create(data) {
    const baseItem = {
      ...data,
      _id: `${collectionName.slice(0, -1)}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const newItem = collectionName === 'results' ? calculateResultFields(baseItem) : baseItem;
    mockDB[collectionName].push(newItem);
    saveMockDB();
    return hydrateDocument(newItem, collectionName);
  },

  findByIdAndUpdate(id, updateData, options = {}) {
    return createQuery(async () => {
      const index = mockDB[collectionName].findIndex(item => item._id === id);
      if (index === -1) return null;

      const originalItem = mockDB[collectionName][index];
      const updatedItem = {
        ...originalItem,
        ...updateData,
        updatedAt: new Date()
      };

      mockDB[collectionName][index] = collectionName === 'results' ? calculateResultFields(updatedItem) : updatedItem;
      saveMockDB();

      return hydrateDocument(options.new === false ? originalItem : mockDB[collectionName][index], collectionName);
    });
  },

  async findByIdAndDelete(id) {
    const index = mockDB[collectionName].findIndex(item => item._id === id);
    if (index === -1) return null;

    const deletedItem = mockDB[collectionName][index];
    mockDB[collectionName].splice(index, 1);
    saveMockDB();
    return hydrateDocument(deletedItem, collectionName);
  },

  async countDocuments(query = {}) {
    return mockDB[collectionName].filter(item => matchesQuery(item, query)).length;
  },

  async findOneAndUpdate(query, updateData) {
    const index = mockDB[collectionName].findIndex(item => matchesQuery(item, query));
    if (index === -1) return null;

    const updatedItem = {
      ...mockDB[collectionName][index],
      ...updateData,
      updatedAt: new Date()
    };

    mockDB[collectionName][index] = collectionName === 'results' ? calculateResultFields(updatedItem) : updatedItem;
    saveMockDB();
    return hydrateDocument(mockDB[collectionName][index], collectionName);
  },

  async aggregate(pipeline = []) {
    return applyAggregatePipeline(collectionName, pipeline);
  },

  async updateOne(query = {}, updateData = {}) {
    const index = mockDB[collectionName].findIndex(item => matchesQuery(item, query));
    if (index === -1) return { matchedCount: 0, modifiedCount: 0 };

    const originalItem = mockDB[collectionName][index];
    const updatedItem = {
      ...originalItem,
      ...updateData,
      updatedAt: new Date()
    };

    mockDB[collectionName][index] = collectionName === 'results' ? calculateResultFields(updatedItem) : updatedItem;
    saveMockDB();
    return { matchedCount: 1, modifiedCount: 1 };
  },

  async updateMany(query = {}, updateData = {}) {
    let modifiedCount = 0;
    mockDB[collectionName].forEach((item, index) => {
      if (matchesQuery(item, query)) {
        mockDB[collectionName][index] = {
          ...item,
          ...updateData,
          updatedAt: new Date()
        };
        modifiedCount++;
      }
    });
    if (modifiedCount > 0) saveMockDB();
    return { matchedCount: modifiedCount, modifiedCount };
  }
});

const User = createMockModel('users');
const Student = createMockModel('students');
const Teacher = createMockModel('teachers');
const Class = createMockModel('classes');
const Attendance = createMockModel('attendance');
const Result = createMockModel('results');
const Notification = createMockModel('notifications');
const Fee = createMockModel('fees');

Attendance.getStudentAttendance = async (studentId, month, year) => {
  const records = mockDB.attendance.filter(record => {
    const yearMatches = Number(record.year) === Number(year);
    const monthMatches = month ? Number(record.month) === Number(month) : true;
    const studentMatches = (record.records || []).some(entry => String(entry.student) === String(studentId));
    return yearMatches && monthMatches && studentMatches;
  });

  let present = 0;
  let total = 0;

  records.forEach(record => {
    const studentRecord = record.records.find(entry => String(entry.student) === String(studentId));
    if (studentRecord) {
      total += 1;
      if (studentRecord.status === 'Present' || studentRecord.status === 'Late') {
        present += 1;
      }
    }
  });

  return {
    present,
    total,
    absent: total - present,
    percentage: total > 0 ? Math.round((present / total) * 100) : 0
  };
};

const connectDB = async () => {
  try {
    loadMockDB();
    saveMockDB();
    logger.info('Mock Database Connected Successfully');
    console.log('Mock Database Connected Successfully');
  } catch (error) {
    logger.error('Mock Database Connection Error', error.message);
    console.error('Mock Database Connection Error', error.message);
  }
};

module.exports = {
  connectDB,
  User,
  Student,
  Teacher,
  Class,
  Attendance,
  Result,
  Notification,
  Fee,
  mockDB,
  saveMockDB
};
