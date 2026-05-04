import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentAPI, classAPI, reportAPI, getError } from '../../services/api';
import { PageHeader, SearchInput, Pagination, Avatar, StatusBadge, EmptyState, Spinner, ConfirmDialog } from '../../components/shared/UI';
import toast from 'react-hot-toast';

export default function StudentsPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ classId: '', status: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await studentAPI.getAll({ search, page, limit: 15, ...filters });
      setStudents(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) { toast.error(getError(err)); }
    finally { setLoading(false); }
  }, [search, page, filters]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  useEffect(() => {
    classAPI.getAll().then(res => setClasses(res.data.data)).catch(() => {});
  }, []);

  // Debounce search
  useEffect(() => { setPage(1); }, [search, filters]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await studentAPI.delete(deleteTarget._id);
      toast.success('Student deleted');
      setDeleteTarget(null);
      fetchStudents();
    } catch (err) { toast.error(getError(err)); }
    finally { setDeleting(false); }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await reportAPI.exportStudents(filters);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = 'students.xlsx'; a.click();
      URL.revokeObjectURL(url);
      toast.success('Export successful');
    } catch (err) { toast.error(getError(err)); }
    finally { setExporting(false); }
  };

  return (
    <div>
      <PageHeader
        title="Students"
        subtitle={`${pagination.total} students registered`}
        actions={<>
          <button className="btn btn-secondary" onClick={handleExport} disabled={exporting}>
            {exporting ? <Spinner size={14} /> : '📥'} Export Excel
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/admin/students/add')}>
            + Add Student
          </button>
        </>}
      />

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ padding: '14px 20px', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, roll number…" />
          <select
            className="form-control"
            style={{ width: 'auto', minWidth: 150 }}
            value={filters.classId}
            onChange={e => setFilters(f => ({ ...f, classId: e.target.value }))}
          >
            <option value="">All Classes</option>
            {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select
            className="form-control"
            style={{ width: 'auto', minWidth: 130 }}
            value={filters.status}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Left">Left</option>
            <option value="Graduated">Graduated</option>
          </select>
          {(filters.classId || filters.status || search) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setFilters({ classId: '', status: '' }); setSearch(''); }}>
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Roll Number</th>
                <th>Class</th>
                <th>Father Name</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}><Spinner size={28} /></td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={7}>
                  <EmptyState icon="🎓" title="No students found" subtitle="Try adjusting your search or filters" />
                </td></tr>
              ) : students.map(s => (
                <tr key={s._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar src={s.profilePhoto} name={s.fullName} size="sm" />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{s.fullName}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{s.gender}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="font-mono" style={{ fontSize: 12, background: 'var(--surface-2)', padding: '2px 8px', borderRadius: 5 }}>{s.rollNumber}</span></td>
                  <td>{s.admission?.currentClass?.name || '—'}</td>
                  <td style={{ color: 'var(--text-2)' }}>{s.fatherName}</td>
                  <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{s.phoneNumber}</td>
                  <td><StatusBadge status={s.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/admin/students/${s._id}`)}>View</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/admin/students/${s._id}/edit`)}>Edit</button>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => setDeleteTarget(s)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
              Showing {((page - 1) * 15) + 1}–{Math.min(page * 15, pagination.total)} of {pagination.total}
            </span>
            <Pagination page={page} pages={pagination.pages} onPageChange={setPage} />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Student"
        message={`Are you sure you want to delete "${deleteTarget?.fullName}"? This action cannot be undone and will also delete their user account.`}
        confirmLabel="Delete Student"
        loading={deleting}
      />
    </div>
  );
}
