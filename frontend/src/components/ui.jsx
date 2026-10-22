/* eslint-disable react-refresh/only-export-components --
   This module intentionally co-locates small presentational components with
   their helper functions (statusTone) and the usePageTitle hook. */
import React, { useEffect } from 'react';
import {
  IconAlert, IconInfo, IconCheckCircle, IconXCircle, IconDroplet, IconChevronRight,
} from './icons';

/* ------------------------------ Brand ------------------------------ */
export function BrandMark({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="38" height="38" rx="11" fill="url(#cbBrand)" />
      <path
        d="M20 9.5s6.8 6.6 6.8 11.9a6.8 6.8 0 1 1-13.6 0C13.2 16.1 20 9.5 20 9.5Z"
        fill="#ffffff"
        fillOpacity="0.96"
      />
      <path
        d="M17 21.2h2.4l1.1-2.6 1.6 4.6 1-2h2.4"
        stroke="#167C68"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="cbBrand" x1="4" y1="2" x2="37" y2="39" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1B8A73" />
          <stop offset="1" stopColor="#0C4A40" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Wordmark({ compact = false, light = false }) {
  return (
    <span className="row gap-2" style={{ alignItems: 'center' }}>
      <BrandMark />
      {!compact && (
        <span className="stack" style={{ lineHeight: 1.05 }}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '1.06rem',
              letterSpacing: '-0.02em',
              color: light ? '#fff' : 'var(--ink-900)',
            }}
          >
            Cloud Blood Bank
          </span>
          <span
            style={{
              fontSize: '0.62rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontWeight: 700,
              color: light ? 'var(--brand-200)' : 'var(--brand-600)',
            }}
          >
            Life-Saving Network
          </span>
        </span>
      )}
    </span>
  );
}

/* ------------------------------ Headings ------------------------------ */
export function SectionHead({ eyebrow, title, sub, center = false, actions }) {
  return (
    <div className={`section-head${center ? ' center' : ''}`}>
      <div className={center ? '' : 'row-between row-wrap gap-4'} style={center ? undefined : { alignItems: 'flex-end' }}>
        <div>
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h2 className="section-title" style={{ marginTop: eyebrow ? '0.5rem' : 0 }}>{title}</h2>
          {sub && <p className="section-sub">{sub}</p>}
        </div>
        {actions}
      </div>
    </div>
  );
}

export function PageHead({ title, sub, actions }) {
  return (
    <div className="page-head">
      <div>
        <h1 className="page-title">{title}</h1>
        {sub && <p className="page-sub">{sub}</p>}
      </div>
      {actions && <div className="page-head-actions">{actions}</div>}
    </div>
  );
}

/* ------------------------------ Stat card ------------------------------ */
export function StatCard({ label, value, icon, tone = 'brand', foot, loading = false }) {
  const toneClass = tone === 'brand' ? '' : ` ${tone}`;
  return (
    <div className="stat">
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        {icon && <span className={`stat-icon${toneClass}`}>{icon}</span>}
      </div>
      {loading ? (
        <div className="skeleton" style={{ height: 32, width: '55%' }} />
      ) : (
        <div className="stat-value">{value}</div>
      )}
      {foot && <div className="stat-foot">{foot}</div>}
    </div>
  );
}

/* ------------------------------ Status badge ------------------------------ */
const POSITIVE = ['approved', 'verified', 'active', 'completed', 'available', 'fulfilled', 'donated', 'confirmed', 'eligible', 'open'];
const PENDING = ['pending', 'requested', 'scheduled', 'in_progress', 'processing', 'under review', 'waitlisted', 'awaiting'];
const NEGATIVE = ['rejected', 'cancelled', 'canceled', 'revoked', 'inactive', 'expired', 'failed', 'unavailable', 'declined'];

export function statusTone(status) {
  const s = String(status || '').toLowerCase();
  if (POSITIVE.some((k) => s.includes(k))) return 'success';
  if (NEGATIVE.some((k) => s.includes(k))) return 'danger';
  if (PENDING.some((k) => s.includes(k))) return 'warn';
  return 'neutral';
}

export function StatusBadge({ status, label }) {
  const tone = statusTone(status);
  const icon =
    tone === 'success' ? <IconCheckCircle /> :
    tone === 'danger' ? <IconXCircle /> :
    tone === 'warn' ? <IconAlert /> : null;
  const text = label || status || 'Unknown';
  return (
    <span className={`badge badge-${tone}`}>
      {icon}
      {String(text).replace(/_/g, ' ')}
    </span>
  );
}

export function UrgencyBadge({ level }) {
  const s = String(level || '').toLowerCase();
  const tone = s.includes('critical') || s.includes('emergency') ? 'danger'
    : s.includes('urgent') || s.includes('high') ? 'warn'
    : s.includes('routine') || s.includes('low') || s.includes('normal') ? 'info'
    : 'neutral';
  return <span className={`badge badge-${tone}`}>{level || 'Standard'}</span>;
}

export function BloodGroup({ group }) {
  if (!group) return <span className="muted">—</span>;
  return <span className="bgroup">{group}</span>;
}

/* ------------------------------ Alert ------------------------------ */
export function Alert({ tone = 'info', title, children, icon, className = '' }) {
  const map = {
    error: <IconXCircle />, success: <IconCheckCircle />,
    warning: <IconAlert />, info: <IconInfo />,
  };
  return (
    <div className={`alert alert-${tone} ${className}`} role={tone === 'error' ? 'alert' : 'status'}>
      {icon || map[tone]}
      <div>
        {title && <div className="alert-title">{title}</div>}
        {children && <div>{children}</div>}
      </div>
    </div>
  );
}

/* ------------------------------ Loading / empty ------------------------------ */
export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="loading-block" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function SkeletonRows({ rows = 5 }) {
  return (
    <div style={{ padding: '1rem' }} aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton skeleton-line" style={{ width: `${90 - i * 6}%` }} />
      ))}
    </div>
  );
}

export function EmptyState({ title = 'Nothing here yet', message, action, icon }) {
  return (
    <div className="empty">
      <span className="empty-icon">{icon || <IconDroplet />}</span>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action}
    </div>
  );
}

/* ------------------------------ Modal ------------------------------ */
export function Modal({ open, onClose, title, children, footer, labelledBy = 'cb-modal-title' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
        <div className="modal-header">
          <h3 id={labelledBy} style={{ fontSize: 'var(--text-lg)' }}>{title}</h3>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

/* ------------------------------ Link-ish row ------------------------------ */
export function ArrowHint({ children }) {
  return (
    <span className="row gap-2 text-brand" style={{ fontWeight: 600, fontSize: 'var(--text-md)' }}>
      {children}<IconChevronRight />
    </span>
  );
}

/* ------------------------------ Document title ------------------------------ */
export function usePageTitle(title) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} · Cloud Blood Bank` : 'Cloud Blood Bank';
    return () => { document.title = prev; };
  }, [title]);
}
