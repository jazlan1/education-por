import React, { useState, useEffect, useCallback } from 'react';
import { authAPI, getError } from '../../services/api';
import { PageHeader, SearchInput, Pagination, Avatar, Spinner } from '../../components/shared/UI';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [toggling, setToggling] = useState({});

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authAPI.getUsers({ page, limit: 20, role });
      setUsers(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) { toast.error(getError(err)); }
    finally { setLoading(false); }
  }, [page, role]);

  useEffect(() => { fetch(); }, [fetch]);

  const toggleStatus = async (user) => {
    setToggling(t => ({ ...t, [user._id]: true }));
    try {
      const res = await authAPI.toggleUserStatus(user._id);
      toast.success(res.data.message);
      setUsers(prev => prev.map(u => u._id === user._id ? { ...u, isActive: res.data.isActive } : u));
    } catch (err) { toast.error(getError(err)); }
    finally { setToggling(t => ({ ...t, [user._id]: false })); }
  };

  const roleColors = { admin: 'badge-danger', teacher: 'badge-success', student: 'badge-primary' };
  const roleIcons = { admin: '👑', teacher: '👨‍🏫', student: '🎓' };

  return (
    <div>
      <PageHeader title="User Accounts" subtitle={`${pagination.total} total accounts`} />
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ padding: '14px 20px', display: 'flex', gap: 12 }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search users…" />
          <select className="form-control" style={{ width: 'auto' }} value={role} onChange={e => { setRole(e.target.value); setPage(1); }}>
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
          </select>
        </div>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Last Login</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}><Spinner size={28} /></td></tr>
              : users.filter(u => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())).map(u => (
                <tr key={u._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={u.name} size="sm" />
                      <span style={{ fontWeight: 600 }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-2)' }}>{u.email}</td>
                  <td><span className={`badge ${roleColors[u.role]}`}>{roleIcons[u.role]} {u.role}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--text-2)' }}>{u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}</td>
                  <td><span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <button
                      className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-success'}`}
                      onClick={() => toggleStatus(u)}
                      disabled={toggling[u._id] || u.role === 'admin'}
                    >
                      {toggling[u._id] ? <Spinner size={12} /> : (u.isActive ? 'Deactivate' : 'Activate')}
                    </button>
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
    </div>
  );
}
