import React from 'react';

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  if (!open) return null;
  const maxWidths = { sm: 480, md: 600, lg: 800, xl: 1000 };
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: maxWidths[size] }}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: '4px 8px', fontSize: 18, lineHeight: 1 }}>×</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Delete', loading }) {
  if (!open) return null;
  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--text-2)', fontSize: 14 }}>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? <span className="loading-spinner" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export function Pagination({ page, pages, onPageChange }) {
  if (pages <= 1) return null;
  const items = [];
  const delta = 2;
  for (let i = Math.max(1, page - delta); i <= Math.min(pages, page + delta); i++) items.push(i);

  return (
    <div className="pagination">
      <button className="page-btn" onClick={() => onPageChange(page - 1)} disabled={page === 1}>‹</button>
      {items[0] > 1 && <>
        <button className="page-btn" onClick={() => onPageChange(1)}>1</button>
        {items[0] > 2 && <span style={{ padding: '0 4px', color: 'var(--text-3)' }}>…</span>}
      </>}
      {items.map(p => (
        <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => onPageChange(p)}>{p}</button>
      ))}
      {items[items.length - 1] < pages && <>
        {items[items.length - 1] < pages - 1 && <span style={{ padding: '0 4px', color: 'var(--text-3)' }}>…</span>}
        <button className="page-btn" onClick={() => onPageChange(pages)}>{pages}</button>
      </>}
      <button className="page-btn" onClick={() => onPageChange(page + 1)} disabled={page === pages}>›</button>
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar({ src, name, size = 'md' }) {
  const UPLOAD_URL = process.env.REACT_APP_UPLOAD_URL || 'http://localhost:5000';
  const sizes = { sm: 32, md: 36, lg: 56, xl: 96 };
  const px = sizes[size] || 36;
  const fontSize = px * 0.38;

  if (src) {
    const url = src.startsWith('http') ? src : `${UPLOAD_URL}${src}`;
    return <img src={url} alt={name} style={{ width: px, height: px, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  }

  const initials = name ? name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() : '?';
  return (
    <div style={{
      width: px, height: px, borderRadius: '50%',
      background: 'var(--primary-light)', color: 'var(--primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize, flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const map = {
    Active: 'badge-success', Left: 'badge-danger', Graduated: 'badge-info',
    Pass: 'badge-success', Fail: 'badge-danger', Present: 'badge-success',
    Absent: 'badge-danger', Late: 'badge-warning', Excused: 'badge-info',
  };
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>;
}

// ─── Loading Spinner ──────────────────────────────────────────────────────────
export function Spinner({ size = 20 }) {
  return <div className="loading-spinner" style={{ width: size, height: size }} />;
}

// ─── Page Header ──────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>{title}</h1>
        {subtitle && <p style={{ color: 'var(--text-2)', fontSize: 13.5, marginTop: 3 }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
export function ProgressBar({ value, max = 100, color }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const getColor = () => {
    if (color) return color;
    if (pct >= 80) return '#0e9f6e';
    if (pct >= 60) return '#d97706';
    return '#e02424';
  };
  return (
    <div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%`, background: getColor() }} />
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 3, textAlign: 'right' }}>{pct}%</div>
    </div>
  );
}

// ─── Grade Badge ──────────────────────────────────────────────────────────────
export function GradeBadge({ grade }) {
  const colors = {
    'A+': { bg: '#d1fae5', color: '#065f46' },
    'A':  { bg: '#d1fae5', color: '#065f46' },
    'B':  { bg: '#dbeafe', color: '#1e40af' },
    'C':  { bg: '#fef3c7', color: '#92400e' },
    'D':  { bg: '#fee2e2', color: '#991b1b' },
    'F':  { bg: '#fce7f3', color: '#9d174d' },
  };
  const style = colors[grade] || { bg: 'var(--surface-2)', color: 'var(--text-2)' };
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 6,
      background: style.bg, color: style.color,
      fontWeight: 700, fontSize: 13,
    }}>{grade || '—'}</span>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ icon = '📭', title = 'No data found', subtitle, action }) {
  return (
    <div style={{ padding: '60px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>{subtitle}</div>}
      {action}
    </div>
  );
}

// ─── Search Input ─────────────────────────────────────────────────────────────
export function SearchInput({ value, onChange, placeholder = 'Search…' }) {
  return (
    <div className="search-bar" style={{ minWidth: 240 }}>
      <span>🔍</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button onClick={() => onChange('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>
      )}
    </div>
  );
}
