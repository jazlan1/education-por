import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { teacherAPI, getError } from '../../services/api';
import { PageHeader, Spinner } from '../../components/shared/UI';
import toast from 'react-hot-toast';

const UPLOAD_URL =
  process.env.REACT_APP_UPLOAD_URL ||
  (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');
const CURRENT_YEAR = new Date().getFullYear();
const initial = { fullName: '', cnic: '', qualification: '', joiningYear: CURRENT_YEAR, subjects: '', phoneNumber: '', address: '', email: '', gender: 'Male', password: '', isActive: true };

function FormField({ label, name, required, type = 'text', value, error, onChange, ...rest }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}{required && <span className="required"> *</span>}</label>
      <input
        type={type}
        className={`form-control ${error ? 'error' : ''}`}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        {...rest}
      />
      {error && <div className="form-error">{error}</div>}
    </div>
  );
}

export default function AddEditTeacher() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [errors, setErrors] = useState({});
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    if (!isEdit) return;
    teacherAPI.getOne(id)
      .then(r => {
        const t = r.data.data;
        setForm({
          fullName: t.fullName||'', cnic: t.cnic||'', qualification: t.qualification||'',
          joiningYear: t.joiningYear||CURRENT_YEAR, subjects: t.subjects?.join(', ')||'',
          phoneNumber: t.phoneNumber||'', address: t.address||'',
          email: t.email||'', gender: t.gender||'Male', password: '', isActive: t.isActive,
        });
        if (t.profilePhoto) setPhotoPreview(`${UPLOAD_URL}${t.profilePhoto}`);
      })
      .catch(err => toast.error(getError(err)))
      .finally(() => setFetching(false));
  }, [id]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Required';
    if (!form.cnic.match(/^\d{5}-\d{7}-\d{1}$/)) e.cnic = 'Format: XXXXX-XXXXXXX-X';
    if (!form.qualification.trim()) e.qualification = 'Required';
    if (!form.subjects.trim()) e.subjects = 'Required';
    if (!form.phoneNumber.match(/^(\+92|0)[0-9]{10}$/)) e.phoneNumber = 'Format: 03XXXXXXXXX';
    if (!form.address.trim()) e.address = 'Required';
    if (!isEdit && !form.email.match(/^\S+@\S+\.\S+$/)) e.email = 'Valid email required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return; }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v); });
    if (photoFile) fd.append('profilePhoto', photoFile);

    try {
      if (isEdit) { await teacherAPI.update(id, fd); toast.success('Teacher updated'); }
      else { await teacherAPI.create(fd); toast.success('Teacher created'); }
      navigate('/admin/teachers');
    } catch (err) { toast.error(getError(err)); }
    finally { setLoading(false); }
  };

  if (fetching) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={36} /></div>;

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Teacher' : 'Add New Teacher'}
        actions={<button className="btn btn-secondary" onClick={() => navigate('/admin/teachers')}>← Back</button>}
      />
      <form onSubmit={handleSubmit}>
        <div className="grid grid-2" style={{ gap: 20 }}>
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-header"><span className="card-title">👨‍🏫 Teacher Information</span></div>
            <div className="card-body">
              <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <div className="photo-upload" onClick={() => fileRef.current.click()} style={{ width: 96, height: 96 }}>
                    {photoPreview ? <img src={photoPreview} alt="Preview" /> : <div style={{ textAlign: 'center', color: 'var(--text-3)' }}><div style={{ fontSize: 24 }}>📷</div><div style={{ fontSize: 10 }}>Upload</div></div>}
                    <div className="photo-upload-overlay"><span style={{ fontSize: 20 }}>✏️</span></div>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
                </div>
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                  <FormField label="Full Name" name="fullName" required value={form.fullName} error={errors.fullName} onChange={set} placeholder="Muhammad Ali" />
                  <FormField label="CNIC" name="cnic" required value={form.cnic} error={errors.cnic} onChange={set} placeholder="XXXXX-XXXXXXX-X" />
                  <FormField label="Qualification" name="qualification" required value={form.qualification} error={errors.qualification} onChange={set} placeholder="e.g. M.Ed, B.Ed" />
                  <div className="form-group">
                    <label className="form-label">Joining Year <span className="required">*</span></label>
                    <input type="number" className="form-control" value={form.joiningYear} onChange={e => set('joiningYear', e.target.value)} min="1990" max={CURRENT_YEAR} />
                  </div>
                </div>
              </div>
              <div className="grid grid-3">
                <div className="form-group">
                  <label className="form-label">Subjects <span className="required">*</span></label>
                  <input type="text" className={`form-control ${errors.subjects ? 'error' : ''}`} value={form.subjects} onChange={e => set('subjects', e.target.value)} placeholder="Math, Science (comma separated)" />
                  {errors.subjects && <div className="form-error">{errors.subjects}</div>}
                </div>
                <FormField label="Phone Number" name="phoneNumber" required value={form.phoneNumber} error={errors.phoneNumber} onChange={set} placeholder="03XXXXXXXXX" />
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-control" value={form.gender} onChange={e => set('gender', e.target.value)}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Address <span className="required">*</span></label>
                <textarea className={`form-control ${errors.address ? 'error' : ''}`} value={form.address} onChange={e => set('address', e.target.value)} rows={2} />
                {errors.address && <div className="form-error">{errors.address}</div>}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">🔐 Login Account</span></div>
            <div className="card-body">
              <FormField label="Email Address" name="email" required={!isEdit} type="email" value={form.email} error={errors.email} onChange={set} placeholder="teacher@school.com" />
              <FormField label={isEdit ? 'New Password (leave blank to keep)' : 'Password'} name="password" required={!isEdit} type="password" value={form.password} error={errors.password} onChange={set} placeholder="Min 6 characters" />
              {isEdit && (
                <div className="form-group">
                  <label className="form-label">Account Status</label>
                  <select className="form-control" value={form.isActive} onChange={e => set('isActive', e.target.value === 'true')}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/teachers')}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <><Spinner size={14} /> Saving…</> : (isEdit ? '💾 Update Teacher' : '✅ Add Teacher')}
          </button>
        </div>
      </form>
    </div>
  );
}
