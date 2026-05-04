import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { studentAPI, feeAPI, getError } from '../../services/api';
import { Spinner, Avatar, GradeBadge, ProgressBar, StatusBadge } from '../../components/shared/UI';
import toast from 'react-hot-toast';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [feeData, setFeeData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.profileRef) { setLoading(false); return; }
    Promise.all([
      studentAPI.getOne(user.profileRef),
      feeAPI.getByStudent(user.profileRef),
    ])
      .then(([studentRes, feeRes]) => {
        setData(studentRes.data.data);
        setFeeData(feeRes.data.data);
      })
      .catch(err => toast.error(getError(err)))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={36} /></div>;
  if (!data) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <div style={{ fontSize: 48 }}>👤</div>
      <p style={{ marginTop: 12, color: 'var(--text-2)' }}>Profile not found. Please contact admin.</p>
    </div>
  );

  const attendance = data.attendanceSummary;
  const latestResult = data.results?.[0];
  const feeSummary = feeData?.summary;

  return (
    <div>
      {/* Welcome Header */}
      <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', border: 'none' }}>
        <div style={{ padding: '28px 28px', display: 'flex', gap: 20, alignItems: 'center' }}>
          <Avatar src={data.profilePhoto} name={data.fullName} size="xl" />
          <div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 4 }}>Welcome back,</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 800 }}>{data.fullName}</h1>
            <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>🎓 {data.admission?.currentClass?.name || 'No class'}</span>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>📋 Roll: <strong className="font-mono">{data.rollNumber}</strong></span>
              <StatusBadge status={data.status} />
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-3" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#def7ec', color: '#0e9f6e' }}><span style={{ fontSize: 22 }}>📅</span></div>
          <div>
            <div className="stat-value">{attendance?.percentage || 0}%</div>
            <div className="stat-label">Attendance Rate</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{attendance?.present || 0}/{attendance?.total || 0} days</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ebf2ff', color: '#1a56db' }}><span style={{ fontSize: 22 }}>📝</span></div>
          <div>
            <div className="stat-value">{data.results?.length || 0}</div>
            <div className="stat-label">Exams Recorded</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Across all years</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}><span style={{ fontSize: 22 }}>🏆</span></div>
          <div>
            <div className="stat-value">{latestResult?.grade || '—'}</div>
            <div className="stat-label">Latest Grade</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{latestResult?.examType || 'No results yet'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fde8e8', color: '#e02424' }}><span style={{ fontSize: 22 }}>💰</span></div>
          <div>
            <div className="stat-value" style={{ color: feeSummary?.totalDue > 0 ? '#e02424' : '#0e9f6e' }}>
              ₨ {feeSummary?.totalDue?.toLocaleString() || 0}
            </div>
            <div className="stat-label">Total Due</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
              {feeSummary?.totalPaid?.toLocaleString() || 0} paid of {feeSummary?.totalAmount?.toLocaleString() || 0}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        {/* Latest Result */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">📝 Latest Result</span>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/student/results')}>View All</button>
          </div>
          <div className="card-body">
            {latestResult ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{latestResult.examType} Exam</div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{latestResult.academicYear} · {latestResult.class?.name}</div>
                  </div>
                  <GradeBadge grade={latestResult.grade} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  {[
                    { label: 'Obtained', value: latestResult.obtainedMarks, color: '#1a56db' },
                    { label: 'Total', value: latestResult.totalMarks, color: '#0e9f6e' },
                    { label: 'Percentage', value: `${latestResult.percentage}%`, color: '#d97706' },
                    { label: 'Position', value: latestResult.position ? `#${latestResult.position}` : '—', color: '#7c3aed' },
                  ].map(s => (
                    <div key={s.label} style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '10px 14px' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <ProgressBar value={latestResult.percentage} />
                {latestResult.subjects?.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 8 }}>SUBJECT BREAKDOWN</div>
                    {latestResult.subjects.map((sub, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontSize: 13 }}>{sub.subject}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>{sub.obtainedMarks}/{sub.totalMarks}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-3)' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📊</div>
                <p>No results recorded yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Attendance summary */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">📅 Attendance Overview</span>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/student/attendance')}>Details</button>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <div style={{
                width: 140, height: 140, borderRadius: '50%',
                background: `conic-gradient(#0e9f6e ${(attendance?.percentage || 0) * 3.6}deg, var(--surface-2) 0)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: 100, height: 100, borderRadius: '50%',
                  background: 'var(--surface)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: attendance?.percentage >= 75 ? '#0e9f6e' : '#e02424' }}>
                    {attendance?.percentage || 0}%
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)' }}>Present</div>
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, textAlign: 'center' }}>
              {[
                { label: 'Present', value: attendance?.present || 0, color: '#0e9f6e' },
                { label: 'Absent', value: attendance?.absent || 0, color: '#e02424' },
                { label: 'Total', value: attendance?.total || 0, color: '#1a56db' },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '10px 6px' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-2)' }}>{s.label}</div>
                </div>
              ))}
            </div>
            {attendance?.percentage < 75 && (
              <div style={{ marginTop: 14, padding: '10px 14px', background: '#fde8e8', borderRadius: 8, fontSize: 12, color: '#c81e1e' }}>
                ⚠️ Your attendance is below 75%. Please attend regularly.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick nav */}
      <div className="grid grid-3" style={{ marginTop: 24 }}>
        {[
          { label: 'My Profile', icon: '👤', path: '/student/profile', color: '#1a56db', desc: 'View personal details' },
          { label: 'My Results', icon: '📝', path: '/student/results', color: '#0e9f6e', desc: 'All exam results' },
          { label: 'My Attendance', icon: '📅', path: '/student/attendance', color: '#d97706', desc: 'Monthly attendance record' },
          { label: 'My Fees', icon: '💰', path: '/student/fees', color: '#e02424', desc: 'Fee status & dues' },
        ].map(item => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            style={{
              padding: '20px', border: '1.5px solid var(--border)', borderRadius: 12,
              background: 'var(--surface)', cursor: 'pointer', textAlign: 'center',
              fontFamily: 'inherit', transition: 'all 0.15s',
            }}
            onMouseOver={e => { e.currentTarget.style.borderColor = item.color; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>{item.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 14, color: item.color }}>{item.label}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{item.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
