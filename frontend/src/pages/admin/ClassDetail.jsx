import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { classAPI, getError } from '../../services/api';
import { PageHeader, Avatar, Spinner } from '../../components/shared/UI';
import toast from 'react-hot-toast';

export default function ClassDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cls, setCls] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    classAPI.getOne(id)
      .then(r => setCls(r.data.data))
      .catch(err => toast.error(getError(err)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={36} /></div>;
  if (!cls) return null;

  return (
    <div>
      <PageHeader
        title={cls.name}
        subtitle={`Grade ${cls.grade} · Section ${cls.section} · ${cls.academicYear}`}
        actions={<button className="btn btn-secondary" onClick={() => navigate('/admin/classes')}>← Back</button>}
      />
      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Class Info</span></div>
          <div className="card-body">
            {[['Grade', cls.grade], ['Section', cls.section], ['Academic Year', cls.academicYear], ['Max Students', cls.maxStudents], ['Class Teacher', cls.classTeacher?.fullName || '—']].map(([k,v]) => (
              <div key={k} style={{ display: 'flex', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 140, color: 'var(--text-2)', fontWeight: 600, fontSize: 12.5 }}>{k}</div>
                <div style={{ fontSize: 13 }}>{v || '—'}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Quick Stats</span></div>
          <div className="card-body">
            <div className="grid grid-2">
              {[
                { label: 'Enrolled', value: cls.students?.length || 0, color: '#1a56db' },
                { label: 'Capacity', value: cls.maxStudents, color: '#d97706' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center', background: 'var(--surface-2)', padding: 20, borderRadius: 10 }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">🎓 Enrolled Students ({cls.students?.length || 0})</span></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Student</th><th>Roll No</th><th>Gender</th></tr></thead>
            <tbody>
              {cls.students?.length > 0 ? cls.students.map(s => (
                <tr key={s._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/students/${s._id}`)}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar src={s.profilePhoto} name={s.fullName} size="sm" />
                      <span style={{ fontWeight: 600 }}>{s.fullName}</span>
                    </div>
                  </td>
                  <td className="font-mono" style={{ fontSize: 12 }}>{s.rollNumber}</td>
                  <td>{s.gender}</td>
                </tr>
              )) : (
                <tr><td colSpan={3} style={{ textAlign: 'center', padding: 30, color: 'var(--text-3)' }}>No students enrolled</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
