import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axios';
import { PageHead, Alert, StatusBadge, BloodGroup, SkeletonRows, usePageTitle } from '../../components/ui';
import { IconEdit, IconCheck, IconX, IconDroplet, IconPhone, IconHeart } from '../../components/icons';
import './DonorProfile.css';

const EDITABLE = [
  { name: 'full_name', label: 'Full name' },
  { name: 'contact_phone', label: 'Contact phone', icon: <IconPhone /> },
  { name: 'alternate_phone', label: 'Alternate phone', icon: <IconPhone /> },
  { name: 'weight_kg', label: 'Weight (kg)', type: 'number' },
  { name: 'height_cm', label: 'Height (cm)', type: 'number' },
  { name: 'address', label: 'Address', full: true, textarea: true },
  { name: 'city', label: 'City' },
  { name: 'state', label: 'State' },
  { name: 'pincode', label: 'Pincode' },
  { name: 'medical_history', label: 'Medical history', full: true, textarea: true },
  { name: 'allergies', label: 'Allergies', full: true, textarea: true },
  { name: 'recent_illnesses', label: 'Recent illnesses', full: true, textarea: true },
  { name: 'lifestyle', label: 'Lifestyle notes', full: true, textarea: true },
];

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

const DonorProfile = () => {
  usePageTitle('Donor profile');
  const [profile, setProfile] = useState(null);
  const [draft, setDraft] = useState(null);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [p, d] = await Promise.all([
        axiosInstance.get('/api/donor/profile/'),
        axiosInstance.get('/api/donor/donations/').catch(() => ({ data: [] })),
      ]);
      setProfile(p.data);
      setDraft(p.data);
      setDonations(Array.isArray(d.data) ? d.data : []);
    } catch (err) {
      console.error(err);
      setNotice({ tone: 'error', text: 'Failed to load your profile.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    setNotice(null);
    const payload = {};
    EDITABLE.forEach((f) => { payload[f.name] = draft[f.name]; });
    try {
      const res = await axiosInstance.patch('/api/donor/profile/', payload);
      setProfile(res.data);
      setDraft(res.data);
      setEditing(false);
      setNotice({ tone: 'success', text: 'Profile updated successfully.' });
    } catch (err) {
      console.error(err);
      const d = err.response?.data;
      const msg = d?.detail || (d && typeof d === 'object' ? `${Object.keys(d)[0]}: ${Object.values(d)[0]}` : 'Failed to update profile.');
      setNotice({ tone: 'error', text: Array.isArray(msg) ? msg[0] : msg });
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => { setDraft(profile); setEditing(false); setNotice(null); };

  if (loading) return <SkeletonRows rows={8} />;
  if (!profile) return <div className="card"><div className="card-body">Profile is unavailable.</div></div>;

  const value = (f) => (editing ? draft?.[f.name] ?? '' : profile?.[f.name]);

  return (
    <div>
      <PageHead
        title="Donor profile"
        sub="Keep your details current so hospitals can match and contact you."
        actions={
          editing ? (
            <>
              <button className="btn btn-ghost" onClick={cancel} disabled={saving}><IconX /> Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}><IconCheck /> {saving ? 'Saving…' : 'Save changes'}</button>
            </>
          ) : (
            <button className="btn btn-secondary" onClick={() => setEditing(true)}><IconEdit /> Edit profile</button>
          )
        }
      />

      {notice && <Alert tone={notice.tone} className="profile-alert">{notice.text}
        <button className="btn-link" style={{ marginLeft: '0.75rem' }} onClick={() => setNotice(null)}>Dismiss</button>
      </Alert>}

      <div className="profile-layout">
        <aside className="profile-aside card">
          <span className="avatar lg blood">{profile.full_name?.charAt(0)?.toUpperCase() || 'D'}</span>
          <h2>{profile.full_name || 'Donor'}</h2>
          <div style={{ marginTop: 'var(--space-2)' }}><BloodGroup group={profile.blood_group} /></div>
          <StatusBadge status={profile.is_verified ? 'verified' : 'pending'} label={profile.is_verified ? 'Verified donor' : 'Awaiting verification'} />
          <div className="profile-aside-meta">
            <span><IconHeart /> {profile.total_donations ?? 0} total donations</span>
            <span><IconDroplet /> Age {profile.age ?? '—'}</span>
            <span><IconCheck /> Last donation: {fmtDate(profile.last_donation_date)}</span>
          </div>
        </aside>

        <div>
          <section className="panel">
            <div className="card-header"><h3>Personal details</h3></div>
            <div className="card-body">
              <dl className="profile-fields">
                {EDITABLE.map((f) => (
                  <div className={`profile-field${f.full ? ' full' : ''}`} key={f.name}>
                    <dt>{f.label}</dt>
                    <dd>
                      {editing ? (
                        f.textarea ? (
                          <textarea className="textarea" name={f.name} value={value(f) || ''} onChange={(e) => setDraft((d) => ({ ...d, [f.name]: e.target.value }))} />
                        ) : (
                          <input className="input" type={f.type || 'text'} step="0.1" name={f.name} value={value(f) || ''} onChange={(e) => setDraft((d) => ({ ...d, [f.name]: e.target.value }))} />
                        )
                      ) : (
                        value(f) || <span className="muted">Not provided</span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
              {!editing && (
                <p className="muted" style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-4)' }}>
                  Blood group, date of birth and verification status can only be changed by an administrator.
                </p>
              )}
            </div>
          </section>

          <section className="panel" style={{ marginTop: 'var(--space-5)' }}>
            <div className="card-header"><h3>Donation history</h3><span className="count-chip">{donations.length}</span></div>
            <div className="card-body" style={{ padding: 0 }}>
              {donations.length === 0 ? (
                <p className="muted" style={{ padding: 'var(--space-5)', margin: 0 }}>No donations recorded yet.</p>
              ) : (
                <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
                  <table className="data-table">
                    <thead><tr><th>Date</th><th>Hospital</th><th>Group</th><th>Qty</th><th>Status</th></tr></thead>
                    <tbody>
                      {donations.map((d) => (
                        <tr key={d.id}>
                          <td className="cell-strong nowrap">{fmtDate(d.donation_date)}</td>
                          <td>{d.hospital_name || '—'}</td>
                          <td><BloodGroup group={d.blood_group} /></td>
                          <td>{d.quantity}</td>
                          <td><StatusBadge status={d.verified ? 'verified' : 'pending'} label={d.verified ? 'Verified' : 'Unverified'} /></td>
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
    </div>
  );
};

export default DonorProfile;
