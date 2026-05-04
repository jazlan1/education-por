// ─── Teachers Page ─────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { teacherAPI, classAPI, reportAPI, getError } from '../../services/api';
import { PageHeader, SearchInput, Pagination, Avatar, Spinner, ConfirmDialog, EmptyState, StatusBadge } from '../../components/shared/UI';
import toast from 'react-hot-toast';

export function TeachersPage() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await teacherAPI.getAll({ search, page, limit: 15 });
      setTeachers(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) { toast.error(getError(err)); }
    finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { setPage(1); }, [search]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await teacherAPI.delete(deleteTarget._id);
      toast.success('Teacher deleted');
      setDeleteTarget(null);
      fetch();
    } catch (err) { toast.error(getError(err)); }
    finally { setDeleting(false); }
  };

  const exportTeachers = async () => {
    setExporting(true);
    try {
      const res = await reportAPI.exportTeachers();
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = 'teachers.xlsx'; a.click();
      URL.revokeObjectURL(url);
    } catch (err) { toast.error(getError(err)); }
    finally { setExporting(false); }
  };

  return (
    <div>
      <PageHeader
        title="Teachers"
        subtitle={`${pagination.total} teachers registered`}
        actions={<>
          <button className="btn btn-secondary" onClick={exportTeachers} disabled={exporting}>{exporting ? <Spinner size={14} /> : '📥'} Export</button>
          <button className="btn btn-primary" onClick={() => navigate('/admin/teachers/add')}>+ Add Teacher</button>
        </>}
      />
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ padding: '14px 20px' }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name or subject…" />
        </div>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Teacher</th><th>CNIC</th><th>Subjects</th><th>Qualification</th><th>Phone</th><th>Joined</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40 }}><Spinner size={28} /></td></tr>
              : teachers.length === 0 ? <tr><td colSpan={8}><EmptyState icon="👨‍🏫" title="No teachers found" /></td></tr>
              : teachers.map(t => (
                <tr key={t._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar src={t.profilePhoto} name={t.fullName} size="sm" />
                      <div>
                        <div style={{ fontWeight: 600 }}>{t.fullName}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{t.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="font-mono" style={{ fontSize: 12 }}>{t.cnic}</td>
                  <td>{t.subjects?.slice(0,2).map(s => <span key={s} className="badge badge-primary" style={{ marginRight: 4 }}>{s}</span>)}</td>
                  <td>{t.qualification}</td>
                  <td style={{ fontSize: 12 }}>{t.phoneNumber}</td>
                  <td>{t.joiningYear}</td>
                  <td><span className={`badge ${t.isActive ? 'badge-success' : 'badge-danger'}`}>{t.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/admin/teachers/${t._id}/edit`)}>Edit</button>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => setDeleteTarget(t)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagination.pages > 1 && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
            <Pagination page={page} pages={pagination.pages} onPageChange={setPage} />
          </div>
        )}
      </div>
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Teacher" message={`Delete "${deleteTarget?.fullName}"? This will also remove their login account.`}
        confirmLabel="Delete Teacher" loading={deleting} />
    </div>
  );
}

export default TeachersPage;
