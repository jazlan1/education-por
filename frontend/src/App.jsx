import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import AdminLayout from './components/shared/AdminLayout';
import TeacherLayout from './components/shared/TeacherLayout';
import StudentLayout from './components/shared/StudentLayout';

// Auth
import LoginPage from './pages/auth/LoginPage';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import StudentsPage from './pages/admin/Students';
import StudentDetail from './pages/admin/StudentDetail';
import AddEditStudent from './pages/admin/AddEditStudent';
import TeachersPage from './pages/admin/Teachers';
import AddEditTeacher from './pages/admin/AddEditTeacher';
import ClassesPage from './pages/admin/Classes';
import ClassDetail from './pages/admin/ClassDetail';
import ReportsPage from './pages/admin/Reports';
import NotificationsAdminPage from './pages/admin/Notifications';
import UsersPage from './pages/admin/Users';
import FeesPage from './pages/admin/Fees';

// Teacher pages
import TeacherDashboard from './pages/teacher/Dashboard';
import AttendancePage from './pages/teacher/Attendance';
import ResultsPage from './pages/teacher/Results';
import TeacherProfile from './pages/teacher/Profile';

// Student pages
import StudentDashboard from './pages/student/Dashboard';
import StudentProfile from './pages/student/Profile';
import StudentResults from './pages/student/Results';
import StudentAttendance from './pages/student/Attendance';
import StudentFees from './pages/student/Fees';

// Protected route wrappers
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center" style={{ minHeight: '100vh' }}><div className="loading-spinner" style={{ width: 40, height: 40 }} /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={`/${user.role}`} replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) return <Navigate to={`/${user.role}`} replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="students/add" element={<AddEditStudent />} />
        <Route path="students/:id" element={<StudentDetail />} />
        <Route path="students/:id/edit" element={<AddEditStudent />} />
        <Route path="teachers" element={<TeachersPage />} />
        <Route path="teachers/add" element={<AddEditTeacher />} />
        <Route path="teachers/:id/edit" element={<AddEditTeacher />} />
        <Route path="classes" element={<ClassesPage />} />
        <Route path="classes/:id" element={<ClassDetail />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="notifications" element={<NotificationsAdminPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="results" element={<ResultsPage />} />
        <Route path="fees" element={<FeesPage />} />
      </Route>

      {/* Teacher */}
      <Route path="/teacher" element={<ProtectedRoute roles={['teacher']}><TeacherLayout /></ProtectedRoute>}>
        <Route index element={<TeacherDashboard />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="results" element={<ResultsPage />} />
        <Route path="profile" element={<TeacherProfile />} />
      </Route>

      {/* Student */}
      <Route path="/student" element={<ProtectedRoute roles={['student']}><StudentLayout /></ProtectedRoute>}>
        <Route index element={<StudentDashboard />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="results" element={<StudentResults />} />
        <Route path="attendance" element={<StudentAttendance />} />
        <Route path="fees" element={<StudentFees />} />
      </Route>

      {/* Fallback */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: { fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '13.5px', fontWeight: 500 },
            success: { iconTheme: { primary: '#0e9f6e', secondary: '#fff' } },
            error: { iconTheme: { primary: '#e02424', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
