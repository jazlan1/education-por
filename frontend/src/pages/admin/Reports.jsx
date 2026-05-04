import React, { useState } from 'react';
import { reportAPI, classAPI, getError } from '../../services/api';
import { PageHeader, Spinner } from '../../components/shared/UI';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [exporting, setExporting] = useState({});
  const [selectedClass, setSelectedClass] = useState('');
  const [examType, setExamType] = useState('Annual');
  const [academicYear, setAcademicYear] = useState(`${new Date().getFullYear()-1}-${String(new Date().getFullYear()).slice(-2)}`);

  const fetchClasses = async () => {
    if (classes.length) return;
    setLoadingClasses(true);
    try { const r = await classAPI.getAll(); setClasses(r.data.data); }
    catch {} finally { setLoadingClasses(false); }
  };

  const doExport = async (type) => {
    setExporting(e => ({ ...e, [type]: true }));
    try {
      let res;
      if (type === 'students') res = await reportAPI.exportStudents({});
      else if (type === 'teachers') res = await reportAPI.exportTeachers();
      else if (type === 'results') {
        if (!selectedClass) { toast.error('Select a class first'); return; }
        res = await reportAPI.exportResults(selectedClass, { academicYear, examType });
      }
      const filename = type === 'results' ? `results_${examType}.xlsx` : `${type}.xlsx`;
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      toast.success('Export downloaded');
    } catch (err) { toast.error(getError(err)); }
    finally { setExporting(e => ({ ...e, [type]: false })); }
  };

  const reportCards = [
    {
      title: 'Student Report',
      desc: 'Export all student data including personal info, class, and status.',
      icon: '🎓', color: '#1a56db', bg: '#ebf2ff',
      action: () => doExport('students'),
      loading: exporting.students,
      label: 'Export Students Excel',
    },
    {
      title: 'Teacher Report',
      desc: 'Export all teacher records including subjects, qualifications, and contact.',
      icon: '👨‍🏫', color: '#0e9f6e', bg: '#def7ec',
      action: () => doExport('teachers'),
      loading: exporting.teachers,
      label: 'Export Teachers Excel',
    },
  ];

  return (
    <div>
      <PageHeader title="Reports & Exports" subtitle="Generate and download data reports" />

      <div className="grid grid-3" style={{ marginBottom: 24 }}>
        {reportCards.map(c => (
          <div key={c.title} className="card">
            <div style={{ padding: 22 }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 14 }}>{c.icon}</div>
              <h3 style={{ fontWeight: 700, marginBottom: 6 }}>{c.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16, lineHeight: 1.5 }}>{c.desc}</p>
              <button className="btn btn-primary w-full" onClick={c.action} disabled={c.loading} style={{ justifyContent: 'center' }}>
                {c.loading ? <Spinner size={14} /> : '📥'} {c.label}
              </button>
            </div>
          </div>
        ))}

        {/* Results export card */}
        <div className="card">
          <div style={{ padding: 22 }}>
            <div style={{ width: 52, height: 52, borderRadius: 12, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 14 }}>📝</div>
            <h3 style={{ fontWeight: 700, marginBottom: 6 }}>Results Report</h3>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 14, lineHeight: 1.5 }}>Export class results with grades and positions.</p>
            <div className="form-group">
              <select className="form-control" value={selectedClass} onChange={e => setSelectedClass(e.target.value)} onClick={fetchClasses}>
                <option value="">Select Class</option>
                {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div className="grid grid-2" style={{ gap: 8, marginBottom: 14 }}>
              <select className="form-control" value={examType} onChange={e => setExamType(e.target.value)}>
                <option value="Monthly">Monthly</option>
                <option value="Mid-Term">Mid-Term</option>
                <option value="First-Yearly">First-Yearly</option>
                <option value="Second-Yearly">Second-Yearly</option>
                <option value="Third-Yearly">Third-Yearly</option>
                <option value="Pre-Board">Pre-Board</option>
                <option value="Final">Final</option>
                <option value="Annual">Annual</option>
              </select>
              <input className="form-control" value={academicYear} onChange={e => setAcademicYear(e.target.value)} placeholder="2024-25" />
            </div>
            <button className="btn btn-primary w-full" onClick={() => doExport('results')} disabled={exporting.results} style={{ justifyContent: 'center' }}>
              {exporting.results ? <Spinner size={14} /> : '📥'} Export Results Excel
            </button>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="card">
        <div className="card-header"><span className="card-title">📋 Report Guide</span></div>
        <div className="card-body">
          <div className="grid grid-2">
            <div>
              <h4 style={{ fontWeight: 700, marginBottom: 8 }}>📄 PDF Reports</h4>
              <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
                Individual PDF reports for each student can be generated from the Student Detail page. These include personal info, academic results, and attendance summary.
              </p>
            </div>
            <div>
              <h4 style={{ fontWeight: 700, marginBottom: 8 }}>📊 Excel Exports</h4>
              <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
                Bulk Excel exports are available for students, teachers, and results. Filter by class, status, or exam type before exporting.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
