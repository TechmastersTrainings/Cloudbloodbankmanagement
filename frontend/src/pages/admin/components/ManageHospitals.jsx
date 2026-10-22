import React, { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../../api/axios';
import { PageHead, EmptyState, Spinner, Alert, StatusBadge, Modal, usePageTitle } from '../../../components/ui';
import { IconHospital, IconSearch, IconCheck, IconXCircle, IconRefresh, IconMapPin } from '../../../components/icons';
import '../../admin/AdminTables.css';

const ManageHospitals = () => {
  usePageTitle('Manage hospitals');
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [notice, setNotice] = useState(null);
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/api/hospital/list/');
      setHospitals(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setNotice({ tone: 'error', text: 'Failed to load hospital data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return hospitals
      .filter((h) => (filter === 'all' ? true : filter === 'verified' ? h.is_verified : !h.is_verified))
      .filter((h) => !q || [h.hospital_name, h.city, h.state, h.email].some((v) => String(v || '').toLowerCase().includes(q)));
  }, [hospitals, query, filter]);

  const confirmAction = async () => {
    if (!target) return;
    setBusy(true);
    try {
      await axiosInstance.post(`/api/hospital/${target.id}/verify/`, { action: target.action });
      setNotice({ tone: 'success', text: target.action === 'approve' ? 'Hospital approved.' : 'Hospital rejected and removed.' });
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
        title="Hospitals"
        sub="Review hospital registrations and approve or reject access to the network."
        actions={<button className="btn btn-secondary btn-sm" onClick={load}><IconRefresh /> Refresh</button>}
      />

      {notice && <Alert tone={notice.tone} className="admin-notice">{notice.text}
        <button className="btn-link" style={{ marginLeft: '0.75rem' }} onClick={() => setNotice(null)}>Dismiss</button>
      </Alert>}

      <div className="table-toolbar">
        <div className="search-affix" style={{ minWidth: 280 }}>
          <span className="input-icon"><IconSearch /></span>
          <input className="input" placeholder="Search hospital, city or email" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search hospitals" />
        </div>
        <div className="tabs" role="tablist" aria-label="Filter">
          {[['all', 'All'], ['verified', 'Verified'], ['pending', 'Pending']].map(([v, t]) => (
            <button key={v} role="tab" aria-selected={filter === v} className="tab" onClick={() => setFilter(v)}>{t}</button>
          ))}
        </div>
      </div>

      {loading ? <Spinner label="Loading hospitals…" /> : rows.length === 0 ? (
        <div className="card"><EmptyState icon={<IconHospital />} title="No hospitals found" message="No hospital records match the current view." /></div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Hospital</th><th>Type</th><th>Location</th><th>Contact</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {rows.map((h) => (
                <tr key={h.id}>
                  <td>
                    <div className="cell-strong">{h.hospital_name || '—'}</div>
                    <div className="muted" style={{ fontSize: 'var(--text-xs)' }}>{h.email || h.email_official || ''}</div>
                  </td>
                  <td>{h.hospital_type || <span className="muted">—</span>}</td>
                  <td>
                    <span className="row gap-2" style={{ color: 'var(--ink-600)' }}>
                      <IconMapPin /> {[h.city, h.state].filter(Boolean).join(', ') || '—'}
                    </span>
                  </td>
                  <td>{h.contact_number || h.contact_person || '—'}</td>
                  <td><StatusBadge status={h.is_verified ? 'verified' : 'pending'} label={h.is_verified ? 'Verified' : 'Pending'} /></td>
                  <td>
                    <div className="cell-actions">
                      {!h.is_verified ? (
                        <button className="btn btn-soft btn-sm" onClick={() => setTarget({ ...h, action: 'approve' })}><IconCheck /> Approve</button>
                      ) : (
                        <span className="muted" style={{ fontSize: 'var(--text-sm)' }}>Active</span>
                      )}
                      <button className="btn btn-danger-soft btn-sm" onClick={() => setTarget({ ...h, action: 'reject' })}><IconXCircle /> Reject</button>
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
        title={target?.action === 'approve' ? 'Approve hospital' : 'Reject hospital'}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setTarget(null)} disabled={busy}>Cancel</button>
            <button className={`btn ${target?.action === 'approve' ? 'btn-primary' : 'btn-danger'}`} onClick={confirmAction} disabled={busy}>
              {busy ? 'Working…' : target?.action === 'approve' ? 'Approve' : 'Reject & remove'}
            </button>
          </>
        }
      >
        <p style={{ margin: 0 }}>
          {target?.action === 'approve'
            ? <>Approve <strong>{target?.hospital_name}</strong> so it can manage stock and requests?</>
            : <>Reject <strong>{target?.hospital_name}</strong>? This removes the hospital registration permanently.</>}
        </p>
      </Modal>
    </div>
  );
};

export default ManageHospitals;
