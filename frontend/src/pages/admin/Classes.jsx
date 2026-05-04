// Classes page
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { classAPI, teacherAPI, getError } from '../../services/api';
import { PageHeader, Modal, Spinner, EmptyState, ConfirmDialog } from '../../components/shared/UI';
import toast from 'react-hot-toast';

const CY = new Date().getFullYear();
const initClass = { name: '', grade: 1, section: 'A', academicYear: `${CY-1}-${String(CY).slice(-2)}`, maxStudents: 40, classTeacher: '' };

export default function ClassesPage() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initClass);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const [cr, tr] = await Promise.all([classAPI.getAll(), teacherAPI.getAll({ limit: 100 })]);
      setClasses(cr.data.data);
      setTeachers(tr.data.data);
    } catch (err) { toast.error(getError(err)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const openModal = (cls = null) => {
    if (cls) { setEditing(cls); setForm({ name: cls.name, grade: cls.grade, section: cls.section, academicYear: cls.academicYear, maxStudents: cls.maxStudents, classTeacher: cls.classTeacher?._id || '' }); }
    else { setEditing(null); setForm(initClass); }
    setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) { await classAPI.update(editing._id, form); toast.success('Class updated'); }
      else { await classAPI.create(form); toast.success('Class created'); }
      setModal(false);
      fetch();
    } catch (err) { toast.error(getError(err)); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await classAPI.delete(deleteTarget._id);
      toast.success('Class deleted');
      setDeleteTarget(null);
      fetch();
    } catch (err) { toast.error(getError(err)); }
    finally { setDeleting(false); }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div>
      <PageHeader title="Classes" subtitle={`${classes.length} classes`} actions={<button className="btn btn-primary" onClick={() => openModal()}>+ Add Class</button>} />
      {loading ? <div style={{ textAlign: 'center', padding: 60 }}><Spinner size={36} /></div> : (
        <div className="grid grid-3">
          {classes.length === 0 ? <div style={{ gridColumn: '1/-1' }}><EmptyState icon="🏫" title="No classes yet" action={<button className="btn btn-primary" onClick={() => openModal()}>Add First Class</button>} /></div>
          : classes.map(cls => (
            <div key={cls._id} className="card" style={{ transition: 'transform 0.15s', cursor: 'default' }}>
              <div style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800 }}>{cls.name}</h3>
                    <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>Grade {cls.grade} · Section {cls.section}</div>
                  </div>
                  <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 8, padding: '4px 10px', fontSize: 13, fontWeight: 700 }}>
                    {cls.studentCount || 0}/{cls.maxStudents}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 4 }}>📅 {cls.academicYear}</div>
                {cls.classTeacher && <div style={{ fontSize: 12, color: 'var(--text-2)' }}>👨‍🏫 {cls.classTeacher.fullName}</div>}
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/admin/classes/${cls._id}`)}>View Students</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => openModal(cls)}>Edit</button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => setDeleteTarget(cls)}>Del</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Class' : 'Add New Class'}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? <Spinner size={14} /> : (editing ? 'Update' : 'Create')}</button>
        </>}
      >
        <form onSubmit={handleSave}>
          <div className="grid grid-2">
            <div className="form-group"><label className="form-label">Class Name <span className="required">*</span></label><input className="form-control" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Grade 1-A" /></div>
            <div className="form-group"><label className="form-label">Grade <span className="required">*</span></label><input type="number" className="form-control" value={form.grade} onChange={e => set('grade', e.target.value)} min="1" max="12" /></div>
            <div className="form-group"><label className="form-label">Section</label><input className="form-control" value={form.section} onChange={e => set('section', e.target.value)} placeholder="A" /></div>
            <div className="form-group"><label className="form-label">Max Students</label><input type="number" className="form-control" value={form.maxStudents} onChange={e => set('maxStudents', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Academic Year</label><input className="form-control" value={form.academicYear} onChange={e => set('academicYear', e.target.value)} placeholder="2024-25" /></div>
            <div className="form-group">
              <label className="form-label">Class Teacher</label>
              <select className="form-control" value={form.classTeacher} onChange={e => set('classTeacher', e.target.value)}>
                <option value="">Select teacher</option>
                {teachers.map(t => <option key={t._id} value={t._id}>{t.fullName}</option>)}
              </select>
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Class" message={`Delete class "${deleteTarget?.name}"? This cannot be undone.`} confirmLabel="Delete" loading={deleting} />
    </div>
  );
}
