import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { studentAPI, classAPI, getError } from '../../services/api';
import { PageHeader, Spinner } from '../../components/shared/UI';
import toast from 'react-hot-toast';

const CURRENT_YEAR = new Date().getFullYear();
const UPLOAD_URL = process.env.REACT_APP_UPLOAD_URL || 'http://localhost:5000';

const initialForm = {
  fullName: '', fatherName: '', fatherCNIC: '', dateOfBirth: '', phoneNumber: '',
  rollNumber: '', address: '', gender: 'Male', status: 'Active',
  email: '', password: '',
  admissionYear: CURRENT_YEAR, admissionClass: '', currentClass: '',
};

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

export default function AddEditStudent() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [errors, setErrors] = useState({});
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    classAPI.getAll().then(r => setClasses(r.data.data)).catch(() => {});
    if (isEdit) {
      studentAPI.getOne(id)
        .then(r => {
          const s = r.data.data;
          setForm({
            fullName: s.fullName || '', fatherName: s.fatherName || '',
            fatherCNIC: s.fatherCNIC || '', dateOfBirth: s.dateOfBirth?.slice(0,10) || '',
            phoneNumber: s.phoneNumber || '', rollNumber: s.rollNumber || '',
            address: s.address || '', gender: s.gender || 'Male', status: s.status || 'Active',
            email: s.user?.email || '', password: '',
            admissionYear: s.admission?.admissionYear || CURRENT_YEAR,
            admissionClass: s.admission?.admissionClass || '',
            currentClass: s.admission?.currentClass?._id || '',
          });
          if (s.profilePhoto) setPhotoPreview(`${UPLOAD_URL}${s.profilePhoto}`);
        })
        .catch(err => toast.error(getError(err)))
        .finally(() => setFetching(false));
    }
  }, [id]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Required';
    if (!form.fatherName.trim()) e.fatherName = 'Required';
    if (!form.fatherCNIC.match(/^\d{5}-\d{7}-\d{1}$/)) e.fatherCNIC = 'Format: XXXXX-XXXXXXX-X';
    if (!form.dateOfBirth) e.dateOfBirth = 'Required';
    if (!form.phoneNumber.match(/^(\+92|0)[0-9]{10}$/)) e.phoneNumber = 'Format: 03XXXXXXXXX';
    if (!form.rollNumber.trim()) e.rollNumber = 'Required';
    if (!form.address.trim()) e.address = 'Required';
    if (!isEdit) {
      if (!form.email.match(/^\S+@\S+\.\S+$/)) e.email = 'Valid email required';
    }
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
    Object.entries(form).forEach(([k, v]) => {
      if (k === 'admissionYear' || k === 'admissionClass' || k === 'currentClass') return;
      if (v !== '' && v !== undefined) fd.append(k, v);
    });
    fd.append('admission[admissionYear]', form.admissionYear);
    fd.append('admission[admissionClass]', form.admissionClass);
    if (form.currentClass) fd.append('admission[currentClass]', form.currentClass);
    if (photoFile) fd.append('profilePhoto', photoFile);

    try {
      if (isEdit) { await studentAPI.update(id, fd); toast.success('Student updated'); }
      else { await studentAPI.create(fd); toast.success('Student created'); }
      navigate('/admin/students');
    } catch (err) { toast.error(getError(err)); }
    finally { setLoading(false); }
  };

  if (fetching) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={36} /></div>;

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Student' : 'Add New Student'}
        subtitle={isEdit ? 'Update student information' : 'Register a new student in the system'}
        actions={<button className="btn btn-secondary" onClick={() => navigate('/admin/students')}>← Back</button>}
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-2" style={{ gap: 20 }}>
          {/* Personal Info */}
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-header"><span className="card-title">👤 Personal Information</span></div>
            <div className="card-body">
              <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', marginBottom: 20 }}>
                {/* Photo upload */}
                <div>
                  <div
                    className="photo-upload"
                    onClick={() => fileRef.current.click()}
                    style={{ width: 96, height: 96 }}
                  >
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" />
                    ) : (
                      <div style={{ textAlign: 'center', color: 'var(--text-3)' }}>
                        <div style={{ fontSize: 24 }}>📷</div>
                        <div style={{ fontSize: 10, marginTop: 4 }}>Upload</div>
                      </div>
                    )}
                    <div className="photo-upload-overlay">
                      <span style={{ fontSize: 20 }}>✏️</span>
                    </div>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
                  <div style={{ fontSize: 10, color: 'var(--text-3)', textAlign: 'center', marginTop: 6 }}>Max 5MB</div>
                </div>

                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                  <FormField label="Full Name" name="fullName" required value={form.fullName} error={errors.fullName} onChange={set} placeholder="e.g. Muhammad Ahmed" />
                  <FormField label="Father's Name" name="fatherName" required value={form.fatherName} error={errors.fatherName} onChange={set} placeholder="e.g. Muhammad Ali" />
                  <FormField label="Father's CNIC" name="fatherCNIC" required value={form.fatherCNIC} error={errors.fatherCNIC} onChange={set} placeholder="XXXXX-XXXXXXX-X" />
                  <FormField label="Roll Number" name="rollNumber" required value={form.rollNumber} error={errors.rollNumber} onChange={set} placeholder="e.g. GR1-001" />
                </div>
              </div>

              <div className="grid grid-3">
                <FormField label="Date of Birth" name="dateOfBirth" required type="date" value={form.dateOfBirth} error={errors.dateOfBirth} onChange={set} />
                <div className="form-group">
                  <label className="form-label">Gender <span className="required">*</span></label>
                  <select className="form-control" value={form.gender} onChange={e => set('gender', e.target.value)}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <FormField label="Phone Number" name="phoneNumber" required value={form.phoneNumber} error={errors.phoneNumber} onChange={set} placeholder="03XXXXXXXXX" />
              </div>

              <div className="form-group">
                <label className="form-label">Address <span className="required">*</span></label>
                <textarea className={`form-control ${errors.address ? 'error' : ''}`} value={form.address} onChange={e => set('address', e.target.value)} rows={2} placeholder="Full residential address" />
                {errors.address && <div className="form-error">{errors.address}</div>}
              </div>
            </div>
          </div>

          {/* Admission Info */}
          <div className="card">
            <div className="card-header"><span className="card-title">📚 Admission Details</span></div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Admission Year <span className="required">*</span></label>
                <input type="number" className="form-control" value={form.admissionYear} onChange={e => set('admissionYear', e.target.value)} min="1990" max={CURRENT_YEAR} />
              </div>
              <div className="form-group">
                <label className="form-label">Admission Class <span className="required">*</span></label>
                <input type="text" className="form-control" value={form.admissionClass} onChange={e => set('admissionClass', e.target.value)} placeholder="e.g. Grade 1" />
              </div>
              <div className="form-group">
                <label className="form-label">Current Class</label>
                <select className="form-control" value={form.currentClass} onChange={e => set('currentClass', e.target.value)}>
                  <option value="">Select class</option>
                  {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value="Active">Active</option>
                  <option value="Left">Left</option>
                  <option value="Graduated">Graduated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="card">
            <div className="card-header"><span className="card-title">🔐 Login Account</span></div>
            <div className="card-body">
              <FormField label="Email Address" name="email" required={!isEdit} type="email" value={form.email} error={errors.email} onChange={set} placeholder="student@school.com" />
              <FormField
                label={isEdit ? 'New Password (leave blank to keep)' : 'Password'}
                name="password"
                required={!isEdit}
                type="password"
                value={form.password}
                error={errors.password}
                onChange={set}
                placeholder={isEdit ? 'Leave blank to keep current' : 'Min 6 characters'}
              />
              {!isEdit && (
                <div style={{ padding: '10px 14px', background: 'var(--info-light)', borderRadius: 8, fontSize: 12, color: '#0e7490' }}>
                  💡 If password is left blank, default will be: <strong>sms{'{rollNumber}'}@123</strong>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/students')}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <><Spinner size={14} /> Saving…</> : (isEdit ? '💾 Update Student' : '✅ Add Student')}
          </button>
        </div>
      </form>
    </div>
  );
}
