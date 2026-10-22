import React, { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../../api/axios';
import { PageHead, EmptyState, Spinner, Alert, StatusBadge, UrgencyBadge, BloodGroup, Modal, usePageTitle } from '../../../components/ui';
import { IconUser, IconSearch, IconCheck, IconXCircle, IconTrash, IconRefresh, IconMapPin } from '../../../components/icons';
import '../../admin/AdminTables.css';

const ManageReceivers = () => {
  usePageTitle('Manage receivers');
  const [receivers, setReceivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [notice, setNotice] = useState(null);
  const [target, setTarget] = useState(null); // { receiver, type: 'verify' | 'delete' }
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/api/adminpanel/receivers/');
      setReceivers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setNotice({ tone: 'error', text: 'Failed to load receiver data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return receivers
      .filter((r) => (filter === 'all' ? true : filter === 'verified' ? r.is_verified : !r.is_verified))
      .filter((r) => !q || [r.full_name, r.blood_group, r.city, r.contact_phone].some((v) => String(v || '').toLowerCase().includes(q)));
  }, [receivers, query, filter]);

  const run = async () => {
    if (!target) return;
    setBusy(true);
    const { receiver, type } = target;
    try {
      if (type === 'verify') {
        await axiosInstance.patch(`/api/adminpanel/receivers/${receiver.id}/`, {
          is_verified: !receiver.is_verified,
        });
        setNotice({ tone: 'success', text: receiver.is_verified ? 'Receiver unverified.' : 'Receiver verified.' });
      } else {
        await axiosInstance.delete(`/api/adminpanel/receivers/${receiver.id}/`);
        setNotice({ tone: 'success', text: 'Receiver deleted.' });
      }
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
        title="Receivers"
        sub="Verify receiver accounts and manage records raised across the network."
        actions={<button className="btn btn-secondary btn-sm" onClick={load}><IconRefresh /> Refresh</button>}
      />

      {notice && <Alert tone={notice.tone} className="admin-notice">{notice.text}
        <button className="btn-link" style={{ marginLeft: '0.75rem' }} onClick={() => setNotice(null)}>Dismiss</button>
      </Alert>}

      <div className="table-toolbar">
        <div className="search-affix" style={{ minWidth: 280 }}>
          <span className="input-icon"><IconSearch /></span>
          <input className="input" placeholder="Search name, group, city" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search receivers" />
        </div>
        <div className="tabs" role="tablist" aria-label="Filter">
          {[['all', 'All'], ['verified', 'Verified'], ['pending', 'Pending']].map(([v, t]) => (
            <button key={v} role="tab" aria-selected={filter === v} className="tab" onClick={() => setFilter(v)}>{t}</button>
          ))}
        </div>
      </div>

      {loading ? <Spinner label="Loading receivers…" /> : rows.length === 0 ? (
        <div className="card"><EmptyState icon={<IconUser />} title="No receivers found" message="No receiver records match the current view." /></div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Receiver</th><th>Group needed</th><th>Urgency</th><th>Contact</th><th>Location</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div className="row gap-3">
                      <span className="avatar sm">{r.full_name?.charAt(0)?.toUpperCase() || 'R'}</span>
                      <div>
                        <div className="cell-strong">{r.full_name || '—'}</div>
                        <div className="muted" style={{ fontSize: 'var(--text-xs)' }}>{r.gender || ''}</div>
                      </div>
                    </div>
                  </td>
                  <td><BloodGroup group={r.blood_group} /></td>
                  <td>{r.urgency_level ? <UrgencyBadge level={r.urgency_level} /> : <span className="muted">—</span>}</td>
                  <td>{r.contact_phone || '—'}</td>
                  <td><span className="row gap-2" style={{ color: 'var(--ink-600)' }}><IconMapPin /> {r.city || '—'}</span></td>
                  <td><StatusBadge status={r.is_verified ? 'verified' : 'pending'} label={r.is_verified ? 'Verified' : 'Pending'} /></td>
                  <td>
                    <div className="cell-actions">
                      <button
                        className={`btn btn-sm ${r.is_verified ? 'btn-secondary' : 'btn-soft'}`}
                        onClick={() => setTarget({ receiver: r, type: 'verify' })}
                      >
                        {r.is_verified ? <><IconXCircle /> Revoke</> : <><IconCheck /> Verify</>}
                      </button>
                      <button className="btn btn-danger-soft btn-sm" onClick={() => setTarget({ receiver: r, type: 'delete' })} aria-label={`Delete ${r.full_name}`}>
                        <IconTrash />
                      </button>
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
        title={target?.type === 'delete' ? 'Delete receiver' : target?.receiver?.is_verified ? 'Revoke receiver' : 'Verify receiver'}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setTarget(null)} disabled={busy}>Cancel</button>
            <button className={`btn ${target?.type === 'delete' || target?.receiver?.is_verified ? 'btn-danger' : 'btn-primary'}`} onClick={run} disabled={busy}>
              {busy ? 'Working…' : target?.type === 'delete' ? 'Delete permanently' : 'Confirm'}
            </button>
          </>
        }
      >
        <p style={{ margin: 0 }}>
          {target?.type === 'delete'
            ? <>Permanently delete <strong>{target?.receiver?.full_name}</strong>? This cannot be undone.</>
            : target?.receiver?.is_verified
              ? <>Revoke verification for <strong>{target?.receiver?.full_name}</strong>?</>
              : <>Verify <strong>{target?.receiver?.full_name}</strong> as a trusted receiver?</>}
        </p>
      </Modal>
    </div>
  );
};

export default ManageReceivers;
