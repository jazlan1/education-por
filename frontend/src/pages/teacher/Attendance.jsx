import React, { useState, useEffect } from 'react';
import { classAPI, attendanceAPI, getError } from '../../services/api';
import { PageHeader, Spinner, Avatar } from '../../components/shared/UI';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['Present', 'Absent', 'Late', 'Excused'];
const STATUS_COLORS = { Present: '#0e9f6e', Absent: '#e02424', Late: '#d97706', Excused: '#0891b2' };
const STATUS_BG = { Present: '#def7ec', Absent: '#fde8e8', Late: '#fef3c7', Excused: '#e0f2fe' };

export default function AttendancePage() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [records, setRecords] = useState({});
  const [alreadyMarked, setAlreadyMarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    classAPI.getAll().then(r => setClasses(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    setLoadingStudents(true);
    Promise.all([
      classAPI.getStudents(selectedClass, { status: 'Active' }),
      attendanceAPI.getByClass(selectedClass, { date }),
    ]).then(([studRes, attRes]) => {
      const studentList = (studRes.data.data || []).filter(student => student._id);
      setStudents(studentList);

      const todayAtt = attRes.data.data?.find(a => a.date?.slice(0, 10) === date);
      if (todayAtt) {
        setAlreadyMarked(true);
        const recs = {};
        todayAtt.records?.forEach(r => { recs[r.student?._id || r.student] = { status: r.status, remarks: r.remarks || '' }; });
        studentList.forEach(student => {
          if (!recs[student._id]) {
            recs[student._id] = { status: 'Present', remarks: '' };
          }
        });
        setRecords(recs);
      } else {
        setAlreadyMarked(false);
        const init = {};
        studentList.forEach(s => { init[s._id] = { status: 'Present', remarks: '' }; });
        setRecords(init);
      }
    }).catch(err => toast.error(getError(err)))
    .finally(() => setLoadingStudents(false));
  }, [selectedClass, date]);

  const setStatus = (studentId, status) => setRecords(r => ({ ...r, [studentId]: { ...r[studentId], status } }));
  const setRemarks = (studentId, remarks) => setRecords(r => ({ ...r, [studentId]: { ...r[studentId], remarks } }));
  const markAll = (status) => {
    const updated = {};
    students.forEach(s => { updated[s._id] = { status, remarks: '' }; });
    setRecords(updated);
  };

  const handleSave = async () => {
    if (!selectedClass) { toast.error('Select a class'); return; }
    setSaving(true);
    try {
      const latestStudentsRes = await classAPI.getStudents(selectedClass, { status: 'Active' });
      const latestStudents = (latestStudentsRes.data.data || []).filter(student => student._id);
      const mergedRecords = {};

      if (!latestStudents.length) {
        toast.error('No active students found in this class');
        return;
      }

      latestStudents.forEach(student => {
        mergedRecords[student._id] = records[student._id] || { status: 'Present', remarks: '' };
      });

      const recordsArray = latestStudents.map(student => ({
        student: student._id,
        status: mergedRecords[student._id]?.status || 'Present',
        remarks: mergedRecords[student._id]?.remarks || '',
      }));

      await attendanceAPI.mark({ classId: selectedClass, date, records: recordsArray });
      setStudents(latestStudents);
      setRecords(mergedRecords);
      setAlreadyMarked(true);
      toast.success('Attendance saved successfully');
    } catch (err) { toast.error(getError(err)); }
    finally { setSaving(false); }
  };

  const stats = {
    total: students.length,
    present: students.filter(s => records[s._id]?.status === 'Present').length,
    absent: students.filter(s => records[s._id]?.status === 'Absent').length,
    late: students.filter(s => records[s._id]?.status === 'Late').length,
  };

  return (
    <div>
      <PageHeader title="Mark Attendance" subtitle="Record daily student attendance for your classes" />

      {/* Controls */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ padding: '16px 20px', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 200 }}>
            <select className="form-control" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
              <option value="">Select Class</option>
              {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <input type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} max={new Date().toISOString().slice(0, 10)} />
          </div>
          {alreadyMarked && <span className="badge badge-warning">⚠️ Already marked — editing</span>}
        </div>
      </div>

      {selectedClass && (
        <>
          {/* Summary */}
          {students.length > 0 && (
            <div className="grid grid-4" style={{ marginBottom: 16 }}>
              {[
                { label: 'Total', value: stats.total, color: '#1a56db' },
                { label: 'Present', value: stats.present, color: '#0e9f6e' },
                { label: 'Absent', value: stats.absent, color: '#e02424' },
                { label: 'Late', value: stats.late, color: '#d97706' },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <span className="card-title">🎓 Student Attendance</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-2)', alignSelf: 'center' }}>Mark all:</span>
                {STATUS_OPTIONS.map(s => (
                  <button key={s} className="btn btn-sm" onClick={() => markAll(s)}
                    style={{ background: STATUS_BG[s], color: STATUS_COLORS[s], border: 'none', padding: '4px 10px' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {loadingStudents ? (
              <div style={{ textAlign: 'center', padding: 40 }}><Spinner size={28} /></div>
            ) : students.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>No students in this class</div>
            ) : (
              <div>
                {students.map((student, idx) => (
                  <div key={student._id} style={{
                    display: 'flex', alignItems: 'center', gap: 16, padding: '12px 20px',
                    borderBottom: idx < students.length - 1 ? '1px solid var(--border)' : 'none',
                    background: idx % 2 === 0 ? 'transparent' : 'var(--bg)',
                  }}>
                    <div style={{ width: 28, textAlign: 'center', fontSize: 13, color: 'var(--text-3)', fontWeight: 600 }}>{idx + 1}</div>
                    <Avatar src={student.profilePhoto} name={student.fullName} size="sm" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{student.fullName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{student.rollNumber}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {STATUS_OPTIONS.map(status => (
                        <button
                          key={status}
                          onClick={() => setStatus(student._id, status)}
                          style={{
                            padding: '5px 12px', borderRadius: 6, border: `1.5px solid ${records[student._id]?.status === status ? STATUS_COLORS[status] : 'var(--border)'}`,
                            background: records[student._id]?.status === status ? STATUS_BG[status] : 'var(--surface)',
                            color: records[student._id]?.status === status ? STATUS_COLORS[status] : 'var(--text-2)',
                            fontWeight: 600, fontSize: 12, cursor: 'pointer', transition: 'all 0.15s',
                            fontFamily: 'inherit',
                          }}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Remarks"
                      value={records[student._id]?.remarks || ''}
                      onChange={e => setRemarks(student._id, e.target.value)}
                      style={{ width: 140, padding: '5px 10px', border: '1.5px solid var(--border)', borderRadius: 6, fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
                    />
                  </div>
                ))}
              </div>
            )}

            {students.length > 0 && (
              <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? <><Spinner size={14} /> Saving…</> : '💾 Save Attendance'}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {!selectedClass && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-3)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
          <p style={{ fontSize: 15, fontWeight: 500 }}>Select a class to mark attendance</p>
        </div>
      )}
    </div>
  );
}
