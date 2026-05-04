import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI, getError } from '../../services/api';
import { PageHeader, Avatar, Spinner } from '../../components/shared/UI';
import toast from 'react-hot-toast';

export default function TeacherProfile() {
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
      toast.success('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { toast.error(getError(err)); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader title="My Profile" subtitle="Your teacher account details" />
      <div className="grid grid-2">
        <div className="card">
          <div style={{ padding: 24, display: 'flex', gap: 16, alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
            <Avatar src={profile?.profilePhoto} name={user?.name} size="lg" />
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800 }}>{user?.name}</h2>
              <span className="badge badge-success" style={{ marginTop: 4 }}>Teacher</span>
            </div>
          </div>
          <div className="card-body">
            {[
              ['Email', user?.email],
              ['CNIC', profile?.cnic],
              ['Qualification', profile?.qualification],
              ['Subjects', profile?.subjects?.join(', ')],
              ['Phone', profile?.phoneNumber],
              ['Joining Year', profile?.joiningYear],
              ['Gender', profile?.gender],
              ['Address', profile?.address],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', padding: '9px 0', borderBottom: '1px solid var(--border)', gap: 12 }}>
                <div style={{ width: 130, color: 'var(--text-2)', fontSize: 12.5, fontWeight: 600, flexShrink: 0 }}>{k}</div>
                <div style={{ fontSize: 13 }}>{v || '—'}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
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
