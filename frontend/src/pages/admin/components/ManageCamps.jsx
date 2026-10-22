import React, { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../../api/axios';
import { PageHead, EmptyState, Spinner, Alert, StatusBadge, Modal, usePageTitle } from '../../../components/ui';
import { IconCalendar, IconSearch, IconCheck, IconXCircle, IconRefresh, IconMapPin, IconHospital, IconUsers } from '../../../components/icons';
import '../../admin/AdminTables.css';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

const ManageCamps = () => {
  usePageTitle('Manage camps');
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [notice, setNotice] = useState(null);
  const [target, setTarget] = useState(null); // { camp, action }
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/api/camps/admin/manage/');
      setCamps(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setNotice({ tone: 'error', text: 'Failed to load camp data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return camps
      .filter((c) => (filter === 'all' ? true : filter === 'approved' ? c.is_approved : !c.is_approved))
      .filter((c) => !q || [c.camp_name, c.city, c.state, c.hospital_name].some((v) => String(v || '').toLowerCase().includes(q)));
  }, [camps, query, filter]);

  const confirmAction = async () => {
    if (!target) return;
    setBusy(true);
    try {
      await axiosInstance.post(`/api/camps/admin/${target.camp.id}/verify/`, { action: target.action });
      setNotice({ tone: 'success', text: target.action === 'approve' ? 'Camp approved.' : 'Camp rejected.' });
      setTarget(null);
      load();
    } catch (err) {
      console.error(err);
      setNotice({ tone: 'error', text: 'Action failed. Please try again.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHead
        title="Donation camps"
        sub="Approve or reject hospital-published camps before they go live to donors."
        actions={<button className="btn btn-secondary btn-sm" onClick={load}><IconRefresh /> Refresh</button>}
      />

      {notice && <Alert tone={notice.tone} className="admin-notice">{notice.text}
        <button className="btn-link" style={{ marginLeft: '0.75rem' }} onClick={() => setNotice(null)}>Dismiss</button>
      </Alert>}

      <div className="table-toolbar">
        <div className="search-affix" style={{ minWidth: 280 }}>
          <span className="input-icon"><IconSearch /></span>
          <input className="input" placeholder="Search camp, city or hospital" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search camps" />
        </div>
        <div className="tabs" role="tablist" aria-label="Filter">
          {[['all', 'All'], ['approved', 'Approved'], ['pending', 'Pending']].map(([v, t]) => (
            <button key={v} role="tab" aria-selected={filter === v} className="tab" onClick={() => setFilter(v)}>{t}</button>
          ))}
        </div>
      </div>

      {loading ? <Spinner label="Loading camps…" /> : rows.length === 0 ? (
        <div className="card"><EmptyState icon={<IconCalendar />} title="No camps found" message="No camp records match the current view." /></div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Camp</th><th>Hospital</th><th>Location</th><th>Dates</th><th>Registrations</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td className="cell-strong">{c.camp_name || '—'}</td>
                  <td><span className="row gap-2" style={{ color: 'var(--ink-600)' }}><IconHospital /> {c.hospital_name || '—'}</span></td>
                  <td><span className="row gap-2" style={{ color: 'var(--ink-600)' }}><IconMapPin /> {[c.city, c.state].filter(Boolean).join(', ') || '—'}</span></td>
                  <td className="muted nowrap">{fmtDate(c.start_date)}{c.end_date && c.end_date !== c.start_date ? ` – ${fmtDate(c.end_date)}` : ''}</td>
                  <td><span className="row gap-2"><IconUsers /> {c.total_registrations ?? 0}</span></td>
                  <td><StatusBadge status={c.is_approved ? 'approved' : 'pending'} label={c.is_approved ? 'Approved' : 'Pending'} /></td>
                  <td>
                    <div className="cell-actions">
                      {!c.is_approved ? (
                        <button className="btn btn-soft btn-sm" onClick={() => setTarget({ camp: c, action: 'approve' })}><IconCheck /> Approve</button>
                      ) : (
                        <span className="muted" style={{ fontSize: 'var(--text-sm)' }}>Live</span>
                      )}
                      <button className="btn btn-danger-soft btn-sm" onClick={() => setTarget({ camp: c, action: 'reject' })}><IconXCircle /> Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={!!target}
        onClose={() => setTarget(null)}
        title={target?.action === 'approve' ? 'Approve camp' : 'Reject camp'}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setTarget(null)} disabled={busy}>Cancel</button>
            <button className={`btn ${target?.action === 'approve' ? 'btn-primary' : 'btn-danger'}`} onClick={confirmAction} disabled={busy}>
              {busy ? 'Working…' : target?.action === 'approve' ? 'Approve' : 'Reject'}
            </button>
          </>
        }
      >
        <p style={{ margin: 0 }}>
          {target?.action === 'approve'
            ? <>Publish <strong>{target?.camp?.camp_name}</strong> to donors?</>
            : <>Reject <strong>{target?.camp?.camp_name}</strong>? It will not be visible to donors.</>}
        </p>
      </Modal>
    </div>
  );
};

export default ManageCamps;
