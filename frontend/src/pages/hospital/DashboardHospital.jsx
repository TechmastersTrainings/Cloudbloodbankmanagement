import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import {
  PageHead, StatCard, StatusBadge, UrgencyBadge, BloodGroup, EmptyState,
  SkeletonRows, Alert, Modal, usePageTitle,
} from '../../components/ui';
import {
  IconClipboard, IconCalendar, IconDroplet, IconCheck, IconXCircle,
  IconRefresh, IconArrowRight, IconHospital,
} from '../../components/icons';

const fmtDateTime = (d) => (d ? new Date(d).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');

const DashboardHospital = () => {
  usePageTitle('Hospital overview');
  const [requests, setRequests] = useState([]);
  const [camps, setCamps] = useState([]);
  const [campRequests, setCampRequests] = useState([]);
  const [loading, setLoading] = useState({ req: true, camps: true, creq: true });
  const [notice, setNotice] = useState(null);
  const [target, setTarget] = useState(null); // { kind: 'blood'|'camp', id, action }

  const load = async () => {
    setLoading({ req: true, camps: true, creq: true });
    const jobs = [
      ['req', axiosInstance.get('/api/blood/requests/hospital/').then((r) => setRequests(Array.isArray(r.data) ? r.data : []))],
      ['camps', axiosInstance.get('/api/camps/hospital/').then((r) => setCamps(Array.isArray(r.data) ? r.data : []))],
      ['creq', axiosInstance.get('/api/camps/hospital/camp-requests/').then((r) => setCampRequests(Array.isArray(r.data) ? r.data : []))],
    ];
    await Promise.all(jobs.map(async ([key, p]) => {
      try { await p; } catch (err) { console.error(`hospital ${key} failed`, err); }
      finally { setLoading((s) => ({ ...s, [key]: false })); }
    }));
  };

  useEffect(() => { load(); }, []);

  const metrics = useMemo(() => {
    const pendingBlood = requests.filter((r) => String(r.status).toLowerCase() === 'pending').length;
    const approvedBlood = requests.filter((r) => String(r.status).toLowerCase() === 'approved').length;
    const activeCamps = camps.filter((c) => c.is_approved).length;
    const pendingRegs = campRequests.filter((r) => String(r.status).toLowerCase() === 'pending').length;
    return { pendingBlood, approvedBlood, activeCamps, pendingRegs };
  }, [requests, camps, campRequests]);

  const pendingBlood = requests.filter((r) => String(r.status).toLowerCase() === 'pending');
  const pendingRegs = campRequests.filter((r) => String(r.status).toLowerCase() === 'pending');

  const confirmAction = async () => {
    if (!target) return;
    const { kind, id, action } = target;
    try {
      if (kind === 'blood') {
        await axiosInstance.post(`/api/blood/requests/${id}/action/`, { action });
        setNotice({ tone: 'success', text: `Request ${action === 'approve' ? 'approved — stock deducted' : 'rejected'}.` });
        setLoading((s) => ({ ...s, req: true }));
        await axiosInstance.get('/api/blood/requests/hospital/').then((r) => setRequests(r.data)).catch(() => {});
        setLoading((s) => ({ ...s, req: false }));
      } else {
        const res = await axiosInstance.post(`/api/camps/registration/${id}/action/`, { action });
        setNotice({ tone: 'success', text: res.data?.detail || `Registration ${action}d.` });
        await axiosInstance.get('/api/camps/hospital/camp-requests/').then((r) => setCampRequests(r.data)).catch(() => {});
      }
      setTarget(null);
    } catch (err) {
      console.error(err);
      setNotice({ tone: 'error', text: err.response?.data?.detail || 'Action failed. Please try again.' });
      setTarget(null);
    }
  };

  return (
    <div>
      <PageHead
        title="Hospital overview"
        sub="Your incoming blood requests, donor camp registrations and organised camps."
        actions={
          <>
            <button className="btn btn-secondary btn-sm" onClick={load}><IconRefresh /> Refresh</button>
            <Link to="/hospital/stock" className="btn btn-primary btn-sm"><IconDroplet /> Manage stock</Link>
          </>
        }
      />

      {notice && <Alert tone={notice.tone} className="admin-notice">{notice.text}
        <button className="btn-link" style={{ marginLeft: '0.75rem' }} onClick={() => setNotice(null)}>Dismiss</button>
      </Alert>}

      <div className="stat-grid">
        <StatCard label="Pending blood requests" value={metrics.pendingBlood} icon={<IconClipboard />} tone="warn" loading={loading.req} foot="Awaiting your decision" />
        <StatCard label="Approved requests" value={metrics.approvedBlood} icon={<IconCheck />} tone="success" loading={loading.req} foot="Fulfilled from stock" />
        <StatCard label="Active camps" value={metrics.activeCamps} icon={<IconCalendar />} loading={loading.camps} foot="Approved &amp; live" />
        <StatCard label="Pending registrations" value={metrics.pendingRegs} icon={<IconHospital />} tone="info" loading={loading.creq} foot="Donors to confirm" />
      </div>

      {/* Incoming blood requests */}
      <section className="panel" style={{ marginTop: 'var(--space-6)' }}>
        <div className="card-header">
          <div>
            <h3>Incoming blood requests</h3>
            <p className="muted" style={{ fontSize: 'var(--text-sm)', margin: 0 }}>Approve to deduct units from your stock.</p>
          </div>
          {pendingBlood.length > 0 && <span className="badge badge-warn">{pendingBlood.length} pending</span>}
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading.req ? <SkeletonRows rows={4} /> : requests.length === 0 ? (
            <EmptyState icon={<IconClipboard />} title="No requests yet" message="Blood requests from receivers will appear here." />
          ) : (
            <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr><th>Receiver</th><th>Request</th><th>Urgency</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {requests.map((r) => {
                    const isPending = String(r.status).toLowerCase() === 'pending';
                    return (
                      <tr key={r.id}>
                        <td>
                          <div className="cell-strong">{r.receiver_name || '—'}</div>
                          <div className="muted" style={{ fontSize: 'var(--text-xs)' }}>{fmtDateTime(r.requested_at)}</div>
                        </td>
                        <td>
                          <div className="row gap-2"><BloodGroup group={r.blood_group} /><span>{r.quantity_requested} unit(s)</span></div>
                        </td>
                        <td><UrgencyBadge level={r.urgency_level} /></td>
                        <td><StatusBadge status={r.status} /></td>
                        <td>
                          {isPending ? (
                            <div className="cell-actions">
                              <button className="btn btn-soft btn-sm" onClick={() => setTarget({ kind: 'blood', id: r.id, action: 'approve' })}><IconCheck /> Approve</button>
                              <button className="btn btn-danger-soft btn-sm" onClick={() => setTarget({ kind: 'blood', id: r.id, action: 'reject' })}><IconXCircle /> Reject</button>
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
        </div>
      </section>

      {/* Camp registrations */}
      <section className="panel" style={{ marginTop: 'var(--space-6)' }}>
        <div className="card-header">
          <div>
            <h3>Donor camp registrations</h3>
            <p className="muted" style={{ fontSize: 'var(--text-sm)', margin: 0 }}>Confirm donors attending your camps.</p>
          </div>
          <Link to="/hospital/camp-requests" className="btn-link">View all <IconArrowRight /></Link>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading.creq ? <SkeletonRows rows={3} /> : pendingRegs.length === 0 ? (
            <EmptyState icon={<IconCalendar />} title="No pending registrations" message="Donor registrations for your camps will appear here for confirmation." />
          ) : (
            <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead><tr><th>Donor</th><th>Camp</th><th>Registered</th><th>Action</th></tr></thead>
                <tbody>
                  {pendingRegs.map((r) => (
                    <tr key={r.id}>
                      <td className="cell-strong">{r.donor_name || '—'}</td>
                      <td>{r.camp_name || '—'}</td>
                      <td className="muted">{fmtDateTime(r.registered_at)}</td>
                      <td>
                        <div className="cell-actions">
                          <button className="btn btn-soft btn-sm" onClick={() => setTarget({ kind: 'camp', id: r.id, action: 'approve' })}><IconCheck /> Approve</button>
                          <button className="btn btn-danger-soft btn-sm" onClick={() => setTarget({ kind: 'camp', id: r.id, action: 'reject' })}><IconXCircle /> Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Organized camps */}
      <section className="panel" style={{ marginTop: 'var(--space-6)' }}>
        <div className="card-header">
          <h3>Organised camps</h3>
          <Link to="/hospital/create-camp" className="btn btn-soft btn-sm"><IconCalendar /> New camp</Link>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading.camps ? <SkeletonRows rows={3} /> : camps.length === 0 ? (
            <EmptyState icon={<IconCalendar />} title="No camps organised" message="Create a camp to start collecting donor registrations." action={<Link to="/hospital/create-camp" className="btn btn-primary btn-sm">Create camp</Link>} />
          ) : (
            <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead><tr><th>Camp</th><th>Dates</th><th>Location</th><th>Registrations</th><th>Status</th></tr></thead>
                <tbody>
                  {camps.map((c) => (
                    <tr key={c.id}>
                      <td className="cell-strong">{c.camp_name}</td>
                      <td className="muted nowrap">{c.start_date}{c.end_date && c.end_date !== c.start_date ? ` → ${c.end_date}` : ''}</td>
                      <td>{c.city || '—'}</td>
                      <td>{c.total_registrations ?? 0}</td>
                      <td><StatusBadge status={c.is_approved ? 'approved' : 'pending'} label={c.is_approved ? 'Approved' : 'Pending'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <Modal
        open={!!target}
        onClose={() => setTarget(null)}
        title={target?.action === 'approve' ? 'Confirm approval' : 'Confirm rejection'}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setTarget(null)}>Cancel</button>
            <button className={`btn ${target?.action === 'approve' ? 'btn-primary' : 'btn-danger'}`} onClick={confirmAction}>
              {target?.action === 'approve' ? 'Approve' : 'Reject'}
            </button>
          </>
        }
      >
        <p style={{ margin: 0 }}>
          {target?.kind === 'blood'
            ? target?.action === 'approve'
              ? 'Approve this blood request? The requested units will be deducted from your stock.'
              : 'Reject this blood request?'
            : target?.action === 'approve'
              ? 'Confirm this donor for the camp?'
              : 'Reject this donor registration?'}
        </p>
      </Modal>
    </div>
  );
};

export default DashboardHospital;
