// Notifications admin page
import React, { useState, useEffect } from 'react';
import { notificationAPI, authAPI, getError } from '../../services/api';
import { PageHeader, Modal, Spinner, ConfirmDialog } from '../../components/shared/UI';
import toast from 'react-hot-toast';

export function NotificationsPage() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', type: 'info', targetRole: 'all' });
  const [sending, setSending] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try { const r = await notificationAPI.getAll(); setNotifs(r.data.data); }
    catch (err) { toast.error(getError(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) { toast.error('Title and message required'); return; }
    setSending(true);
    try {
      await notificationAPI.create(form);
      toast.success('Notification sent');
      setModal(false);
      setForm({ title: '', message: '', type: 'info', targetRole: 'all' });
      fetch();
    } catch (err) { toast.error(getError(err)); }
    finally { setSending(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await notificationAPI.delete(deleteTarget._id); toast.success('Deleted'); setDeleteTarget(null); fetch(); }
    catch (err) { toast.error(getError(err)); }
    finally { setDeleting(false); }
  };

  const typeIcons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };

  return (
    <div>
      <PageHeader title="Notifications" subtitle="Send announcements to users" actions={<button className="btn btn-primary" onClick={() => setModal(true)}>+ Send Notification</button>} />
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Type</th><th>Title</th><th>Message</th><th>Target</th><th>Sent</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 30 }}><Spinner size={24} /></td></tr>
              : notifs.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 30, color: 'var(--text-3)' }}>No notifications sent yet</td></tr>
              : notifs.map(n => (
                <tr key={n._id}>
                  <td style={{ fontSize: 18 }}>{typeIcons[n.type]}</td>
                  <td style={{ fontWeight: 600 }}>{n.title}</td>
                  <td style={{ color: 'var(--text-2)', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.message}</td>
                  <td><span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>{n.targetRole}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--text-2)' }}>{new Date(n.createdAt).toLocaleString()}</td>
                  <td><button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => setDeleteTarget(n)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Send Notification"
        footer={<><button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSend} disabled={sending}>{sending ? <Spinner size={14} /> : 'Send'}</button></>}
      >
        <div className="grid grid-2">
          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label className="form-label">Title <span className="required">*</span></label>
            <input className="form-control" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Notification title" />
          </div>
          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label className="form-label">Message <span className="required">*</span></label>
            <textarea className="form-control" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={3} placeholder="Notification message" />
          </div>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-control" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="error">Error/Alert</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Send To</label>
            <select className="form-control" value={form.targetRole} onChange={e => setForm(f => ({ ...f, targetRole: e.target.value }))}>
              <option value="all">Everyone</option>
              <option value="admin">Admins</option>
              <option value="teacher">Teachers</option>
              <option value="student">Students</option>
            </select>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Notification" message={`Delete notification "${deleteTarget?.title}"?`} confirmLabel="Delete" loading={deleting} />
    </div>
  );
}

export default NotificationsPage;
