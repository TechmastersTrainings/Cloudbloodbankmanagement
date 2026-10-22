import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import {
  PageHead, StatCard, StatusBadge, UrgencyBadge, BloodGroup, EmptyState,
  SkeletonRows, Alert, Modal, usePageTitle,
} from '../../components/ui';
import {
  IconClipboard, IconCheck, IconRefresh, IconDroplet,
  IconSearch, IconMapPin, IconPlus, IconArrowRight, IconClock,
} from '../../components/icons';
import './DashboardReceiver.css';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const URGENCY = [['Low', 'Low'], ['Medium', 'Medium'], ['High', 'High']];

const fmtDateTime = (d) => (d ? new Date(d).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');

const DashboardReceiver = () => {
  usePageTitle('Receiver overview');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);

  // New request flow
  const [form, setForm] = useState({ blood_group: '', quantity_requested: '1', urgency_level: 'Medium' });
  const [hospitals, setHospitals] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/api/blood/request/');
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setNotice({ tone: 'error', text: 'Failed to load your requests.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const metrics = useMemo(() => {
    const s = (v) => requests.filter((r) => String(r.status).toLowerCase() === v).length;
    return { total: requests.length, pending: s('pending'), approved: s('approved'), completed: s('completed') };
  }, [requests]);

  const findHospitals = async () => {
    if (!form.blood_group) {
      setNotice({ tone: 'warning', text: 'Choose a blood group to search matching hospitals.' });
      return;
    }
    setSearching(true);
    setSelected(null);
    setHospitals([]);
    try {
      const res = await axiosInstance.get('/api/hospital/find-blood/', { params: { blood_group: form.blood_group } });
      const list = Array.isArray(res.data) ? res.data : [];
      setHospitals(list);
      if (list.length === 0) {
        setNotice({ tone: 'info', text: `No verified hospital currently lists ${form.blood_group} in stock. You can still search another group.` });
      } else {
        setNotice(null);
      }
    } catch (err) {
      console.error(err);
      setNotice({ tone: 'error', text: 'Could not search hospitals right now.' });
    } finally {
      setSearching(false);
    }
  };

  const submitRequest = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await axiosInstance.post('/api/blood/request/', {
        hospital: selected.hospital_id,
        blood_group: form.blood_group,
        quantity_requested: parseInt(form.quantity_requested, 10) || 1,
        urgency_level: form.urgency_level,
      });
      setNotice({ tone: 'success', text: `Request sent to ${selected.hospital}. The hospital will review it and respond.` });
      setConfirmOpen(false);
      setSelected(null);
      setHospitals([]);
      setForm({ blood_group: '', quantity_requested: '1', urgency_level: 'Medium' });
      load();
    } catch (err) {
      console.error(err);
      const d = err.response?.data;
      const msg = d?.detail || (d && typeof d === 'object' ? `${Object.keys(d)[0]}: ${Object.values(d)[0]}` : 'Could not send the request.');
      setNotice({ tone: 'error', text: Array.isArray(msg) ? msg[0] : msg });
      setConfirmOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHead
        title="My blood requests"
        sub="Raise a request against hospitals holding the blood group you need, and track every response."
        actions={<button className="btn btn-secondary btn-sm" onClick={load}><IconRefresh /> Refresh</button>}
      />

      {notice && <Alert tone={notice.tone} className="receiver-alert">{notice.text}
        <button className="btn-link" style={{ marginLeft: '0.75rem' }} onClick={() => setNotice(null)}>Dismiss</button>
      </Alert>}

      <div className="stat-grid">
        <StatCard label="Total requests" value={metrics.total} icon={<IconClipboard />} loading={loading} foot="All time" />
        <StatCard label="Pending" value={metrics.pending} icon={<IconClock />} tone="warn" loading={loading} foot="Awaiting hospital" />
        <StatCard label="Approved" value={metrics.approved} icon={<IconCheck />} tone="success" loading={loading} foot="Ready for collection" />
        <StatCard label="Completed" value={metrics.completed} icon={<IconDroplet />} tone="info" loading={loading} foot="Fulfilled" />
      </div>

      <div className="receiver-layout" style={{ marginTop: 'var(--space-6)' }}>
        {/* New request builder */}
        <section className="panel receiver-builder">
          <div className="card-header">
            <div>
              <h3>New blood request</h3>
              <p className="muted" style={{ fontSize: 'var(--text-sm)', margin: 0 }}>Find a hospital with stock, then send your request.</p>
            </div>
          </div>
          <div className="card-body stack stack-4">
            <div className="field-row">
              <div className="field">
                <label className="field-label" htmlFor="rq_group">Blood group <span className="req">*</span></label>
                <select id="rq_group" className="select" value={form.blood_group} onChange={(e) => { setForm((f) => ({ ...f, blood_group: e.target.value })); setHospitals([]); setSelected(null); }}>
                  <option value="">Select group</option>
                  {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="field-label" htmlFor="rq_qty">Units needed <span className="req">*</span></label>
                <input id="rq_qty" className="input" type="number" min="1" inputMode="numeric" value={form.quantity_requested} onChange={(e) => setForm((f) => ({ ...f, quantity_requested: e.target.value }))} />
              </div>
            </div>
            <div className="field">
              <span className="field-label">Urgency</span>
              <div className="segmented" role="radiogroup" aria-label="Urgency level">
                {URGENCY.map(([v, t]) => (
                  <button type="button" key={v} role="radio" aria-checked={form.urgency_level === v} className={`segmented-item${form.urgency_level === v ? ' active' : ''}${v === 'High' ? ' danger' : ''}`} onClick={() => setForm((f) => ({ ...f, urgency_level: v }))}>{t}</button>
                ))}
              </div>
              <span className="field-hint">Use High only for genuinely urgent needs — it is highlighted for the hospital.</span>
            </div>

            <button type="button" className="btn btn-secondary" onClick={findHospitals} disabled={searching || !form.blood_group}>
              <IconSearch /> {searching ? 'Searching…' : 'Find hospitals with stock'}
            </button>

            {searching ? <SkeletonRows rows={3} /> : hospitals.length > 0 && (
              <div className="hospital-picker">
                <span className="field-label">Select a hospital <span className="req">*</span></span>
                <ul>
                  {hospitals.map((h) => (
                    <li key={h.hospital_id}>
                      <button type="button" className={`hospital-option${selected?.hospital_id === h.hospital_id ? ' selected' : ''}`} onClick={() => setSelected(h)} aria-pressed={selected?.hospital_id === h.hospital_id}>
                        <div>
                          <strong>{h.hospital}</strong>
                          <span className="muted">{h.address}</span>
                        </div>
                        <div className="hospital-option-side">
                          <span className="badge badge-success">{h.stock_info?.available_units} units</span>
                          {h.distance_km != null && <span className="muted"><IconMapPin /> {h.distance_km} km</span>}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button type="button" className="btn btn-primary" disabled={!selected} onClick={() => setConfirmOpen(true)}>
              <IconPlus /> Send request
            </button>
          </div>
        </section>

        {/* Request history */}
        <section className="panel">
          <div className="card-header">
            <h3>Request history</h3>
            <span className="count-chip">{requests.length}</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {loading ? <SkeletonRows rows={5} /> : requests.length === 0 ? (
              <EmptyState icon={<IconClipboard />} title="No requests yet" message="Create your first request using the form — its progress will appear here." />
            ) : (
              <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
                <table className="data-table">
                  <thead><tr><th>Hospital</th><th>Request</th><th>Urgency</th><th>Requested</th><th>Status</th></tr></thead>
                  <tbody>
                    {requests.map((r) => (
                      <tr key={r.id}>
                        <td className="cell-strong">{r.hospital_name || '—'}</td>
                        <td><span className="row gap-2"><BloodGroup group={r.blood_group} /> {r.quantity_requested} unit(s)</span></td>
                        <td><UrgencyBadge level={r.urgency_level} /></td>
                        <td className="muted nowrap">{fmtDateTime(r.requested_at)}</td>
                        <td><StatusBadge status={r.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="card-footer">
            <Link to="/find-blood" className="btn-link">Search blood availability <IconArrowRight /></Link>
          </div>
        </section>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Send blood request"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setConfirmOpen(false)} disabled={submitting}>Cancel</button>
            <button className="btn btn-primary" onClick={submitRequest} disabled={submitting}>{submitting ? 'Sending…' : 'Send request'}</button>
          </>
        }
      >
        <p style={{ margin: 0 }}>
          Request <strong>{form.quantity_requested} unit(s)</strong> of <strong>{form.blood_group}</strong> from <strong>{selected?.hospital}</strong> at <strong>{form.urgency_level}</strong> urgency?
        </p>
      </Modal>
    </div>
  );
};

export default DashboardReceiver;
