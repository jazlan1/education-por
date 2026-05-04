import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from './NotificationBell';

// ─── Teacher Layout ───────────────────────────────────────────────────────────
const teacherNav = [
  { section: 'Main' },
  { to: '/teacher', label: 'Dashboard', icon: '📊', end: true },
  { section: 'Classroom' },
  { to: '/teacher/attendance', label: 'Mark Attendance', icon: '✅' },
  { to: '/teacher/results', label: 'Manage Results', icon: '📝' },
  { section: 'Account' },
  { to: '/teacher/profile', label: 'My Profile', icon: '👤' },
];

export function TeacherLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <h1>🏫 EduManage</h1>
          <span>Teacher Portal</span>
        </div>
        <nav className="sidebar-nav">
          {teacherNav.map((item, i) =>
            item.section ? (
              <div key={i} className="nav-section-title">{item.section}</div>
            ) : (
              <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                <span>{item.icon}</span>{item.label}
              </NavLink>
            )
          )}
        </nav>
        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div className="avatar" style={{ background: '#def7ec', color: '#057a55' }}>{user?.name?.[0]?.toUpperCase()}</div>
            <div>
              <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
              <div style={{ color: '#64748b', fontSize: 11 }}>Teacher</div>
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }} className="btn btn-secondary w-full btn-sm">🚪 Logout</button>
        </div>
      </aside>
      <div className="main-content">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="btn btn-ghost btn-sm mobile-menu-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              ☰
            </button>
            <span className="topbar-title">Teacher Portal</span>
          </div>
          <div className="topbar-right">
            <NotificationBell />
            <div className="avatar" style={{ background: '#def7ec', color: '#057a55', fontWeight: 700 }}>{user?.name?.[0]?.toUpperCase()}</div>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</span>
          </div>
        </header>
        <main className="page-content"><Outlet /></main>
      </div>
    </div>
  );
}

// ─── Student Layout ───────────────────────────────────────────────────────────
const studentNav = [
  { section: 'My Portal' },
  { to: '/student', label: 'Dashboard', icon: '📊', end: true },
  { to: '/student/profile', label: 'My Profile', icon: '👤' },
  { to: '/student/results', label: 'My Results', icon: '📝' },
  { to: '/student/attendance', label: 'My Attendance', icon: '📅' },
  { to: '/student/fees', label: 'My Fees', icon: '💰' },
];

export function StudentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <h1>🏫 EduManage</h1>
          <span>Student Portal</span>
        </div>
        <nav className="sidebar-nav">
          {studentNav.map((item, i) =>
            item.section ? (
              <div key={i} className="nav-section-title">{item.section}</div>
            ) : (
              <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                <span>{item.icon}</span>{item.label}
              </NavLink>
            )
          )}
        </nav>
        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div className="avatar" style={{ background: '#fef3c7', color: '#92400e' }}>{user?.name?.[0]?.toUpperCase()}</div>
            <div>
              <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
              <div style={{ color: '#64748b', fontSize: 11 }}>Student</div>
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }} className="btn btn-secondary w-full btn-sm">🚪 Logout</button>
        </div>
      </aside>
      <div className="main-content">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="btn btn-ghost btn-sm mobile-menu-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              ☰
            </button>
            <span className="topbar-title">Student Portal</span>
          </div>
          <div className="topbar-right">
            <NotificationBell />
            <div className="avatar" style={{ background: '#fef3c7', color: '#92400e', fontWeight: 700 }}>{user?.name?.[0]?.toUpperCase()}</div>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</span>
          </div>
        </header>
        <main className="page-content"><Outlet /></main>
      </div>
    </div>
  );
}

export default TeacherLayout;

