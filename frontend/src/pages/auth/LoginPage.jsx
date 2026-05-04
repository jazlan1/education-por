import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getError } from '../../services/api';
import toast from 'react-hot-toast';
import logo from "./images/hellooo.png";


export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(`/${user.role}`);
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = (role) => {
    const creds = {
      admin: { email: 'admin@school.com', password: 'admin123' },
      teacher: { email: 'teacher@school.com', password: 'teacher123' },
      student: { email: 'student@school.com', password: 'student123' },
    };
    setForm(creds[role]);
  };

  return (
    <div className="login-page">
      {/* Decorative circles */}
      <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,159,110,0.08) 0%, transparent 70%)', bottom: -100, left: -100 }} />

      <div className="login-card">
        <div className="login-logo">
          <div style={{ fontSize: 48, marginBottom: 8 }}><img src={logo} alt="logo" height={100} style={{ backgroundColor: 'white', borderRadius: '50px', padding: '1 d0px' }} /></div>
          <h1>IPHS</h1>
          <p>Islamic Public High School</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className={`form-control ${errors.email ? 'error' : ''}`}
              placeholder="Enter your email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              autoFocus
            />
            {errors.email && <div className="form-error">{errors.email}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                className={`form-control ${errors.password ? 'error' : ''}`}
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'rgba(255,255,255,0.4)' }}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.password && <div className="form-error">{errors.password}</div>}
          </div>

          <button type="submit" className="btn btn-primary w-full" style={{ marginTop: 8, justifyContent: 'center', padding: '12px' }} disabled={loading}>
            {loading ? <><span className="loading-spinner" /> Signing in…</> : 'Sign In →'}
          </button>
        </form>

        {/* Demo credentials */}
        <div style={{ marginTop: 28, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 20 }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, textAlign: 'center', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Quick Demo Login</p>
          <div className="demo-login-grid" style={{ display: 'grid', gap: 8 }}>
            {['admin', 'teacher', 'student'].map(role => (
              <button
                key={role}
                type="button"
                onClick={() => demoLogin(role)}
                style={{
                  padding: '8px 4px', background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                  color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', textTransform: 'capitalize', fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
                onMouseOver={e => e.target.style.background = 'rgba(255,255,255,0.12)'}
                onMouseOut={e => e.target.style.background = 'rgba(255,255,255,0.06)'}
              >
                {role === 'admin' ? '👑' : role === 'teacher' ? '👨‍🏫' : '🎓'} {role}
              </button>
            ))}
          </div>
        </div>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 11, marginTop: 24 }}>
          EduManage SMS v1.0 · Secure Login
        </p>
      </div>
    </div>
  );
}
