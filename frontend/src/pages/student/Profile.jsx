import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI, getError } from '../../services/api';
import { PageHeader, Avatar, Spinner, StatusBadge } from '../../components/shared/UI';
import toast from 'react-hot-toast';

export default function StudentProfile() {
  const { user } = useAuth();
  const profile = user?.profile;
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (pwForm.newPassword.length < 6) { toast.error('Min 6 characters'); return; }
    setSaving(true);
    try {
      await authAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { toast.error(getError(err)); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader title="My Profile" subtitle="Your student account details" />
      <div className="grid grid-2">
        <div className="card">
          <div style={{ padding: 24, display: 'flex', gap: 16, alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
            <Avatar src={profile?.profilePhoto} name={user?.name} size="lg" />
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800 }}>{user?.name}</h2>
              <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                <span className="badge badge-primary">Student</span>
                {profile?.status && <StatusBadge status={profile.status} />}
              </div>
            </div>
          </div>
          <div className="card-body">
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Personal Details</div>
            {[
              ['Roll Number', profile?.rollNumber],
              ['Date of Birth', profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-PK') : '—'],
              ['Gender', profile?.gender],
              ['Phone', profile?.phoneNumber],
              ["Father's Name", profile?.fatherName],
              ["Father's CNIC", profile?.fatherCNIC],
              ['Address', profile?.address],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', padding: '9px 0', borderBottom: '1px solid var(--border)', gap: 12 }}>
                <div style={{ width: 140, color: 'var(--text-2)', fontSize: 12.5, fontWeight: 600, flexShrink: 0 }}>{k}</div>
                <div style={{ fontSize: 13 }}>{v || '—'}</div>
              </div>
            ))}
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', margin: '16px 0 10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Admission Details</div>
            {[
              ['Current Class', profile?.admission?.currentClass?.name],
              ['Admission Year', profile?.admission?.admissionYear],
              ['Admission Class', profile?.admission?.admissionClass],
              ['Email', user?.email],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', padding: '9px 0', borderBottom: '1px solid var(--border)', gap: 12 }}>
                <div style={{ width: 140, color: 'var(--text-2)', fontSize: 12.5, fontWeight: 600, flexShrink: 0 }}>{k}</div>
                <div style={{ fontSize: 13 }}>{v || '—'}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ alignSelf: 'flex-start' }}>
          <div className="card-header"><span className="card-title">🔐 Change Password</span></div>
          <div className="card-body">
            <form onSubmit={handleChangePassword}>
              {[
                { label: 'Current Password', key: 'currentPassword' },
                { label: 'New Password', key: 'newPassword' },
                { label: 'Confirm New Password', key: 'confirmPassword' },
              ].map(f => (
                <div className="form-group" key={f.key}>
                  <label className="form-label">{f.label}</label>
                  <input type="password" className="form-control" value={pwForm[f.key]} onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder="••••••••" />
                </div>
              ))}
              <button type="submit" className="btn btn-primary w-full" style={{ justifyContent: 'center' }} disabled={saving}>
                {saving ? <Spinner size={14} /> : '🔒 Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
