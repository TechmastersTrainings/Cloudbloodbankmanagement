import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import { PageHead, EmptyState, StatusBadge, SkeletonRows, Alert, Modal, usePageTitle } from '../../components/ui';
import { IconCalendar, IconCheck, IconRefresh, IconArrowRight } from '../../components/icons';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

const MyCamps = () => {
  usePageTitle('My camps');
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [notice, setNotice] = useState(null);
  const [target, setTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/api/camps/donor/my-camps/');
      setRegistrations(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setNotice({ tone: 'error', text: 'Failed to load your camp registrations.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const rows = useMemo(() => {
    if (filter === 'all') return registrations;
    return registrations.filter((r) => String(r.status).toLowerCase() === filter);
  }, [registrations, filter]);

  const markDonated = async () => {
    if (!target) return;
    try {
      await axiosInstance.post(`/api/camps/donor/mark-donation/${target.id}/`);
      setNotice({ tone: 'success', text: `Donation confirmed for ${target.camp_name}.` });
      setTarget(null);
      load();
    } catch (err) {
      console.error(err);
      setNotice({ tone: 'error', text: err.response?.data?.detail || 'Could not update status.' });
      setTarget(null);
    }
  };

  return (
    <div>
      <PageHead
        title="My camp registrations"
        sub="Track the camps you signed up for and confirm your donations."
        actions={
          <>
            <button className="btn btn-secondary btn-sm" onClick={load}><IconRefresh /> Refresh</button>
            <Link to="/camps" className="btn btn-primary btn-sm"><IconCalendar /> Browse camps</Link>
          </>
        }
      />

      {notice && <Alert tone={notice.tone} className="admin-notice">{notice.text}
        <button className="btn-link" style={{ marginLeft: '0.75rem' }} onClick={() => setNotice(null)}>Dismiss</button>
      </Alert>}

      <div className="table-toolbar">
        <div className="tabs" role="tablist" aria-label="Filter registrations">
          {[['all', 'All'], ['pending', 'Pending'], ['approved', 'Approved'], ['donated', 'Donated'], ['rejected', 'Rejected']].map(([v, t]) => (
            <button key={v} role="tab" aria-selected={filter === v} className="tab" onClick={() => setFilter(v)}>{t}</button>
          ))}
        </div>
        <Link to="/donor/dashboard" className="btn-link">Donor overview <IconArrowRight /></Link>
      </div>

      {loading ? <SkeletonRows rows={5} /> : rows.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<IconCalendar />}
            title={registrations.length ? 'No registrations in this view' : 'No camp registrations yet'}
            message={registrations.length ? 'Try another filter.' : 'Register for a donation camp to see it listed here.'}
            action={!registrations.length ? <Link to="/camps" className="btn btn-primary btn-sm">Browse camps</Link> : null}
          />
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Camp</th><th>Hospital</th><th>Location</th><th>Dates</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {rows.map((r) => {
                const isApproved = String(r.status).toLowerCase() === 'approved';
                return (
                  <tr key={r.id}>
                    <td className="cell-strong">{r.camp_name}</td>
                    <td>{r.hospital_name || '—'}</td>
                    <td>{r.city || '—'}</td>
                    <td className="muted nowrap">{fmtDate(r.start_date)}{r.end_date && r.end_date !== r.start_date ? ` → ${fmtDate(r.end_date)}` : ''}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td>
                      {isApproved ? (
                        <button className="btn btn-soft btn-sm" onClick={() => setTarget(r)}><IconCheck /> Mark donated</button>
                      ) : (
                        <span className="muted" style={{ fontSize: 'var(--text-sm)' }}>—</span>
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
        title="Confirm donation"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setTarget(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={markDonated}>Confirm donation</button>
          </>
        }
      >
        <p style={{ margin: 0 }}>Confirm that you have donated at <strong>{target?.camp_name}</strong>{target?.hospital_name ? ` (${target.hospital_name})` : ''}.</p>
      </Modal>
    </div>
  );
};

export default MyCamps;
