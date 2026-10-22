import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import { PageHead, StatCard, StatusBadge, UrgencyBadge, BloodGroup, EmptyState, SkeletonRows, Alert, usePageTitle } from '../../components/ui';
import {
  IconHospital, IconUsers, IconUser, IconDroplet, IconClipboard, IconHeart,
  IconAlert, IconChart, IconArrowRight, IconRefresh,
} from '../../components/icons';
import './AdminDashboard.css';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '—');

const AdminDashboard = () => {
  usePageTitle('Admin overview');
  const [overview, setOverview] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [recent, setRecent] = useState({ recent_donations: [], recent_requests: [] });
  const [loading, setLoading] = useState({ overview: true, availability: true, lowStock: true, recent: true });
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    const jobs = [
      ['overview', axiosInstance.get('/api/adminpanel/overview/').then((r) => setOverview(r.data))],
      ['availability', axiosInstance.get('/api/adminpanel/availability/').then((r) => setAvailability(r.data || []))],
      ['lowStock', axiosInstance.get('/api/adminpanel/low-stock/').then((r) => setLowStock(r.data || []))],
      ['recent', axiosInstance.get('/api/adminpanel/recent/').then((r) => setRecent(r.data || { recent_donations: [], recent_requests: [] }))],
    ];
    await Promise.all(jobs.map(async ([key, p]) => {
      try { await p; } catch (err) { console.error(`admin ${key} failed`, err); setError('Some analytics could not be loaded.'); }
      finally { setLoading((s) => ({ ...s, [key]: false })); }
    }));
  };

  useEffect(() => { load(); }, []);

  const maxUnits = Math.max(1, ...availability.map((a) => a.total_units || 0));
  const totalAvailable = availability.reduce((s, a) => s + (a.total_units || 0), 0);

  return (
    <div>
      <PageHead
        title="System overview"
        sub="Live platform metrics drawn from registered accounts, blood stock and request activity."
        actions={<button className="btn btn-secondary btn-sm" onClick={load}><IconRefresh /> Refresh</button>}
      />

      {error && <Alert tone="warning" className="admin-alert">{error}</Alert>}

      <div className="stat-grid">
        <StatCard label="Hospitals" value={overview ? overview.total_hospitals : '—'} icon={<IconHospital />} loading={loading.overview} foot="Facilities on the network" />
        <StatCard label="Donors" value={overview ? overview.total_donors : '—'} icon={<IconHeart />} tone="blood" loading={loading.overview} foot="Registered donors" />
        <StatCard label="Receivers" value={overview ? overview.total_receivers : '—'} icon={<IconUser />} tone="info" loading={loading.overview} foot="Registered receivers" />
        <StatCard label="Blood units" value={overview ? overview.total_blood_units : '—'} icon={<IconDroplet />} tone="success" loading={loading.overview} foot="Total units in stock" />
        <StatCard label="Requests" value={overview ? overview.total_requests : '—'} icon={<IconClipboard />} loading={loading.overview} foot="All-time requests" />
        <StatCard label="Donations" value={overview ? overview.total_donations : '—'} icon={<IconChart />} loading={loading.overview} foot="Recorded donations" />
      </div>

      <div className="admin-grid">
        <section className="panel">
          <div className="card-header">
            <div>
              <h3>Availability by blood group</h3>
              <p className="muted" style={{ fontSize: 'var(--text-sm)', margin: 0 }}>{totalAvailable} units across {availability.length} group{availability.length === 1 ? '' : 's'}</p>
            </div>
            <span className="badge badge-brand"><IconDroplet /> Live stock</span>
          </div>
          <div className="card-body">
            {loading.availability ? (
              <SkeletonRows rows={6} />
            ) : availability.length === 0 ? (
              <EmptyState icon={<IconDroplet />} title="No stock recorded" message="Blood stock will appear here once hospitals add inventory." />
            ) : (
              <ul className="avail-list">
                {availability.map((a) => (
                  <li className="avail-row" key={a.blood_group}>
                    <BloodGroup group={a.blood_group} />
                    <div className="avail-bar">
                      <span style={{ width: `${Math.round(((a.total_units || 0) / maxUnits) * 100)}%` }} />
                    </div>
                    <div className="avail-num">
                      <strong>{a.total_units || 0}</strong>
                      <span>{a.hospitals} hosp.</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="card-header">
            <div>
              <h3>Low-stock alerts</h3>
              <p className="muted" style={{ fontSize: 'var(--text-sm)', margin: 0 }}>Groups at or below 5 units</p>
            </div>
            <span className="badge badge-warn"><IconAlert /> {lowStock.length}</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {loading.lowStock ? (
              <SkeletonRows rows={4} />
            ) : lowStock.length === 0 ? (
              <EmptyState icon={<IconAlert />} title="No low-stock alerts" message="All recorded blood groups currently hold more than 5 units." />
            ) : (
              <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr><th>Hospital</th><th>Group</th><th>Units</th><th>Updated</th></tr>
                  </thead>
                  <tbody>
                    {lowStock.map((a, i) => (
                      <tr key={`${a.hospital}-${a.blood_group}-${i}`}>
                        <td className="cell-strong">{a.hospital}</td>
                        <td><BloodGroup group={a.blood_group} /></td>
                        <td><span className="badge badge-warn">{a.available_units}</span></td>
                        <td className="muted">{fmtDate(a.last_updated)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="admin-grid">
        <section className="panel">
          <div className="card-header">
            <h3>Recent donations</h3>
            <Link to="/admin/manage-donors" className="btn-link">Manage donors <IconArrowRight /></Link>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {loading.recent ? <SkeletonRows rows={4} /> : (recent.recent_donations || []).length === 0 ? (
              <EmptyState icon={<IconHeart />} title="No donations yet" message="Recorded donations will be listed here." />
            ) : (
              <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
                <table className="data-table">
                  <thead><tr><th>Donor</th><th>Hospital</th><th>Group</th><th>Qty</th><th>Date</th><th>Status</th></tr></thead>
                  <tbody>
                    {recent.recent_donations.map((d, i) => (
                      <tr key={i}>
                        <td className="cell-strong">{d.donor}</td>
                        <td>{d.hospital}</td>
                        <td><BloodGroup group={d.blood_group} /></td>
                        <td>{d.quantity}</td>
                        <td className="muted">{fmtDate(d.date)}</td>
                        <td><StatusBadge status={d.verified ? 'verified' : 'pending'} label={d.verified ? 'Verified' : 'Unverified'} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="card-header">
            <h3>Recent requests</h3>
            <Link to="/admin/manage-receivers" className="btn-link">Manage receivers <IconArrowRight /></Link>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {loading.recent ? <SkeletonRows rows={4} /> : (recent.recent_requests || []).length === 0 ? (
              <EmptyState icon={<IconClipboard />} title="No requests yet" message="Blood requests will appear here as receivers raise them." />
            ) : (
              <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
                <table className="data-table">
                  <thead><tr><th>Receiver</th><th>Hospital</th><th>Group</th><th>Qty</th><th>Urgency</th><th>Status</th></tr></thead>
                  <tbody>
                    {recent.recent_requests.map((r, i) => (
                      <tr key={i}>
                        <td className="cell-strong">{r.receiver}</td>
                        <td>{r.hospital}</td>
                        <td><BloodGroup group={r.blood_group} /></td>
                        <td>{r.quantity_requested}</td>
                        <td><UrgencyBadge level={r.urgency} /></td>
                        <td><StatusBadge status={r.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
