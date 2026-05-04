import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { attendanceAPI, getError } from '../../services/api';
import { PageHeader, Spinner, ProgressBar } from '../../components/shared/UI';
import toast from 'react-hot-toast';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const STATUS_COLORS = { Present: '#0e9f6e', Absent: '#e02424', Late: '#d97706', Excused: '#0891b2' };
const STATUS_BG = { Present: '#def7ec', Absent: '#fde8e8', Late: '#fef3c7', Excused: '#e0f2fe' };

export default function StudentAttendance() {
  const { user } = useAuth();
  const [year, setYear] = useState(new Date().getFullYear());
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [monthDetail, setMonthDetail] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (!user?.profileRef) { setLoading(false); return; }
    setLoading(true);
    attendanceAPI.getStudentSummary(user.profileRef, { year })
      .then(r => setSummary(r.data.data))
      .catch(err => toast.error(getError(err)))
      .finally(() => setLoading(false));
  }, [user, year]);

  const loadMonthDetail = async (month) => {
    if (selectedMonth === month) { setSelectedMonth(null); return; }
    setSelectedMonth(month);
    setLoadingDetail(true);
    try {
      const res = await attendanceAPI.getStudentSummary(user.profileRef, { year, month });
      // Get daily records for selected month
      const detailRes = await attendanceAPI.getStudentSummary(user.profileRef, { year });
      setMonthDetail([]);
    } catch {} finally { setLoadingDetail(false); }
  };

  const annualSummary = summary?.annual;
  const monthly = summary?.monthly || [];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div>
      <PageHeader
        title="My Attendance"
        subtitle="Track your attendance record"
        actions={
          <select className="form-control" style={{ width: 'auto' }} value={year} onChange={e => setYear(parseInt(e.target.value))}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        }
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><Spinner size={36} /></div>
      ) : (
        <>
          {/* Annual Summary */}
          <div className="grid grid-4" style={{ marginBottom: 24 }}>
            {[
              { label: 'Total Days', value: annualSummary?.total || 0, color: '#1a56db', icon: '📅' },
              { label: 'Present', value: annualSummary?.present || 0, color: '#0e9f6e', icon: '✅' },
              { label: 'Absent', value: annualSummary?.absent || 0, color: '#e02424', icon: '❌' },
              { label: 'Annual %', value: `${annualSummary?.percentage || 0}%`, color: '#d97706', icon: '📊' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-icon" style={{ background: s.color + '18', color: s.color }}><span style={{ fontSize: 20 }}>{s.icon}</span></div>
                <div>
                  <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Annual progress bar */}
          {annualSummary?.total > 0 && (
            <div className="card" style={{ marginBottom: 24 }}>
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontWeight: 700 }}>Annual Attendance Rate {year}</span>
                  <span style={{ fontWeight: 800, color: annualSummary?.percentage >= 75 ? '#0e9f6e' : '#e02424', fontSize: 16 }}>
                    {annualSummary?.percentage}%
                  </span>
                </div>
                <div style={{ height: 12, background: 'var(--surface-2)', borderRadius: 100, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${annualSummary?.percentage || 0}%`,
                    background: annualSummary?.percentage >= 75 ? '#0e9f6e' : '#e02424',
                    borderRadius: 100,
                    transition: 'width 0.6s ease',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--text-3)' }}>
                  <span>0%</span>
                  <span style={{ color: '#0891b2' }}>Minimum: 75%</span>
                  <span>100%</span>
                </div>
                {annualSummary?.percentage < 75 && (
                  <div style={{ marginTop: 12, padding: '10px 14px', background: '#fde8e8', borderRadius: 8, fontSize: 13, color: '#c81e1e' }}>
                    ⚠️ Your attendance is below the required 75%. Please attend regularly to avoid academic consequences.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Monthly Grid */}
          <div className="card">
            <div className="card-header"><span className="card-title">📅 Month-wise Breakdown</span></div>
            <div className="card-body">
              {monthly.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-3)' }}>
                  No attendance records for {year}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                  {monthly.map(m => (
                    <div
                      key={m.month}
                      onClick={() => setSelectedMonth(selectedMonth === m.month ? null : m.month)}
                      style={{
                        padding: '14px 16px',
                        border: `1.5px solid ${selectedMonth === m.month ? 'var(--primary)' : 'var(--border)'}`,
                        borderRadius: 10,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        background: selectedMonth === m.month ? 'var(--primary-light)' : 'var(--surface)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{MONTHS[m.month - 1]}</div>
                        <div style={{
                          fontWeight: 800, fontSize: 14,
                          color: m.percentage >= 75 ? '#0e9f6e' : '#e02424',
                        }}>{m.percentage}%</div>
                      </div>
                      <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 100, overflow: 'hidden', marginBottom: 8 }}>
                        <div style={{
                          height: '100%', width: `${m.percentage}%`,
                          background: m.percentage >= 75 ? '#0e9f6e' : '#e02424',
                          borderRadius: 100,
                        }} />
                      </div>
                      <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--text-2)' }}>
                        <span style={{ color: '#0e9f6e', fontWeight: 600 }}>✓ {m.present}</span>
                        <span style={{ color: '#e02424', fontWeight: 600 }}>✗ {m.absent}</span>
                        <span>/ {m.total}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-body">
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)' }}>Legend:</span>
                {Object.entries(STATUS_COLORS).map(([status, color]) => (
                  <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: STATUS_BG[status], border: `1.5px solid ${color}` }} />
                    <span style={{ fontSize: 12, color, fontWeight: 600 }}>{status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
