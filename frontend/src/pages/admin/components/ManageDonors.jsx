import React, { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../../api/axios';
import { PageHead, EmptyState, Spinner, Alert, StatusBadge, BloodGroup, Modal, usePageTitle } from '../../../components/ui';
import { IconUsers, IconSearch, IconCheck, IconXCircle, IconTrash, IconRefresh, IconMapPin } from '../../../components/icons';
import '../../admin/AdminTables.css';

const ManageDonors = () => {
  usePageTitle('Manage donors');
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [notice, setNotice] = useState(null);
  const [target, setTarget] = useState(null); // { donor, type: 'verify'|'delete' }
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/api/adminpanel/donors/');
      setDonors(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setNotice({ tone: 'error', text: 'Failed to load donor data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return donors
      .filter((d) => (filter === 'all' ? true : filter === 'verified' ? d.is_verified : !d.is_verified))
      .filter((d) => !q || [d.full_name, d.blood_group, d.city, d.contact_phone].some((v) => String(v || '').toLowerCase().includes(q)));
  }, [donors, query, filter]);

  const run = async () => {
    if (!target) return;
    setBusy(true);
    const { donor, type } = target;
    try {
      if (type === 'verify') {
        await axiosInstance.patch(`/api/adminpanel/donor/${donor.id}/verify/`, {
          entity_type: 'donor', id: donor.id, is_verified: !donor.is_verified,
        });
        setNotice({ tone: 'success', text: donor.is_verified ? 'Donor deactivated.' : 'Donor verified.' });
      } else {
        await axiosInstance.delete(`/api/adminpanel/donors/${donor.id}/`);
        setNotice({ tone: 'success', text: 'Donor deleted.' });
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
        title="Donors"
        sub="Verify donor accounts and manage records across the network."
        actions={<button className="btn btn-secondary btn-sm" onClick={load}><IconRefresh /> Refresh</button>}
      />

      {notice && <Alert tone={notice.tone} className="admin-notice">{notice.text}
        <button className="btn-link" style={{ marginLeft: '0.75rem' }} onClick={() => setNotice(null)}>Dismiss</button>
      </Alert>}

      <div className="table-toolbar">
        <div className="search-affix" style={{ minWidth: 280 }}>
          <span className="input-icon"><IconSearch /></span>
          <input className="input" placeholder="Search name, group, city" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search donors" />
        </div>
        <div className="tabs" role="tablist" aria-label="Filter">
          {[['all', 'All'], ['verified', 'Verified'], ['pending', 'Pending']].map(([v, t]) => (
            <button key={v} role="tab" aria-selected={filter === v} className="tab" onClick={() => setFilter(v)}>{t}</button>
          ))}
        </div>
      </div>

      {loading ? <Spinner label="Loading donors…" /> : rows.length === 0 ? (
        <div className="card"><EmptyState icon={<IconUsers />} title="No donors found" message="No donor records match the current view." /></div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Donor</th><th>Group</th><th>Contact</th><th>Location</th><th>Donations</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id}>
                  <td>
                    <div className="row gap-3">
                      <span className="avatar sm blood">{d.full_name?.charAt(0)?.toUpperCase() || 'D'}</span>
                      <div>
                        <div className="cell-strong">{d.full_name || '—'}</div>
                        <div className="muted" style={{ fontSize: 'var(--text-xs)' }}>{d.age ? `${d.age} yrs` : ''}{d.gender ? ` · ${d.gender}` : ''}</div>
                      </div>
                    </div>
                  </td>
                  <td><BloodGroup group={d.blood_group} /></td>
                  <td>{d.contact_phone || '—'}</td>
                  <td><span className="row gap-2" style={{ color: 'var(--ink-600)' }}><IconMapPin /> {d.city || '—'}</span></td>
                  <td>{d.total_donations ?? 0}</td>
                  <td><StatusBadge status={d.is_verified ? 'verified' : 'pending'} label={d.is_verified ? 'Verified' : 'Pending'} /></td>
                  <td>
                    <div className="cell-actions">
                      <button
                        className={`btn btn-sm ${d.is_verified ? 'btn-secondary' : 'btn-soft'}`}
                        onClick={() => setTarget({ donor: d, type: 'verify' })}
                      >
                        {d.is_verified ? <><IconXCircle /> Revoke</> : <><IconCheck /> Verify</>}
                      </button>
                      <button className="btn btn-danger-soft btn-sm" onClick={() => setTarget({ donor: d, type: 'delete' })} aria-label={`Delete ${d.full_name}`}>
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
        title={target?.type === 'delete' ? 'Delete donor' : target?.donor?.is_verified ? 'Revoke donor' : 'Verify donor'}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setTarget(null)} disabled={busy}>Cancel</button>
            <button className={`btn ${target?.type === 'delete' || target?.donor?.is_verified ? 'btn-danger' : 'btn-primary'}`} onClick={run} disabled={busy}>
              {busy ? 'Working…' : target?.type === 'delete' ? 'Delete permanently' : 'Confirm'}
            </button>
          </>
        }
      >
        <p style={{ margin: 0 }}>
          {target?.type === 'delete'
            ? <>Permanently delete <strong>{target?.donor?.full_name}</strong>? This cannot be undone.</>
            : target?.donor?.is_verified
              ? <>Revoke verification for <strong>{target?.donor?.full_name}</strong>? They will no longer appear as a verified donor.</>
              : <>Verify <strong>{target?.donor?.full_name}</strong> as a trusted donor?</>}
        </p>
      </Modal>
    </div>
  );
};

export default ManageDonors;
