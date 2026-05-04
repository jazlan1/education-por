import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportAPI, feeAPI, getError } from '../../services/api';
import { PageHeader, Spinner, Avatar, StatusBadge } from '../../components/shared/UI';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import toast from 'react-hot-toast';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const GENDER_COLORS = ['#1a56db', '#e02424', '#0e9f6e'];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [feeSummary, setFeeSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      reportAPI.getDashboard(),
      feeAPI.getSummary(),
    ])
      .then(([dashRes, feeRes]) => {
        setData(dashRes.data.data);
        setFeeSummary(feeRes.data.data);
      })
      .catch(err => toast.error(getError(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={36} /></div>;
  if (!data) return null;

  const { counts, todayAttendance, recentStudents, classStats, genderStats } = data;

  const statCards = [
    { label: 'Total Students', value: counts.totalStudents, icon: '🎓', bg: '#ebf2ff', color: '#1a56db', sub: `${counts.activeStudents} active` },
    { label: 'Total Teachers', value: counts.totalTeachers, icon: '👨‍🏫', bg: '#def7ec', color: '#0e9f6e', sub: `${counts.activeTeachers} active` },
    { label: 'Total Classes', value: counts.totalClasses, icon: '🏫', bg: '#fef3c7', color: '#d97706', sub: 'Active this year' },
    { label: "Today's Attendance", value: `${todayAttendance.percentage}%`, icon: '✅', bg: '#e0f2fe', color: '#0891b2', sub: `${todayAttendance.present}/${todayAttendance.total} present` },
    { label: 'Total Fee Due', value: `₨ ${feeSummary?.totalDue?.toLocaleString() || 0}`, icon: '💰', bg: '#fde8e8', color: '#e02424', sub: `${feeSummary?.totalRecords || 0} records` },
  ];

  const classChartData = classStats.map(c => ({ name: c.className || 'Unknown', students: c.count }));
  const genderChartData = genderStats.map(g => ({ name: g._id || 'Unknown', value: g.count }));

  return (
    <div>
      <PageHeader
        title="Dashboard Overview"
        subtitle={`Welcome back! Here's what's happening today — ${new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
        actions={
          <button className="btn btn-primary" onClick={() => navigate('/admin/students/add')}>
            + Add Student
          </button>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        {statCards.map(card => (
          <div key={card.label} className="stat-card">
            <div className="stat-icon" style={{ background: card.bg, color: card.color }}>
              <span style={{ fontSize: 22 }}>{card.icon}</span>
            </div>
            <div>
              <div className="stat-value">{card.value}</div>
              <div className="stat-label">{card.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{card.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        {/* Class-wise enrollment chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">📊 Class-wise Enrollment</span>
          </div>
          <div className="card-body" style={{ height: 280 }}>
            {classChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }}
                  />
                  <Bar dataKey="students" fill="#1a56db" radius={[4, 4, 0, 0]} name="Students" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-3)' }}>No class data</div>
            )}
          </div>
        </div>

        {/* Gender distribution */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">👥 Gender Distribution</span>
          </div>
          <div className="card-body" style={{ height: 280 }}>
            {genderChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={genderChartData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {genderChartData.map((_, i) => <Cell key={i} fill={GENDER_COLORS[i % GENDER_COLORS.length]} />)}
                  </Pie>
                  <Legend />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-3)' }}>No data</div>
            )}
          </div>
        </div>
      </div>

      {/* Today's attendance summary */}
      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">📅 Today's Attendance Summary</span>
            <span className="badge badge-info">{new Date().toLocaleDateString()}</span>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '20px 0' }}>
              <div style={{
                width: 120, height: 120, borderRadius: '50%',
                background: `conic-gradient(#0e9f6e ${todayAttendance.percentage * 3.6}deg, var(--surface-2) 0)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', marginBottom: 16
              }}>
                <div style={{
                  width: 88, height: 88, borderRadius: '50%',
                  background: 'var(--surface)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexDirection: 'column',
                }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>{todayAttendance.percentage}%</div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600 }}>Present</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 24, textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#0e9f6e' }}>{todayAttendance.present}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Present</div>
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#e02424' }}>{todayAttendance.total - todayAttendance.present}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Absent</div>
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#0891b2' }}>{todayAttendance.classesMarked}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Classes</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="card">
          <div className="card-header"><span className="card-title">⚡ Quick Actions</span></div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Add Student', icon: '🎓', path: '/admin/students/add', color: '#1a56db' },
                { label: 'Add Teacher', icon: '👨‍🏫', path: '/admin/teachers/add', color: '#0e9f6e' },
                { label: 'Add Class', icon: '🏫', path: '/admin/classes', color: '#d97706' },
                { label: 'View Reports', icon: '📈', path: '/admin/reports', color: '#0891b2' },
                { label: 'All Students', icon: '📋', path: '/admin/students', color: '#7c3aed' },
                { label: 'Manage Fees', icon: '💰', path: '/admin/fees', color: '#d97706' },
                { label: 'Notifications', icon: '🔔', path: '/admin/notifications', color: '#e02424' },
              ].map(action => (
                <button
                  key={action.label}
                  onClick={() => navigate(action.path)}
                  style={{
                    padding: '14px', border: '1.5px solid var(--border)',
                    borderRadius: 10, background: 'var(--surface)',
                    cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
                    fontFamily: 'inherit',
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = action.color; e.currentTarget.style.background = action.color + '10'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)'; }}
                >
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{action.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{action.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Students */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">🎓 Recently Added Students</span>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin/students')}>View All →</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Roll Number</th>
                <th>Class</th>
                <th>Status</th>
                <th>Admitted</th>
              </tr>
            </thead>
            <tbody>
              {recentStudents?.length > 0 ? recentStudents.map(s => (
                <tr key={s._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/students/${s._id}`)}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar src={s.profilePhoto} name={s.fullName} size="sm" />
                      <span style={{ fontWeight: 600 }}>{s.fullName}</span>
                    </div>
                  </td>
                  <td><span className="font-mono" style={{ fontSize: 12 }}>{s.rollNumber}</span></td>
                  <td>{s.admission?.currentClass?.name || '—'}</td>
                  <td><StatusBadge status={s.status} /></td>
                  <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                </tr>
              )) : (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 30 }}>No students yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
