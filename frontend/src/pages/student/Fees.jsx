import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { feeAPI, getError } from '../../services/api';
import { PageHeader, Spinner, EmptyState } from '../../components/shared/UI';
import toast from 'react-hot-toast';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const STATUS_COLORS = { Paid: '#0e9f6e', Partial: '#d97706', Unpaid: '#e02424', Overdue: '#7e3af2' };

export default function StudentFees() {
  const { user } = useAuth();
  const [fees, setFees] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.profileRef) { setLoading(false); return; }
    feeAPI.getByStudent(user.profileRef)
      .then(r => {
        setFees(r.data.data);
        setSummary(r.data.summary);
      })
      .catch(err => toast.error(getError(err)))
      .finally(() => setLoading(false));
  }, [user]);

  const years = [...new Set(fees.map(f => f.academicYear))].sort().reverse();

  return (
    <div>
      <PageHeader title="My Fees" subtitle="Fee status, payments, dues & fines" />

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-4" style={{ marginBottom: 24 }}>
          {[
            { label: 'Total Fee', value: `₨ ${summary.totalAmount?.toLocaleString() || 0}`, color: '#1a56db', bg: '#ebf2ff' },
            { label: 'Total Paid', value: `₨ ${summary.totalPaid?.toLocaleString() || 0}`, color: '#0e9f6e', bg: '#def7ec' },
            { label: 'Total Fine', value: `₨ ${summary.totalFine?.toLocaleString() || 0}`, color: '#e02424', bg: '#fde8e8' },
            { label: 'Total Due', value: `₨ ${summary.totalDue?.toLocaleString() || 0}`, color: summary.totalDue > 0 ? '#e02424' : '#0e9f6e', bg: summary.totalDue > 0 ? '#fde8e8' : '#def7ec' },
          ].map(s => (
            <div key={s.label} className="card" style={{ background: s.bg }}>
              <div style={{ padding: 18, textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4, fontWeight: 600 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fee Records */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><Spinner size={36} /></div>
      ) : fees.length === 0 ? (
        <EmptyState icon="💰" title="No fee records" subtitle="Your fee records will appear here" />
      ) : (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Fee Records</span>
            <span className="badge badge-info">{fees.length} record(s)</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Paid</th>
                  <th>Fine</th>
                  <th>Due</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {fees.map(fee => (
                  <tr key={fee._id}>
                    <td style={{ fontWeight: 600 }}>{MONTHS[fee.month - 1]} <span style={{ fontSize: 11, color: 'var(--text-3)' }}>({fee.academicYear})</span></td>
                    <td><span className="badge badge-gray">{fee.feeType}</span></td>
                    <td>₨ {fee.amount?.toLocaleString()}</td>
                    <td style={{ color: '#0e9f6e', fontWeight: 600 }}>₨ {fee.paidAmount?.toLocaleString()}</td>
                    <td style={{ color: fee.fineAmount > 0 ? '#e02424' : 'var(--text-2)' }}>₨ {fee.fineAmount?.toLocaleString()}</td>
                    <td style={{ color: fee.dueAmount > 0 ? '#e02424' : '#0e9f6e', fontWeight: fee.dueAmount > 0 ? 700 : 400 }}>
                      ₨ {fee.dueAmount?.toLocaleString()}
                    </td>
                    <td>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: STATUS_COLORS[fee.status] + '22', color: STATUS_COLORS[fee.status] }}>
                        {fee.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-2)', maxWidth: 150 }}>{fee.remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Due Warning */}
      {summary?.totalDue > 0 && (
        <div className="card" style={{ marginTop: 20, background: '#fde8e8', border: '1px solid #fbd5d5' }}>
          <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 700, color: '#c81e1e', fontSize: 14 }}>Outstanding Dues</div>
              <div style={{ fontSize: 12, color: '#9b1c1c', marginTop: 2 }}>
                You have total dues of <strong>₨ {summary.totalDue.toLocaleString()}</strong>. Please clear your pending fees as soon as possible to avoid additional fines.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

