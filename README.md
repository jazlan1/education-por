# 🏫 EduManage — School Management System (MERN Stack)

A complete, production-ready School Management System built with the MERN stack featuring role-based authentication, student/teacher management, attendance tracking, result management, PDF/Excel reports, and notifications.

---

## 📋 Table of Contents
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Folder Structure](#folder-structure)
- [Setup Instructions](#setup-instructions)
- [API Endpoints](#api-endpoints)
- [Default Credentials](#default-credentials)
- [Roles & Permissions](#roles--permissions)

---

## 🛠 Tech Stack

| Layer     | Technology                              |
|-----------|----------------------------------------|
| Frontend  | React 18, React Router v6, Recharts    |
| Backend   | Node.js, Express.js (MVC Architecture) |
| Database  | MongoDB with Mongoose ODM              |
| Auth      | JWT (JSON Web Tokens) + bcryptjs       |
| Upload    | Multer (profile photos)                |
| Export    | XLSX (Excel), jsPDF + autoTable (PDF)  |
| Security  | Helmet, express-rate-limit, CORS       |

---

## ✨ Features

### Admin Panel
- 📊 Dashboard with live stats, charts (enrollment, gender, attendance)
- 🎓 Full Student CRUD (profile photo, CNIC, DOB, address, admission record)
- 👨‍🏫 Full Teacher CRUD (CNIC, qualification, subjects, photo)
- 🏫 Class management (assign teachers, track enrollment)
- 📈 Reports — Excel export for students, teachers, results
- 📄 Per-student PDF report with results + attendance
- 🔔 Push notifications to all/role-based users
- 👥 User account management (activate/deactivate)

### Teacher Panel
- 📅 Mark daily attendance (Present/Absent/Late/Excused per student)
- ✅ Edit previously marked attendance
- 📝 Add/update exam results per subject
- 🏆 Auto-calculated grades and class positions
- 👤 View and update own profile

### Student Panel
- 📊 Dashboard with attendance ring chart and latest result
- 👤 View complete profile (read-only)
- 📝 View all results with subject breakdown
- 📅 Monthly attendance summary with percentage

### System-wide
- 🔐 JWT authentication with role-based access control
- 📧 Password change for all users
- 🔔 Real-time notification bell (polls every 30s)
- 📱 Responsive design (mobile-friendly)
- 🔒 Rate limiting on auth routes
- 🛡️ Helmet security headers

---

## 📁 Folder Structure

```
sms/
├── backend/
│   ├── config/
│   │   └── db.js                    # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── studentController.js
│   │   ├── teacherController.js
│   │   ├── classController.js
│   │   ├── attendanceController.js
│   │   ├── resultController.js
│   │   ├── reportController.js
│   │   └── notificationController.js
│   ├── middleware/
│   │   ├── authMiddleware.js         # JWT protect + authorize
│   │   ├── errorMiddleware.js        # Global error handler
│   │   └── uploadMiddleware.js       # Multer file upload
│   ├── models/
│   │   ├── User.js
│   │   ├── Student.js
│   │   ├── Teacher.js
│   │   ├── Class.js
│   │   ├── Attendance.js
│   │   ├── Result.js
│   │   └── Notification.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── studentRoutes.js
│   │   ├── teacherRoutes.js
│   │   ├── classRoutes.js
│   │   ├── attendanceRoutes.js
│   │   ├── resultRoutes.js
│   │   ├── reportRoutes.js
│   │   └── notificationRoutes.js
│   ├── uploads/
│   │   └── profiles/                # Profile photo storage
│   ├── utils/
│   │   ├── tokenUtils.js
│   │   └── seeder.js                # Demo data seeder
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── public/
    │   └── index.html
    └── src/
        ├── components/
        │   └── shared/
        │       ├── AdminLayout.jsx
        │       ├── TeacherLayout.jsx  # Also exports StudentLayout
        │       ├── StudentLayout.jsx
        │       ├── NotificationBell.jsx
        │       └── UI.jsx             # Reusable components
        ├── context/
        │   └── AuthContext.jsx
        ├── pages/
        │   ├── auth/
        │   │   └── LoginPage.jsx
        │   ├── admin/
        │   │   ├── Dashboard.jsx
        │   │   ├── Students.jsx
        │   │   ├── StudentDetail.jsx
        │   │   ├── AddEditStudent.jsx
        │   │   ├── Teachers.jsx
        │   │   ├── AddEditTeacher.jsx
        │   │   ├── Classes.jsx
        │   │   ├── ClassDetail.jsx
        │   │   ├── Reports.jsx
        │   │   ├── Notifications.jsx
        │   │   └── Users.jsx
        │   ├── teacher/
        │   │   ├── Dashboard.jsx
        │   │   ├── Attendance.jsx
        │   │   ├── Results.jsx
        │   │   └── Profile.jsx
        │   └── student/
        │       ├── Dashboard.jsx
        │       ├── Profile.jsx
        │       ├── Results.jsx
        │       └── Attendance.jsx
        ├── services/
        │   └── api.js                # Axios instance + all API calls
        ├── App.jsx
        ├── index.js
        └── index.css
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone / Extract Project

```bash
# Navigate to project root
cd sms
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/school_management
JWT_SECRET=your_super_secret_key_minimum_32_chars
JWT_EXPIRE=30d
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
MAX_FILE_SIZE=5242880
```

```bash
# Seed database with demo data
npm run seed

# Start development server
npm run dev

# OR start production server
npm start
```

Backend runs at: `http://localhost:5000`

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Edit `.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_UPLOAD_URL=http://localhost:5000
```

```bash
# Start development server
npm start
```

Frontend runs at: `http://localhost:3000`

---

## 🔑 Default Credentials (after seeding)

| Role    | Email                    | Password     |
|---------|--------------------------|--------------|
| Admin   | admin@school.com         | admin123     |
| Teacher | teacher1@school.com      | teacher123   |
| Teacher | teacher2@school.com      | teacher123   |
| Student | student1@school.com      | student123   |
| Student | student2@school.com      | student123   |
| Student | student3@school.com      | student123   |

---

## 🌐 API Endpoints

### Authentication
| Method | Endpoint                        | Access  | Description              |
|--------|----------------------------------|---------|--------------------------|
| POST   | /api/auth/login                 | Public  | Login and get JWT token  |
| GET    | /api/auth/me                    | All     | Get current user profile |
| PUT    | /api/auth/change-password       | All     | Change own password      |
| POST   | /api/auth/register-admin        | Public* | Register first admin     |
| GET    | /api/auth/users                 | Admin   | List all user accounts   |
| PUT    | /api/auth/users/:id/toggle-status| Admin  | Activate/deactivate user |

### Students
| Method | Endpoint                          | Access         | Description              |
|--------|-----------------------------------|----------------|--------------------------|
| GET    | /api/students                     | Admin,Teacher  | List students (search/filter/page) |
| POST   | /api/students                     | Admin          | Create student + user account |
| GET    | /api/students/:id                 | All*           | Get student details      |
| PUT    | /api/students/:id                 | Admin          | Update student           |
| DELETE | /api/students/:id                 | Admin          | Delete student + account |
| PUT    | /api/students/:id/status          | Admin          | Update Active/Left status|
| GET    | /api/students/:id/attendance      | All*           | Get student attendance   |
| GET    | /api/students/:id/results         | All*           | Get student results      |

### Teachers
| Method | Endpoint                          | Access  | Description              |
|--------|-----------------------------------|---------|--------------------------|
| GET    | /api/teachers                     | Admin   | List teachers            |
| POST   | /api/teachers                     | Admin   | Create teacher + account |
| GET    | /api/teachers/:id                 | Admin,Own| Get teacher details     |
| PUT    | /api/teachers/:id                 | Admin   | Update teacher           |
| DELETE | /api/teachers/:id                 | Admin   | Delete teacher + account |
| PUT    | /api/teachers/:id/assign-class    | Admin   | Assign/remove class      |

### Classes
| Method | Endpoint                          | Access         | Description              |
|--------|-----------------------------------|----------------|--------------------------|
| GET    | /api/classes                      | All            | List classes             |
| POST   | /api/classes                      | Admin          | Create class             |
| GET    | /api/classes/:id                  | All            | Get class with students  |
| PUT    | /api/classes/:id                  | Admin          | Update class             |
| DELETE | /api/classes/:id                  | Admin          | Delete class (if empty)  |
| GET    | /api/classes/:id/students         | Admin,Teacher  | Students in class        |

### Attendance
| Method | Endpoint                                  | Access         | Description                  |
|--------|-------------------------------------------|----------------|------------------------------|
| POST   | /api/attendance                           | Admin,Teacher  | Mark/update attendance       |
| GET    | /api/attendance/class/:classId            | Admin,Teacher  | Get class attendance by date |
| GET    | /api/attendance/class/:classId/monthly    | Admin,Teacher  | Monthly attendance matrix    |
| GET    | /api/attendance/class/:classId/today      | Admin,Teacher  | Today's attendance status    |
| GET    | /api/attendance/student/:studentId/summary| All*           | Student attendance summary   |

### Results
| Method | Endpoint                          | Access         | Description                  |
|--------|-----------------------------------|----------------|------------------------------|
| GET    | /api/results/class/:classId       | Admin,Teacher  | Class results                |
| GET    | /api/results/student/:studentId   | All*           | Student results              |
| POST   | /api/results                      | Admin,Teacher  | Add single result            |
| POST   | /api/results/bulk                 | Admin,Teacher  | Bulk results for class       |
| PUT    | /api/results/:id                  | Admin,Teacher  | Update result                |
| DELETE | /api/results/:id                  | Admin          | Delete result                |

### Reports
| Method | Endpoint                          | Access         | Description              |
|--------|-----------------------------------|----------------|--------------------------|
| GET    | /api/reports/dashboard            | Admin          | Admin dashboard stats    |
| GET    | /api/reports/teacher-dashboard    | Teacher        | Teacher dashboard stats  |
| GET    | /api/reports/student/:id          | All*           | Full student report data |
| GET    | /api/reports/export/students      | Admin          | Export students (Excel)  |
| GET    | /api/reports/export/teachers      | Admin          | Export teachers (Excel)  |
| GET    | /api/reports/export/results/:id   | Admin,Teacher  | Export results (Excel)   |

### Notifications
| Method | Endpoint                          | Access  | Description              |
|--------|-----------------------------------|---------|--------------------------|
| POST   | /api/notifications                | Admin   | Send notification        |
| GET    | /api/notifications                | Admin   | All notifications        |
| GET    | /api/notifications/my             | All     | My notifications         |
| PUT    | /api/notifications/:id/read       | All     | Mark as read             |
| PUT    | /api/notifications/mark-all-read  | All     | Mark all as read         |
| DELETE | /api/notifications/:id            | Admin   | Delete notification      |

*Students can only access their own data

---

## 🔐 Roles & Permissions

| Feature               | Admin | Teacher | Student |
|-----------------------|:-----:|:-------:|:-------:|
| Manage Students       | ✅    | 👁️ View | Own only|
| Manage Teachers       | ✅    | Own only| ❌      |
| Manage Classes        | ✅    | 👁️ View | 👁️ View |
| Mark Attendance       | ✅    | ✅      | ❌      |
| View Attendance       | ✅    | ✅      | Own only|
| Add/Edit Results      | ✅    | ✅      | ❌      |
| View Results          | ✅    | ✅      | Own only|
| Export Reports        | ✅    | Partial | ❌      |
| Send Notifications    | ✅    | ❌      | ❌      |
| Manage User Accounts  | ✅    | ❌      | ❌      |

---

## 🔧 Environment Variables

### Backend `.env`
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/school_management
JWT_SECRET=minimum_32_character_secret_key
JWT_EXPIRE=30d
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
MAX_FILE_SIZE=5242880
```

### Frontend `.env`
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_UPLOAD_URL=http://localhost:5000
```

---

## 🛡️ Security Features

- **JWT Authentication** — All protected routes require valid Bearer token
- **Password Hashing** — bcryptjs with salt rounds of 12
- **Rate Limiting** — 100 req/15min general, 20 req/15min on auth routes
- **Helmet** — HTTP security headers
- **CORS** — Restricted to frontend origin
- **Role-based Guards** — Middleware checks role on every protected route
- **File Upload Validation** — Type and size validation on all uploads
- **Input Validation** — Mongoose schema validation + controller-level checks

---

## 📦 Production Build

### Backend
```bash
cd backend
NODE_ENV=production node server.js
```

### Frontend
```bash
cd frontend
npm run build
# Serve the build/ directory with nginx or serve package
```

---

## 🤝 Contributing

This is a production-ready starter. Feel free to extend with:
- SMS/email notifications (Twilio, Nodemailer)
- Fee management module
- Library management module
- Timetable/schedule module
- Parent portal
- Mobile app (React Native)
