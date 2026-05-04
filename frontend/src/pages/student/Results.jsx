import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { resultAPI, getError } from '../../services/api';
import { PageHeader, Spinner, GradeBadge, StatusBadge, ProgressBar, EmptyState } from '../../components/shared/UI';
import toast from 'react-hot-toast';

const EXAM_ICONS = { Monthly: '📅', 'Mid-Term': '📊', 'First-Yearly': '🥇', 'Second-Yearly': '🥈', 'Third-Yearly': '🥉', 'Pre-Board': '📋', Final: '🎯', Annual: '🏆' };

export default function StudentResults() {
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ examType: '', academicYear: '' });
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!user?.profileRef) { setLoading(false); return; }
    resultAPI.getByStudent(user.profileRef, filter)
      .then(r => setResults(r.data.data))
      .catch(err => toast.error(getError(err)))
      .finally(() => setLoading(false));
  }, [user, filter]);

  const years = [...new Set(results.map(r => r.academicYear))].sort().reverse();
  const examTypes = [...new Set(results.map(r => r.examType))];

  return (
    <div>
      <PageHeader title="My Results" subtitle="All examination results" />

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ padding: '14px 20px', display: 'flex', gap: 12 }}>
          <select className="form-control" style={{ width: 'auto' }} value={filter.examType} onChange={e => setFilter(f => ({ ...f, examType: e.target.value }))}>
            <option value="">All Exam Types</option>
            {['Monthly', 'Mid-Term', 'First-Yearly', 'Second-Yearly', 'Third-Yearly', 'Pre-Board', 'Final', 'Annual'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="form-control" style={{ width: 'auto' }} value={filter.academicYear} onChange={e => setFilter(f => ({ ...f, academicYear: e.target.value }))}>
            <option value="">All Years</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {(filter.examType || filter.academicYear) && (
            <button className="btn btn-ghost btn-sm" onClick={() => setFilter({ examType: '', academicYear: '' })}>Clear</button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><Spinner size={36} /></div>
      ) : results.length === 0 ? (
        <EmptyState icon="📝" title="No results yet" subtitle="Your exam results will appear here" />
      ) : (
        <div className="grid grid-2">
          {results.map(result => (
            <div
              key={result._id}
              className="card"
              onClick={() => setSelected(selected?._id === result._id ? null : result)}
              style={{ cursor: 'pointer', transition: 'all 0.15s', border: selected?._id === result._id ? '2px solid var(--primary)' : '1px solid var(--border)' }}
            >
              <div style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: 24 }}>{EXAM_ICONS[result.examType] || '📝'}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{result.examType} Exam</div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{result.academicYear} · {result.class?.name}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {result.position && <span className="badge badge-primary">#{result.position}</span>}
                    <GradeBadge grade={result.grade} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
                  {[
                    { label: 'Obtained', value: result.obtainedMarks },
                    { label: 'Total', value: result.totalMarks },
                    { label: 'Status', value: <StatusBadge status={result.status} /> },
                  ].map(s => (
                    <div key={s.label} style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>{s.value}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                <ProgressBar value={result.percentage} />

                {/* Expanded subject breakdown */}
                {selected?._id === result._id && result.subjects?.length > 0 && (
                  <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Subject Breakdown</div>
                    {result.subjects.map((sub, i) => {
                      const pct = Math.round((sub.obtainedMarks / sub.totalMarks) * 100);
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                          <div style={{ width: 120, fontSize: 12.5, fontWeight: 600, flexShrink: 0 }}>{sub.subject}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 100, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: pct >= 60 ? '#0e9f6e' : '#e02424', borderRadius: 100 }} />
                            </div>
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', minWidth: 60, textAlign: 'right' }}>
                            {sub.obtainedMarks}/{sub.totalMarks}
                          </div>
                        </div>
                      );
                    })}
                    {result.remarks && (
                      <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--info-light)', borderRadius: 6, fontSize: 12, color: '#0e7490' }}>
                        💬 {result.remarks}
                      </div>
                    )}
                  </div>
                )}

                <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-3)', textAlign: 'right' }}>
                  {selected?._id === result._id ? '▲ Click to collapse' : '▼ Click to expand'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
