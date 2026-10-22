import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import { PageHead, EmptyState, Spinner, Alert, StatusBadge, Modal, usePageTitle } from '../../components/ui';
import {
  IconCalendar, IconMapPin, IconHospital, IconUsers, IconSearch, IconCheck,
  IconClock, IconAlert,
} from '../../components/icons';
import './Camps.css';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '');

const Camps = () => {
  usePageTitle('Donation Camps');
  const navigate = useNavigate();
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [user] = useState(() => {
    try {
      const u = localStorage.getItem('current_user');
      return u && u !== 'undefined' ? JSON.parse(u) : null;
    } catch { return null; }
  });
  const [confirmCamp, setConfirmCamp] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/api/camps/');
      setCamps(Array.isArray(res.data) ? res.data : []);
      setError('');
    } catch (err) {
      console.error('Error fetching camps:', err);
      setError('We could not load donation camps right now. Please try again shortly.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return camps;
    return camps.filter((c) =>
      [c.camp_name, c.city, c.state, c.hospital_name, c.address].some((v) => String(v || '').toLowerCase().includes(q))
    );
  }, [camps, query]);

  const requestRegister = (camp) => {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'DONOR') {
      setNotice({ tone: 'warning', text: 'Only donor accounts can register for a donation camp.' });
      return;
    }
    setConfirmCamp(camp);
  };

  const doRegister = async () => {
    if (!confirmCamp) return;
    setBusy(true);
    try {
      await axiosInstance.post(`/api/camps/${confirmCamp.id}/register/`);
      setConfirmCamp(null);
      setNotice({ tone: 'success', text: `You are registered for “${confirmCamp.camp_name}”. Track it under My Camps.` });
      load();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed. You may already be registered.';
      setNotice({ tone: 'warning', text: msg });
      setConfirmCamp(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <PageHead
        title="Blood donation camps"
        sub="Browse upcoming camps published by hospitals. Donors can register in a single step."
        actions={user?.role === 'DONOR' ? <Link to="/donor/my-camps" className="btn btn-secondary">My registrations</Link> : null}
      />

      {notice && (
        <Alert tone={notice.tone} className="camps-notice" >
          {notice.text}
          <button className="btn-link" style={{ marginLeft: '0.75rem' }} onClick={() => setNotice(null)}>Dismiss</button>
        </Alert>
      )}

      <div className="table-toolbar">
        <div className="filter-bar">
          <div className="input-affix" style={{ minWidth: 260 }}>
            <span style={{ position: 'absolute', left: 10, color: 'var(--ink-400)', pointerEvents: 'none' }}><IconSearch /></span>
            <input
              className="input"
              style={{ paddingLeft: '2.1rem' }}
              placeholder="Search by camp, city or hospital"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search camps"
            />
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}>Refresh</button>
      </div>

      {loading ? (
        <Spinner label="Loading camps…" />
      ) : error ? (
        <div className="card"><EmptyState icon={<IconAlert />} title="Unable to load camps" message={error}
          action={<button className="btn btn-primary" onClick={load}>Try again</button>} /></div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<IconCalendar />}
            title={camps.length ? 'No camps match your search' : 'No upcoming camps yet'}
            message={camps.length ? 'Try a different city or hospital name.' : 'Approved camps will appear here as soon as hospitals publish them.'}
          />
        </div>
      ) : (
        <div className="camp-grid">
          {filtered.map((c, i) => (
            <article className={`camp-card card animate-rise rise-${(i % 6) + 1}`} key={c.id}>
              <div className="camp-card-top">
                <span className="camp-date">
                  <IconCalendar />
                  <span>
                    <strong>{fmtDate(c.start_date)}</strong>
                    {c.start_time && <> · {c.start_time}</>}
                  </span>
                </span>
                <StatusBadge status={c.is_approved ? 'approved' : 'pending'} label={c.is_approved ? 'Approved' : 'Awaiting approval'} />
              </div>

              <h3 className="camp-name">{c.camp_name}</h3>
              {c.description && <p className="camp-desc">{c.description}</p>}

              <dl className="camp-meta">
                <div><dt><IconHospital /> Hospital</dt><dd>{c.hospital_name || '—'}</dd></div>
                <div><dt><IconMapPin /> Location</dt><dd>{[c.city, c.state].filter(Boolean).join(', ') || c.address || '—'}</dd></div>
                <div><dt><IconClock /> Runs</dt><dd>{fmtDate(c.start_date)}{c.end_date && c.end_date !== c.start_date ? ` – ${fmtDate(c.end_date)}` : ''}</dd></div>
                <div><dt><IconUsers /> Registered</dt><dd>{c.total_registrations ?? 0}</dd></div>
              </dl>

              <div className="camp-actions">
                <button className="btn btn-primary btn-block" onClick={() => requestRegister(c)}>
                  <IconCheck /> {user?.role === 'DONOR' ? 'Register' : 'Register as donor'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={!!confirmCamp}
        onClose={() => setConfirmCamp(null)}
        title="Confirm camp registration"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setConfirmCamp(null)} disabled={busy}>Cancel</button>
            <button className="btn btn-primary" onClick={doRegister} disabled={busy}>
              {busy ? 'Registering…' : 'Confirm registration'}
            </button>
          </>
        }
      >
        <p style={{ margin: 0 }}>
          Register for <strong>{confirmCamp?.camp_name}</strong>
          {confirmCamp?.hospital_name ? <> at <strong>{confirmCamp.hospital_name}</strong></> : null}?
          You can mark your donation once you have attended.
        </p>
      </Modal>
    </div>
  );
};

export default Camps;
