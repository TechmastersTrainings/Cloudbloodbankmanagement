import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import {
  PageHead, StatCard, StatusBadge, BloodGroup, EmptyState, SkeletonRows,
  Alert, Modal, usePageTitle,
} from '../../components/ui';
import {
  IconHeart, IconCalendar, IconDroplet, IconCheck, IconRefresh, IconArrowRight, IconClock,
} from '../../components/icons';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const GAP_DAYS = 90;

const DashboardDonor = () => {
  usePageTitle('Donor overview');
  const [profile, setProfile] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState({ profile: true, regs: true, don: true });
  const [notice, setNotice] = useState(null);
  const [target, setTarget] = useState(null);

  const load = async () => {
    setLoading({ profile: true, regs: true, don: true });
    const jobs = [
      ['profile', axiosInstance.get('/api/donor/profile/').then((r) => setProfile(r.data))],
      ['regs', axiosInstance.get('/api/camps/donor/my-camps/').then((r) => setRegistrations(Array.isArray(r.data) ? r.data : []))],
      ['don', axiosInstance.get('/api/donor/donations/').then((r) => setDonations(Array.isArray(r.data) ? r.data : []))],
    ];
    await Promise.all(jobs.map(async ([key, p]) => {
      try { await p; } catch (err) { console.error(`donor ${key} failed`, err); }
      finally { setLoading((s) => ({ ...s, [key]: false })); }
    }));
  };

  useEffect(() => { load(); }, []);

  const activeRegs = useMemo(
    () => registrations.filter((r) => String(r.status).toLowerCase() !== 'rejected'),
    [registrations]
  );

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

  const nextEligible = useMemo(() => {
    if (!profile?.last_donation_date) return null;
    const d = new Date(profile.last_donation_date);
    if (Number.isNaN(d.getTime())) return null;
    d.setDate(d.getDate() + GAP_DAYS);
    return d;
  }, [profile]);

  return (
    <div>
      <PageHead
        title={`Welcome${profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}`}
        sub="Your donor status, camp participation and donation record."
        actions={<button className="btn btn-secondary btn-sm" onClick={load}><IconRefresh /> Refresh</button>}
      />

      {notice && <Alert tone={notice.tone} className="admin-notice">{notice.text}
        <button className="btn-link" style={{ marginLeft: '0.75rem' }} onClick={() => setNotice(null)}>Dismiss</button>
      </Alert>}

      <div className="stat-grid">
        <StatCard label="Blood group" value={profile?.blood_group || '—'} icon={<IconDroplet />} tone="blood" loading={loading.profile} foot="Your donation type" />
        <StatCard label="Total donations" value={profile?.total_donations ?? 0} icon={<IconHeart />} tone="success" loading={loading.profile} foot="Recorded on the network" />
        <StatCard label="Verified status" value={profile?.is_verified ? 'Verified' : 'Pending'} icon={<IconCheck />} loading={loading.profile} foot={profile?.is_verified ? 'Admin-approved donor' : 'Awaiting admin approval'} />
        <StatCard label="Camp registrations" value={registrations.length} icon={<IconCalendar />} loading={loading.regs} foot="Across all camps" />
      </div>

      {profile && (
        <div className="donor-note card" style={{ marginTop: 'var(--space-6)' }}>
          <span className="stat-icon success"><IconClock /></span>
          <div>
            <h3 style={{ fontSize: 'var(--text-lg)' }}>Donation interval</h3>
            <p style={{ margin: 0 }}>
              {profile.last_donation_date
                ? <>Last donation on <strong>{fmtDate(profile.last_donation_date)}</strong>. A gap of about {GAP_DAYS} days is commonly recommended between whole-blood donations{nextEligible ? <> — next eligible around <strong>{fmtDate(nextEligible)}</strong></> : null}. The donation centre makes the final call.</>
                : <>No donation recorded yet. Register for a camp to make your first donation.</>}
            </p>
          </div>
          <Link to="/camps" className="btn btn-soft btn-sm">Find a camp <IconArrowRight /></Link>
        </div>
      )}

      <section className="panel" style={{ marginTop: 'var(--space-6)' }}>
        <div className="card-header">
          <div>
            <h3>My camp registrations</h3>
            <p className="muted" style={{ fontSize: 'var(--text-sm)', margin: 0 }}>Confirm your donation after attending an approved camp.</p>
          </div>
          <Link to="/donor/my-camps" className="btn-link">View all <IconArrowRight /></Link>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading.regs ? <SkeletonRows rows={3} /> : activeRegs.length === 0 ? (
            <EmptyState icon={<IconCalendar />} title="No camps yet" message="Register for a donation camp and it will appear here." action={<Link to="/camps" className="btn btn-primary btn-sm">Browse camps</Link>} />
          ) : (
            <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead><tr><th>Camp</th><th>Hospital</th><th>Dates</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {activeRegs.map((r) => {
                    const isApproved = String(r.status).toLowerCase() === 'approved';
                    const isDonated = String(r.status).toLowerCase() === 'donated';
                    return (
                      <tr key={r.id}>
                        <td className="cell-strong">{r.camp_name}</td>
                        <td>{r.hospital_name || '—'}{r.city ? <div className="muted" style={{ fontSize: 'var(--text-xs)' }}>{r.city}</div> : null}</td>
                        <td className="muted nowrap">{r.start_date}{r.end_date && r.end_date !== r.start_date ? ` → ${r.end_date}` : ''}</td>
                        <td><StatusBadge status={r.status} /></td>
                        <td>
                          {isApproved ? (
                            <button className="btn btn-soft btn-sm" onClick={() => setTarget(r)}><IconCheck /> Mark donated</button>
                          ) : (
                            <span className="muted" style={{ fontSize: 'var(--text-sm)' }}>{isDonated ? 'Completed' : 'Awaiting approval'}</span>
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

      <section className="panel" style={{ marginTop: 'var(--space-6)' }}>
        <div className="card-header">
          <h3>Donation history</h3>
          <span className="count-chip">{donations.length}</span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading.don ? <SkeletonRows rows={3} /> : donations.length === 0 ? (
            <EmptyState icon={<IconHeart />} title="No donations recorded" message="Verified donations appear here once a hospital records them." />
          ) : (
            <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead><tr><th>Date</th><th>Hospital</th><th>Blood group</th><th>Quantity</th><th>Status</th></tr></thead>
                <tbody>
                  {donations.map((d) => (
                    <tr key={d.id}>
                      <td className="cell-strong nowrap">{fmtDate(d.donation_date)}</td>
                      <td>{d.hospital_name || '—'}</td>
                      <td><BloodGroup group={d.blood_group} /></td>
                      <td>{d.quantity} unit(s)</td>
                      <td><StatusBadge status={d.verified ? 'verified' : 'pending'} label={d.verified ? 'Verified' : 'Unverified'} /></td>
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

export default DashboardDonor;
