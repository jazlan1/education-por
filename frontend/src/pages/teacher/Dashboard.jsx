import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportAPI, attendanceAPI, classAPI, studentAPI, getError } from '../../services/api';
import { PageHeader, Spinner, Avatar, StatusBadge } from '../../components/shared/UI';
import toast from 'react-hot-toast';

export default function TeacherDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    reportAPI.getTeacherDashboard()
      .then(r => setData(r.data.data))
      .catch(err => toast.error(getError(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={36} /></div>;
  if (!data) return null;

  const { teacher, assignedClasses, totalStudents, attendanceMarkedToday, pendingAttendance } = data;

  return (
    <div>
      <PageHeader
        title={`Welcome, ${teacher?.fullName?.split(' ')[0] || 'Teacher'}!`}
        subtitle={`${new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
      />

      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'My Classes', value: assignedClasses?.length || 0, icon: '🏫', bg: '#ebf2ff', color: '#1a56db' },
          { label: 'Total Students', value: totalStudents, icon: '🎓', bg: '#def7ec', color: '#0e9f6e' },
          { label: 'Attendance Marked', value: attendanceMarkedToday, icon: '✅', bg: '#fef3c7', color: '#d97706' },
          { label: 'Pending Attendance', value: pendingAttendance, icon: '⏳', bg: '#fee2e2', color: '#e02424' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}><span style={{ fontSize: 22 }}>{s.icon}</span></div>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header"><span className="card-title">📚 My Classes</span></div>
          <div className="card-body">
            {assignedClasses?.length > 0 ? assignedClasses.map(cls => (
              <div key={cls._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{cls.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)' }}>Grade {cls.grade} · {cls.academicYear}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => navigate('/teacher/attendance')}>Attendance</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => navigate('/teacher/results')}>Results</button>
                </div>
              </div>
            )) : <p style={{ color: 'var(--text-3)', textAlign: 'center', padding: '20px 0' }}>No classes assigned</p>}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">⚡ Quick Actions</span></div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: '✅ Mark Today\'s Attendance', path: '/teacher/attendance', color: '#0e9f6e' },
                { label: '📝 Add / Update Results', path: '/teacher/results', color: '#1a56db' },
                { label: '👤 My Profile', path: '/teacher/profile', color: '#d97706' },
              ].map(a => (
                <button key={a.label} onClick={() => navigate(a.path)}
                  style={{ padding: '12px 16px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, color: a.color, transition: 'all 0.15s' }}
                  onMouseOver={e => e.currentTarget.style.borderColor = a.color}
                  onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
