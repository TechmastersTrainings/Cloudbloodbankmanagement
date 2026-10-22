import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axios';
import { PageHead, Alert, StatusBadge, SkeletonRows, usePageTitle } from '../../components/ui';
import {
  IconHospital, IconEdit, IconCheck, IconX, IconMapPin, IconMail, IconPhone,
  IconShield,
} from '../../components/icons';
import './HospitalProfile.css';

const EDITABLE = [
  { name: 'contact_person', label: 'Contact person', icon: <IconPhone /> },
  { name: 'contact_number', label: 'Contact number', icon: <IconPhone /> },
  { name: 'email_official', label: 'Official email', icon: <IconMail /> },
  { name: 'operating_hours', label: 'Operating hours' },
  { name: 'hospital_type', label: 'Hospital type' },
  { name: 'number_of_beds', label: 'Number of beds', type: 'number' },
  { name: 'blood_storage_capacity_pints', label: 'Storage capacity (pints)', type: 'number' },
  { name: 'website', label: 'Website', full: true },
  { name: 'address', label: 'Address', full: true, textarea: true },
  { name: 'city', label: 'City' },
  { name: 'state', label: 'State' },
  { name: 'pincode', label: 'Pincode' },
];

const HospitalProfile = () => {
  usePageTitle('Hospital profile');
  const [profile, setProfile] = useState(null);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/api/hospital/profile/');
      setProfile(res.data);
      setDraft(res.data);
    } catch (err) {
      console.error(err);
      setNotice({ tone: 'error', text: 'Failed to load hospital profile.' });
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
      const res = await axiosInstance.patch('/api/hospital/profile/', payload);
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
  if (!profile) return <div className="card"><div className="card-body">Hospital profile is unavailable.</div></div>;

  const value = (f) => (editing ? draft?.[f.name] ?? '' : profile?.[f.name]);

  return (
    <div>
      <PageHead
        title="Hospital profile"
        sub="Your facility details as other participants see them."
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
          <span className="profile-avatar"><IconHospital /></span>
          <h2>{profile.hospital_name || 'Hospital'}</h2>
          <p className="muted">Reg. No. {profile.registration_number || '—'}</p>
          <StatusBadge status={profile.is_verified ? 'verified' : 'pending'} label={profile.is_verified ? 'Verified hospital' : 'Awaiting verification'} />
          <div className="profile-aside-meta">
            <span><IconShield /> {profile.role || 'HOSPITAL'}</span>
            {profile.city && <span><IconMapPin /> {[profile.city, profile.state].filter(Boolean).join(', ')}</span>}
            {profile.contact_number && <span><IconPhone /> {profile.contact_number}</span>}
          </div>
        </aside>

        <section className="panel">
          <div className="card-header"><h3>Facility details</h3></div>
          <div className="card-body">
            <dl className="profile-fields">
              {EDITABLE.map((f) => (
                <div className={`profile-field${f.full ? ' full' : ''}`} key={f.name}>
                  <dt>{f.icon} {f.label}</dt>
                  <dd>
                    {editing ? (
                      f.textarea ? (
                        <textarea className="textarea" name={f.name} value={value(f) || ''} onChange={(e) => setDraft((d) => ({ ...d, [f.name]: e.target.value }))} />
                      ) : (
                        <input className="input" type={f.type || 'text'} name={f.name} value={value(f) || ''} onChange={(e) => setDraft((d) => ({ ...d, [f.name]: e.target.value }))} />
                      )
                    ) : (
                      value(f) || <span className="muted">Not provided</span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HospitalProfile;
