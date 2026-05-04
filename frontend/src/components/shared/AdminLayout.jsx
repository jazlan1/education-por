import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from './NotificationBell';

const navItems = [
  { section: 'Main' },
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { section: 'Management' },
  { to: '/admin/students', label: 'Students', icon: '🎓' },
  { to: '/admin/teachers', label: 'Teachers', icon: '👨‍🏫' },
  { to: '/admin/classes', label: 'Classes', icon: '🏫' },
  { to: '/admin/attendance', label: 'Attendance', icon: '✅' },
  { to: '/admin/results', label: 'Results', icon: '📝' },
  { to: '/admin/fees', label: 'Fees', icon: '💰' },
  { section: 'System' },
  { to: '/admin/reports', label: 'Reports', icon: '📈' },
  { to: '/admin/notifications', label: 'Notifications', icon: '🔔' },
  { to: '/admin/users', label: 'User Accounts', icon: '👥' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
          <h1>IPHS</h1>
          <span>School Management System</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, index) =>
            item.section ? (
              <div key={index} className="nav-section-title">{item.section}</div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span>{item.icon}</span>
                {item.label}
              </NavLink>
            )
          )}
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div className="avatar" style={{ background: '#1a56db22', color: '#1a56db' }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
              <div style={{ color: '#64748b', fontSize: 11 }}>Administrator</div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary w-full btn-sm">
            Logout
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="btn btn-ghost btn-sm mobile-menu-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              id="sidebar-toggle"
            >
              ☰
            </button>
            <span className="topbar-title">Admin Portal</span>
          </div>
          <div className="topbar-right">
            <NotificationBell />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="avatar" style={{ background: '#ebf2ff', color: '#1a56db', fontWeight: 700 }}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</span>
            </div>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
