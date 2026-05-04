import React, { useState, useEffect } from 'react';
import { classAPI, feeAPI, getError } from '../../services/api';
import { PageHeader, Modal, Spinner, EmptyState } from '../../components/shared/UI';
import toast from 'react-hot-toast';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FEE_TYPES = ['Tuition', 'Admission', 'Exam', 'Transport', 'Fine', 'Other'];
const STATUS_COLORS = { Paid: '#0e9f6e', Partial: '#d97706', Unpaid: '#e02424', Overdue: '#7e3af2' };
const CY = new Date().getFullYear();
const DEFAULT_YEAR = `${CY-1}-${String(CY).slice(-2)}`;

export default function FeesPage() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [editingFee, setEditingFee] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [feeForm, setFeeForm] = useState({ month: 1, feeType: 'Tuition', amount: 5000, paidAmount: 0, fineAmount: 0, remarks: '' });
  const [saving, setSaving] = useState(false);
  const [academicYear, setAcademicYear] = useState(DEFAULT_YEAR);

  useEffect(() => {
    classAPI.getAll().then(r => setClasses(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    setLoading(true);
    Promise.all([
      classAPI.getStudents(selectedClass),
      feeAPI.getByClass(selectedClass, { academicYear }),
    ]).then(([sRes, fRes]) => {
      setStudents(sRes.data.data);
      setFees(fRes.data.data);
    }).catch(err => toast.error(getError(err)))
    .finally(() => setLoading(false));
  }, [selectedClass, academicYear]);

  const openAddFee = (student) => {
    const existing = fees.find(f => f.student?._id === student._id || f.student === student._id);
    if (existing) {
      setEditingFee(existing);
      setFeeForm({
        month: existing.month,
        feeType: existing.feeType,
        amount: existing.amount,
        paidAmount: existing.paidAmount,
        fineAmount: existing.fineAmount,
        remarks: existing.remarks || ''
      });
    } else {
      setEditingFee(null);
      setFeeForm({ month: new Date().getMonth() + 1, feeType: 'Tuition', amount: 5000, paidAmount: 0, fineAmount: 0, remarks: '' });
    }
    setSelectedStudent(student);
    setModal(true);
  };

  const handleSave = async () => {
    if (!feeForm.amount || feeForm.amount < 0) { toast.error('Valid amount required'); return; }
    if (feeForm.paidAmount < 0) { toast.error('Paid amount cannot be negative'); return; }
    if (feeForm.fineAmount < 0) { toast.error('Fine amount cannot be negative'); return; }

    setSaving(true);
    try {
      const payload = {
        student: selectedStudent._id,
        class: selectedClass,
        academicYear,
        month: parseInt(feeForm.month),
        feeType: feeForm.feeType,
        amount: parseFloat(feeForm.amount),
        paidAmount: parseFloat(feeForm.paidAmount),
        fineAmount: parseFloat(feeForm.fineAmount),
        remarks: feeForm.remarks,
      };
      if (editingFee) {
        await feeAPI.update(editingFee._id, payload);
        toast.success('Fee record updated');
      } else {
        await feeAPI.create(payload);
        toast.success('Fee record added');
      }
      setModal(false);
      const fRes = await feeAPI.getByClass(selectedClass, { academicYear });
      setFees(fRes.data.data);
    } catch (err) { toast.error(getError(err)); }
    finally { setSaving(false); }
  };

  const handleDelete = async (feeId) => {
    if (!window.confirm('Delete this fee record?')) return;
    try {
      await feeAPI.delete(feeId);
      toast.success('Fee record deleted');
      const fRes = await feeAPI.getByClass(selectedClass, { academicYear });
      setFees(fRes.data.data);
    } catch (err) { toast.error(getError(err)); }
  };

  const getStudentFees = (studentId) => fees.filter(f => f.student?._id === studentId || f.student === studentId);

  const getStudentFeeSummary = (studentId) => {
    const studentFees = getStudentFees(studentId);
    const total = studentFees.reduce((s, f) => s + f.amount, 0);
    const paid = studentFees.reduce((s, f) => s + f.paidAmount, 0);
    const fine = studentFees.reduce((s, f) => s + f.fineAmount, 0);
    const due = studentFees.reduce((s, f) => s + f.dueAmount, 0);
    return { total, paid, fine, due, count: studentFees.length };
  };

  return (
    <div>
      <PageHeader title="Manage Fees" subtitle="Track student fees, dues, and fines" />

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ padding: '16px 20px', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <select className="form-control" style={{ flex: 1, minWidth: 180 }} value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
            <option value="">Select Class</option>
            {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <input className="form-control" style={{ width: 110 }} value={academicYear} onChange={e => setAcademicYear(e.target.value)} placeholder="2024-25" />
        </div>
      </div>

      {selectedClass && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Fee Records — {academicYear}</span>
            <span className="badge badge-info">{fees.length} records</span>
          </div>
          {loading ? <div style={{ textAlign: 'center', padding: 40 }}><Spinner size={28} /></div> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Student</th>
                    <th>Roll No</th>
                    <th>Total Fee</th>
                    <th>Paid</th>
                    <th>Fine</th>
                    <th>Due</th>
                    <th>Status</th>
                    <th>Records</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => {
                    const summary = getStudentFeeSummary(s._id);
                    const studentFees = getStudentFees(s._id);
                    const latestStatus = studentFees.length > 0
                      ? studentFees.sort((a, b) => b.month - a.month)[0].status
                      : 'No Record';
                    return (
                      <tr key={s._id}>
                        <td style={{ color: 'var(--text-3)', fontWeight: 600 }}>{i + 1}</td>
                        <td style={{ fontWeight: 600 }}>{s.fullName}</td>
                        <td className="font-mono" style={{ fontSize: 12 }}>{s.rollNumber}</td>
                        <td>₨ {summary.total.toLocaleString()}</td>
                        <td style={{ color: '#0e9f6e' }}>₨ {summary.paid.toLocaleString()}</td>
                        <td style={{ color: '#e02424' }}>₨ {summary.fine.toLocaleString()}</td>
                        <td style={{ color: summary.due > 0 ? '#e02424' : 'var(--text-2)', fontWeight: summary.due > 0 ? 700 : 400 }}>
                          ₨ {summary.due.toLocaleString()}
                        </td>
                        <td>
                          {latestStatus !== 'No Record' ? (
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: STATUS_COLORS[latestStatus] + '22', color: STATUS_COLORS[latestStatus] }}>
                              {latestStatus}
                            </span>
                          ) : (
                            <span className="badge badge-gray">No Record</span>
                          )}
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{summary.count} record(s)</td>
                        <td>
                          <button className="btn btn-secondary btn-sm" onClick={() => openAddFee(s)}>
                            {summary.count > 0 ? 'Manage' : 'Add'}
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
          <div style={{ fontSize: 48, marginBottom: 12 }}>💰</div>
          <p style={{ fontSize: 15, fontWeight: 500 }}>Select a class to manage fees</p>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={`${editingFee ? 'Edit' : 'Add'} Fee — ${selectedStudent?.fullName}`} size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            {editingFee && (
              <button className="btn btn-danger" onClick={() => handleDelete(editingFee._id)} style={{ marginRight: 8 }}>🗑 Delete</button>
            )}
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? <Spinner size={14} /> : '💾 Save Fee'}</button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Month</label>
            <select className="form-control" value={feeForm.month} onChange={e => setFeeForm(f => ({ ...f, month: e.target.value }))}>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Fee Type</label>
            <select className="form-control" value={feeForm.feeType} onChange={e => setFeeForm(f => ({ ...f, feeType: e.target.value }))}>
              {FEE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Total Amount (₨)</label>
            <input type="number" className="form-control" value={feeForm.amount} onChange={e => setFeeForm(f => ({ ...f, amount: e.target.value }))} min="0" />
          </div>
          <div className="form-group">
            <label className="form-label">Paid Amount (₨)</label>
            <input type="number" className="form-control" value={feeForm.paidAmount} onChange={e => setFeeForm(f => ({ ...f, paidAmount: e.target.value }))} min="0" />
          </div>
          <div className="form-group">
            <label className="form-label">Fine / Penalty (₨)</label>
            <input type="number" className="form-control" value={feeForm.fineAmount} onChange={e => setFeeForm(f => ({ ...f, fineAmount: e.target.value }))} min="0" />
          </div>
          <div className="form-group">
            <label className="form-label">Calculated Due</label>
            <input type="text" className="form-control" readOnly value={`₨ ${Math.max(0, parseFloat(feeForm.amount || 0) + parseFloat(feeForm.fineAmount || 0) - parseFloat(feeForm.paidAmount || 0)).toLocaleString()}`} style={{ background: 'var(--surface-2)' }} />
          </div>
        </div>
        <div className="form-group" style={{ marginTop: 12 }}>
          <label className="form-label">Remarks</label>
          <textarea className="form-control" rows={2} value={feeForm.remarks} onChange={e => setFeeForm(f => ({ ...f, remarks: e.target.value }))} placeholder="Optional remarks" />
        </div>

        {/* Show existing records for this student */}
        {selectedStudent && getStudentFees(selectedStudent._id).length > 0 && (
          <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Existing Fee Records</h4>
            <div style={{ maxHeight: 200, overflow: 'auto' }}>
              {getStudentFees(selectedStudent._id).map(f => (
                <div key={f._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 8, marginBottom: 6 }}>
                  <div style={{ fontSize: 12 }}>
                    <strong>{MONTHS[f.month - 1]}</strong> · {f.feeType} ·
                    <span style={{ color: STATUS_COLORS[f.status], fontWeight: 700, marginLeft: 6 }}>{f.status}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
                    ₨{f.paidAmount}/{f.amount + f.fineAmount} due
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

