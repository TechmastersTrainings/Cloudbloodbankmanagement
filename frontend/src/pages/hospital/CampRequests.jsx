import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import { PageHead, EmptyState, StatusBadge, SkeletonRows, Alert, Modal, usePageTitle } from '../../components/ui';
import { IconClipboard, IconCheck, IconXCircle, IconRefresh, IconArrowRight } from '../../components/icons';

const fmtDateTime = (d) => (d ? new Date(d).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');

const CampRequests = () => {
  usePageTitle('Camp registrations');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [notice, setNotice] = useState(null);
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/api/camps/hospital/camp-requests/');
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setNotice({ tone: 'error', text: 'Failed to load camp registrations.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const rows = useMemo(() => {
    if (filter === 'all') return requests;
    return requests.filter((r) => String(r.status).toLowerCase() === filter);
  }, [requests, filter]);

  const confirmAction = async () => {
    if (!target) return;
    setBusy(true);
    try {
      const res = await axiosInstance.post(`/api/camps/registration/${target.id}/action/`, { action: target.action });
      setNotice({ tone: 'success', text: res.data?.detail || `Registration ${target.action}d.` });
      setTarget(null);
      load();
    } catch (err) {
      console.error(err);
      setNotice({ tone: 'error', text: err.response?.data?.detail || 'Failed to update registration.' });
      setTarget(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHead
        title="Camp registrations"
        sub="Confirm the donors who signed up for your donation camps."
        actions={<button className="btn btn-secondary btn-sm" onClick={load}><IconRefresh /> Refresh</button>}
      />

      {notice && <Alert tone={notice.tone} className="admin-notice">{notice.text}
        <button className="btn-link" style={{ marginLeft: '0.75rem' }} onClick={() => setNotice(null)}>Dismiss</button>
      </Alert>}

      <div className="table-toolbar">
        <div className="tabs" role="tablist" aria-label="Filter registrations">
          {[['all', 'All'], ['pending', 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected']].map(([v, t]) => (
            <button key={v} role="tab" aria-selected={filter === v} className="tab" onClick={() => setFilter(v)}>{t}</button>
          ))}
        </div>
        <Link to="/hospital/create-camp" className="btn-link">Manage camps <IconArrowRight /></Link>
      </div>

      {loading ? <SkeletonRows rows={5} /> : rows.length === 0 ? (
        <div className="card"><EmptyState icon={<IconClipboard />} title="No registrations" message="Donor registrations for your camps will appear here." /></div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Donor</th><th>Camp</th><th>Registered</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {rows.map((r) => {
                const isPending = String(r.status).toLowerCase() === 'pending';
                return (
                  <tr key={r.id}>
                    <td className="cell-strong">{r.donor_name || '—'}</td>
                    <td>{r.camp_name || '—'}</td>
                    <td className="muted">{fmtDateTime(r.registered_at)}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td>
                      {isPending ? (
                        <div className="cell-actions">
                          <button className="btn btn-soft btn-sm" onClick={() => setTarget({ ...r, action: 'approve' })}><IconCheck /> Approve</button>
                          <button className="btn btn-danger-soft btn-sm" onClick={() => setTarget({ ...r, action: 'reject' })}><IconXCircle /> Reject</button>
                        </div>
                      ) : (
                        <span className="muted" style={{ fontSize: 'var(--text-sm)' }}>Processed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={!!target}
        onClose={() => setTarget(null)}
        title={target?.action === 'approve' ? 'Confirm registration' : 'Reject registration'}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setTarget(null)} disabled={busy}>Cancel</button>
            <button className={`btn ${target?.action === 'approve' ? 'btn-primary' : 'btn-danger'}`} onClick={confirmAction} disabled={busy}>
              {busy ? 'Working…' : target?.action === 'approve' ? 'Confirm' : 'Reject'}
            </button>
          </>
        }
      >
        <p style={{ margin: 0 }}>
          {target?.action === 'approve'
            ? <>Confirm <strong>{target?.donor_name}</strong> for <strong>{target?.camp_name}</strong>?</>
            : <>Reject <strong>{target?.donor_name}</strong> for <strong>{target?.camp_name}</strong>?</>}
        </p>
      </Modal>
    </div>
  );
};

export default CampRequests;
