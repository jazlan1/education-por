import React, { useState, useEffect } from 'react';
import { classAPI, resultAPI, getError } from '../../services/api';
import { PageHeader, Modal, Spinner, GradeBadge, StatusBadge } from '../../components/shared/UI';
import toast from 'react-hot-toast';

const EXAM_TYPES = ['Monthly', 'Mid-Term', 'First-Yearly', 'Second-Yearly', 'Third-Yearly', 'Pre-Board', 'Final', 'Annual'];
const CY = new Date().getFullYear();
const DEFAULT_YEAR = `${CY-1}-${String(CY).slice(-2)}`;

export default function ResultsPage() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [examType, setExamType] = useState('Annual');
  const [academicYear, setAcademicYear] = useState(DEFAULT_YEAR);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [editingResult, setEditingResult] = useState(null);
  const [resultForm, setResultForm] = useState({ subjects: [], remarks: '' });
  const [saving, setSaving] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');

  useEffect(() => {
    classAPI.getAll().then(r => setClasses(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    setLoading(true);
    Promise.all([
      classAPI.getStudents(selectedClass),
      resultAPI.getByClass(selectedClass, { academicYear, examType }),
    ]).then(([sRes, rRes]) => {
      setStudents(sRes.data.data);
      setResults(rRes.data.data);
    }).catch(err => toast.error(getError(err)))
    .finally(() => setLoading(false));
  }, [selectedClass, examType, academicYear]);

  const openAddResult = (student) => {
    const existing = results.find(r => r.student?._id === student._id);
    if (existing) {
      setEditingResult(existing);
      setResultForm({ subjects: existing.subjects || [], remarks: existing.remarks || '' });
    } else {
      setEditingResult(null);
      setResultForm({ subjects: [{ subject: '', totalMarks: 100, obtainedMarks: 0 }], remarks: '' });
    }
    setSelectedStudent(student);
    setModal(true);
  };

  const addSubject = () => setResultForm(f => ({ ...f, subjects: [...f.subjects, { subject: '', totalMarks: 100, obtainedMarks: 0 }] }));
  const removeSubject = (i) => setResultForm(f => ({ ...f, subjects: f.subjects.filter((_, idx) => idx !== i) }));
  const updateSubject = (i, field, value) => setResultForm(f => {
    const subs = [...f.subjects];
    subs[i] = { ...subs[i], [field]: field === 'subject' ? value : Number(value) };
    return { ...f, subjects: subs };
  });

  const handleSave = async () => {
    if (!resultForm.subjects.length) { toast.error('Add at least one subject'); return; }
    for (const s of resultForm.subjects) {
      if (!s.subject.trim()) { toast.error('Subject name required'); return; }
      if (s.obtainedMarks > s.totalMarks) { toast.error(`${s.subject}: obtained marks exceed total`); return; }
    }
    setSaving(true);
    try {
      const payload = { student: selectedStudent._id, class: selectedClass, academicYear, examType, subjects: resultForm.subjects, remarks: resultForm.remarks };
      if (editingResult) { await resultAPI.update(editingResult._id, payload); toast.success('Result updated'); }
      else { await resultAPI.create(payload); toast.success('Result added'); }
      setModal(false);
      const rRes = await resultAPI.getByClass(selectedClass, { academicYear, examType });
      setResults(rRes.data.data);
    } catch (err) { toast.error(getError(err)); }
    finally { setSaving(false); }
  };

  const getStudentResult = (studentId) => results.find(r => r.student?._id === studentId || r.student === studentId);

  return (
    <div>
      <PageHeader title="Manage Results" subtitle="Add and update student exam results" />

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ padding: '16px 20px', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <select className="form-control" style={{ flex: 1, minWidth: 180 }} value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
            <option value="">Select Class</option>
            {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select className="form-control" style={{ width: 'auto' }} value={examType} onChange={e => setExamType(e.target.value)}>
            {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input className="form-control" style={{ width: 110 }} value={academicYear} onChange={e => setAcademicYear(e.target.value)} placeholder="2024-25" />
        </div>
      </div>

      {selectedClass && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Results — {examType} · {academicYear}</span>
            <span className="badge badge-info">{results.length}/{students.length} entered</span>
          </div>
          {loading ? <div style={{ textAlign: 'center', padding: 40 }}><Spinner size={28} /></div> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>#</th><th>Student</th><th>Roll No</th><th>Marks</th><th>%</th><th>Grade</th><th>Position</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {students.map((s, i) => {
                    const result = getStudentResult(s._id);
                    return (
                      <tr key={s._id}>
                        <td style={{ color: 'var(--text-3)', fontWeight: 600 }}>{i + 1}</td>
                        <td style={{ fontWeight: 600 }}>{s.fullName}</td>
                        <td className="font-mono" style={{ fontSize: 12 }}>{s.rollNumber}</td>
                        <td>{result ? `${result.obtainedMarks}/${result.totalMarks}` : '—'}</td>
                        <td>{result ? `${result.percentage}%` : '—'}</td>
                        <td>{result ? <GradeBadge grade={result.grade} /> : '—'}</td>
                        <td>{result?.position ? <span className="badge badge-primary">#{result.position}</span> : '—'}</td>
                        <td>{result ? <StatusBadge status={result.status} /> : <span className="badge badge-gray">Pending</span>}</td>
                        <td>
                          <button className="btn btn-secondary btn-sm" onClick={() => openAddResult(s)}>
                            {result ? 'Edit' : 'Add'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!selectedClass && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-3)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
          <p style={{ fontSize: 15, fontWeight: 500 }}>Select a class to manage results</p>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={`${editingResult ? 'Edit' : 'Add'} Result — ${selectedStudent?.fullName}`} size="lg"
        footer={<><button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? <Spinner size={14} /> : '💾 Save Result'}</button></>}
      >
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700 }}>Subjects</h4>
            <button className="btn btn-secondary btn-sm" onClick={addSubject}>+ Add Subject</button>
          </div>
          {resultForm.subjects.map((sub, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
              <input className="form-control" placeholder="Subject name" value={sub.subject} onChange={e => updateSubject(i, 'subject', e.target.value)} />
              <input type="number" className="form-control" placeholder="Total" value={sub.totalMarks} onChange={e => updateSubject(i, 'totalMarks', e.target.value)} min="0" />
              <input type="number" className="form-control" placeholder="Obtained" value={sub.obtainedMarks} onChange={e => updateSubject(i, 'obtainedMarks', e.target.value)} min="0" max={sub.totalMarks} />
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', padding: '6px 10px' }} onClick={() => removeSubject(i)}>×</button>
            </div>
          ))}
          <div className="form-group" style={{ marginTop: 12 }}>
            <label className="form-label">Remarks</label>
            <textarea className="form-control" rows={2} value={resultForm.remarks} onChange={e => setResultForm(f => ({ ...f, remarks: e.target.value }))} placeholder="Optional remarks" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
