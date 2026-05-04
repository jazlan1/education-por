import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
});

// Request interceptor - attach token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sms_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle auth errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sms_token');
      localStorage.removeItem('sms_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Helper to extract error message
export const getError = (error) =>
  error.response?.data?.message || error.message || 'Something went wrong';

// ---- Auth ----
export const authAPI = {
  login: (data) => API.post('/auth/login', data),
  getMe: () => API.get('/auth/me'),
  changePassword: (data) => API.put('/auth/change-password', data),
  getUsers: (params) => API.get('/auth/users', { params }),
  toggleUserStatus: (id) => API.put(`/auth/users/${id}/toggle-status`),
};

// ---- Students ----
export const studentAPI = {
  getAll: (params) => API.get('/students', { params }),
  getOne: (id) => API.get(`/students/${id}`),
  create: (data) => API.post('/students', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => API.put(`/students/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => API.delete(`/students/${id}`),
  updateStatus: (id, data) => API.put(`/students/${id}/status`, data),
  getAttendance: (id, params) => API.get(`/students/${id}/attendance`, { params }),
  getResults: (id, params) => API.get(`/students/${id}/results`, { params }),
};

// ---- Teachers ----
export const teacherAPI = {
  getAll: (params) => API.get('/teachers', { params }),
  getOne: (id) => API.get(`/teachers/${id}`),
  create: (data) => API.post('/teachers', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => API.put(`/teachers/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => API.delete(`/teachers/${id}`),
  assignClass: (id, data) => API.put(`/teachers/${id}/assign-class`, data),
};

// ---- Classes ----
export const classAPI = {
  getAll: (params) => API.get('/classes', { params }),
  getOne: (id) => API.get(`/classes/${id}`),
  getStudents: (id, params) => API.get(`/classes/${id}/students`, { params }),
  create: (data) => API.post('/classes', data),
  update: (id, data) => API.put(`/classes/${id}`, data),
  delete: (id) => API.delete(`/classes/${id}`),
};

// ---- Attendance ----
export const attendanceAPI = {
  mark: (data) => API.post('/attendance', data),
  getByClass: (classId, params) => API.get(`/attendance/class/${classId}`, { params }),
  getMonthly: (classId, params) => API.get(`/attendance/class/${classId}/monthly`, { params }),
  getToday: (classId) => API.get(`/attendance/class/${classId}/today`),
  getStudentSummary: (studentId, params) => API.get(`/attendance/student/${studentId}/summary`, { params }),
};

// ---- Results ----
export const resultAPI = {
  getByClass: (classId, params) => API.get(`/results/class/${classId}`, { params }),
  getByStudent: (studentId, params) => API.get(`/results/student/${studentId}`, { params }),
  create: (data) => API.post('/results', data),
  bulkCreate: (data) => API.post('/results/bulk', data),
  update: (id, data) => API.put(`/results/${id}`, data),
  delete: (id) => API.delete(`/results/${id}`),
};

// ---- Reports ----
export const reportAPI = {
  getDashboard: () => API.get('/reports/dashboard'),
  getTeacherDashboard: () => API.get('/reports/teacher-dashboard'),
  getStudentReport: (id) => API.get(`/reports/student/${id}`),
  exportStudents: (params) => API.get('/reports/export/students', { params, responseType: 'blob' }),
  exportTeachers: () => API.get('/reports/export/teachers', { responseType: 'blob' }),
  exportResults: (classId, params) => API.get(`/reports/export/results/${classId}`, { params, responseType: 'blob' }),
};

// ---- Notifications ----
export const notificationAPI = {
  getAll: () => API.get('/notifications'),
  getMy: (params) => API.get('/notifications/my', { params }),
  create: (data) => API.post('/notifications', data),
  markRead: (id) => API.put(`/notifications/${id}/read`),
  markAllRead: () => API.put('/notifications/mark-all-read'),
  delete: (id) => API.delete(`/notifications/${id}`),
};

// ---- Fees ----
export const feeAPI = {
  getByClass: (classId, params) => API.get(`/fees/class/${classId}`, { params }),
  getByStudent: (studentId, params) => API.get(`/fees/student/${studentId}`, { params }),
  getSummary: (params) => API.get('/fees/summary', { params }),
  create: (data) => API.post('/fees', data),
  update: (id, data) => API.put(`/fees/${id}`, data),
  delete: (id) => API.delete(`/fees/${id}`),
};

export default API;
