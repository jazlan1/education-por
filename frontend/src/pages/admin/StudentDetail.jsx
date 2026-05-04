import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentAPI, reportAPI, feeAPI, getError } from '../../services/api';
import { PageHeader, Spinner, Avatar, StatusBadge, GradeBadge, ProgressBar } from '../../components/shared/UI';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('profile');
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [feeData, setFeeData] = useState([]);
  const [feeSummary, setFeeSummary] = useState(null);
  const [feeLoading, setFeeLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      studentAPI.getOne(id),
      feeAPI.getByStudent(id),
    ])
      .then(([studentRes, feeRes]) => {
        setData(studentRes.data.data);
        setFeeData(feeRes.data.data);
        setFeeSummary(feeRes.data.summary);
      })
      .catch(err => toast.error(getError(err)))
      .finally(() => setLoading(false));
  }, [id]);

  const generatePDF = async () => {
    setGeneratingPDF(true);
    try {
      const reportRes = await reportAPI.getStudentReport(id);
      const report = reportRes.data.data;
      const doc = new jsPDF();

      // Header
      doc.setFontSize(20); doc.setFont('helvetica', 'bold');
      doc.text('EduManage School Management System', 105, 20, { align: 'center' });
      doc.setFontSize(14); doc.setFont('helvetica', 'normal');
      doc.text('Student Report Card', 105, 30, { align: 'center' });
      doc.setDrawColor(26, 86, 219); doc.setLineWidth(0.5);
      doc.line(15, 35, 195, 35);

      // Student info
      doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text('Student Information', 15, 45);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
      const s = report.student;
      const info = [
        ['Name:', s.fullName, 'Roll No:', s.rollNumber],
        ["Father's Name:", s.fatherName, 'Class:', s.admission?.currentClass?.name || 'N/A'],
        ['Date of Birth:', s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString() : '', 'Gender:', s.gender],
        ['Phone:', s.phoneNumber, 'Status:', s.status],
      ];
      info.forEach((row, i) => {
        doc.setFont('helvetica', 'bold'); doc.text(row[0], 15, 55 + i * 7);
        doc.setFont('helvetica', 'normal'); doc.text(row[1] || '', 55, 55 + i * 7);
        doc.setFont('helvetica', 'bold'); doc.text(row[2], 110, 55 + i * 7);
        doc.setFont('helvetica', 'normal'); doc.text(row[3] || '', 150, 55 + i * 7);
      });

      // Attendance summary
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
      doc.text('Annual Attendance Summary', 15, 90);
      const att = report.attendance.annual;
      autoTable(doc, {
        startY: 95,
        head: [['Total Days', 'Present', 'Absent', 'Percentage']],
        body: [[att.total, att.present, att.absent, `${att.percentage}%`]],
        theme: 'grid',
        headStyles: { fillColor: [26, 86, 219] },
        styles: { fontSize: 9 },
      });

      // Results
      if (report.results?.length) {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
        doc.text('Examination Results', 15, doc.lastAutoTable.finalY + 12);
        const resultData = report.results.map(r => [
          r.academicYear, r.examType, r.class?.name || 'N/A',
          r.obtainedMarks, r.totalMarks, `${r.percentage}%`,
          r.grade, r.position ? `#${r.position}` : '—', r.status,
        ]);
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 17,
          head: [['Year', 'Exam', 'Class', 'Obtained', 'Total', '%', 'Grade', 'Position', 'Status']],
          body: resultData,
          theme: 'striped',
          headStyles: { fillColor: [26, 86, 219] },
          styles: { fontSize: 8 },
        });
      }

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8); doc.setTextColor(150);
        doc.text(`Generated on ${new Date().toLocaleString()} | Page ${i} of ${pageCount}`, 105, doc.internal.pageSize.height - 10, { align: 'center' });
      }

      doc.save(`${s.fullName}_${s.rollNumber}_Report.pdf`);
      toast.success('PDF downloaded');
    } catch (err) { toast.error(getError(err)); }
    finally { setGeneratingPDF(false); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={36} /></div>;
  if (!data) return null;

  const UPLOAD_URL = process.env.REACT_APP_UPLOAD_URL || 'http://localhost:5000';
  const attSummary = data.attendanceSummary;

  return (
    <div>
      <PageHeader
        title="Student Profile"
        actions={<>
          <button className="btn btn-secondary" onClick={() => navigate('/admin/students')}>← Back</button>
          <button className="btn btn-secondary" onClick={generatePDF} disabled={generatingPDF}>
            {generatingPDF ? <Spinner size={14} /> : '📄'} Download PDF
          </button>
          <button className="btn btn-primary" onClick={() => navigate(`/admin/students/${id}/edit`)}>✏️ Edit</button>
        </>}
      />

      {/* Profile header */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ padding: 24, display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <Avatar src={data.profilePhoto} name={data.fullName} size="xl" />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800 }}>{data.fullName}</h2>
              <StatusBadge status={data.status} />
            </div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', color: 'var(--text-2)', fontSize: 13 }}>
              <span>🎓 {data.admission?.currentClass?.name || 'No class assigned'}</span>
              <span>📋 Roll: <strong className="font-mono">{data.rollNumber}</strong></span>
              <span>👤 {data.fatherName}</span>
              <span>📱 {data.phoneNumber}</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 80px)', gap: 12, textAlign: 'center' }}>
            {[
          { label: 'Attendance', value: `${attSummary?.percentage || 0}%`, color: '#0e9f6e' },
              { label: 'Results', value: data.results?.length || 0, color: '#1a56db' },
              { label: 'Fee Due', value: `₨${feeSummary?.totalDue?.toLocaleString() || 0}`, color: feeSummary?.totalDue > 0 ? '#e02424' : '#0e9f6e' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '10px 6px' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, background: 'var(--surface-2)', padding: 4, borderRadius: 10, width: 'fit-content' }}>
        {['profile', 'results', 'attendance', 'fees'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 20px', borderRadius: 8, border: 'none', fontFamily: 'inherit',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
              background: tab === t ? 'var(--surface)' : 'transparent',
              color: tab === t ? 'var(--primary)' : 'var(--text-2)',
              boxShadow: tab === t ? 'var(--shadow)' : 'none',
              textTransform: 'capitalize',
            }}
          >
            {t === 'profile' ? '👤' : t === 'results' ? '📝' : t === 'attendance' ? '📅' : '💰'} {t}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === 'profile' && (
        <div className="grid grid-2">
          <div className="card">
            <div className="card-header"><span className="card-title">Personal Information</span></div>
            <div className="card-body">
              {[
                ['Full Name', data.fullName],
                ["Father's Name", data.fatherName],
                ["Father's CNIC", data.fatherCNIC],
                ['Date of Birth', data.dateOfBirth ? new Date(data.dateOfBirth).toLocaleDateString('en-PK') : '—'],
                ['Gender', data.gender],
                ['Phone', data.phoneNumber],
                ['Address', data.address],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', padding: '9px 0', borderBottom: '1px solid var(--border)', gap: 12 }}>
                  <div style={{ width: 130, color: 'var(--text-2)', fontSize: 12.5, fontWeight: 600, flexShrink: 0 }}>{k}</div>
                  <div style={{ fontSize: 13, color: 'var(--text)' }}>{v || '—'}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">Admission Details</span></div>
            <div className="card-body">
              {[
                ['Admission Year', data.admission?.admissionYear],
                ['Admission Class', data.admission?.admissionClass],
                ['Current Class', data.admission?.currentClass?.name],
                ['Left Year', data.admission?.leftYear],
                ['Left Class', data.admission?.leftClass],
                ['Status', data.status],
                ['Email', data.user?.email],
                ['Last Login', data.user?.lastLogin ? new Date(data.user.lastLogin).toLocaleString() : 'Never'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', padding: '9px 0', borderBottom: '1px solid var(--border)', gap: 12 }}>
                  <div style={{ width: 130, color: 'var(--text-2)', fontSize: 12.5, fontWeight: 600, flexShrink: 0 }}>{k}</div>
                  <div style={{ fontSize: 13, color: 'var(--text)' }}>{v || '—'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results Tab */}
      {tab === 'results' && (
        <div className="card">
          <div className="card-header"><span className="card-title">📝 Academic Results</span></div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Year</th><th>Exam</th><th>Class</th><th>Marks</th><th>%</th><th>Grade</th><th>Position</th><th>Status</th></tr>
              </thead>
              <tbody>
                {data.results?.length ? data.results.map(r => (
                  <tr key={r._id}>
                    <td>{r.academicYear}</td>
                    <td><span className="badge badge-info">{r.examType}</span></td>
                    <td>{r.class?.name || '—'}</td>
                    <td className="font-mono">{r.obtainedMarks}/{r.totalMarks}</td>
                    <td><ProgressBar value={r.percentage} /></td>
                    <td><GradeBadge grade={r.grade} /></td>
                    <td>{r.position ? <span className="badge badge-primary">#{r.position}</span> : '—'}</td>
                    <td><StatusBadge status={r.status} /></td>
                  </tr>
                )) : (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 30, color: 'var(--text-3)' }}>No results recorded</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attendance Tab */}
      {tab === 'attendance' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">📅 Attendance Overview ({new Date().getFullYear()})</span>
            <span className="badge badge-success">{attSummary?.percentage || 0}% Annual</span>
          </div>
          <div className="card-body">
            <div className="grid grid-4" style={{ marginBottom: 20 }}>
              {[
                { label: 'Total Days', value: attSummary?.total || 0, color: '#1a56db' },
                { label: 'Present', value: attSummary?.present || 0, color: '#0e9f6e' },
                { label: 'Absent', value: attSummary?.absent || 0, color: '#e02424' },
                { label: 'Percentage', value: `${attSummary?.percentage || 0}%`, color: '#d97706' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center', background: 'var(--surface-2)', padding: 16, borderRadius: 10 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <p style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', marginTop: 8 }}>
              View detailed monthly breakdown in the Attendance section
            </p>
          </div>
        </div>
      )}

      {/* Fees Tab */}
      {tab === 'fees' && (
        <div>
          {feeSummary && (
            <div className="grid grid-4" style={{ marginBottom: 20 }}>
              {[
                { label: 'Total Fee', value: `₨ ${feeSummary.totalAmount?.toLocaleString() || 0}`, color: '#1a56db', bg: '#ebf2ff' },
                { label: 'Total Paid', value: `₨ ${feeSummary.totalPaid?.toLocaleString() || 0}`, color: '#0e9f6e', bg: '#def7ec' },
                { label: 'Total Fine', value: `₨ ${feeSummary.totalFine?.toLocaleString() || 0}`, color: '#e02424', bg: '#fde8e8' },
                { label: 'Total Due', value: `₨ ${feeSummary.totalDue?.toLocaleString() || 0}`, color: feeSummary.totalDue > 0 ? '#e02424' : '#0e9f6e', bg: feeSummary.totalDue > 0 ? '#fde8e8' : '#def7ec' },
              ].map(s => (
                <div key={s.label} className="card" style={{ background: s.bg }}>
                  <div style={{ padding: 18, textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4, fontWeight: 600 }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="card">
            <div className="card-header">
              <span className="card-title">💰 Fee Records</span>
              <span className="badge badge-info">{feeData.length} record(s)</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Month</th><th>Type</th><th>Amount</th><th>Paid</th><th>Fine</th><th>Due</th><th>Status</th><th>Remarks</th></tr>
                </thead>
                <tbody>
                  {feeData.length ? feeData.map(f => (
                    <tr key={f._id}>
                      <td style={{ fontWeight: 600 }}>{MONTHS[f.month - 1]} <span style={{ fontSize: 11, color: 'var(--text-3)' }}>({f.academicYear})</span></td>
                      <td><span className="badge badge-gray">{f.feeType}</span></td>
                      <td>₨ {f.amount?.toLocaleString()}</td>
                      <td style={{ color: '#0e9f6e' }}>₨ {f.paidAmount?.toLocaleString()}</td>
                      <td style={{ color: f.fineAmount > 0 ? '#e02424' : 'var(--text-2)' }}>₨ {f.fineAmount?.toLocaleString()}</td>
                      <td style={{ color: f.dueAmount > 0 ? '#e02424' : '#0e9f6e', fontWeight: f.dueAmount > 0 ? 700 : 400 }}>₨ {f.dueAmount?.toLocaleString()}</td>
                      <td>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                          background: (f.status === 'Paid' ? '#0e9f6e' : f.status === 'Partial' ? '#d97706' : f.status === 'Unpaid' ? '#e02424' : '#7e3af2') + '22',
                          color: f.status === 'Paid' ? '#0e9f6e' : f.status === 'Partial' ? '#d97706' : f.status === 'Unpaid' ? '#e02424' : '#7e3af2',
                        }}>
                          {f.status}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-2)' }}>{f.remarks || '—'}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: 30, color: 'var(--text-3)' }}>No fee records</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
