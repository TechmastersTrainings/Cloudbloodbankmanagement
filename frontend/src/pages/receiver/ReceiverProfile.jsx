import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axios';
import { PageHead, Alert, StatusBadge, BloodGroup, SkeletonRows, usePageTitle } from '../../components/ui';
import { IconUser, IconEdit, IconCheck, IconX, IconPhone, IconMail, IconMapPin, IconClock } from '../../components/icons';
import './ReceiverProfile.css';

const GENDERS = [['M', 'Male'], ['F', 'Female'], ['O', 'Other']];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const EDITABLE = [
  { name: 'full_name', label: 'Full name' },
  { name: 'contact_phone', label: 'Contact phone', icon: <IconPhone /> },
  { name: 'blood_group', label: 'Blood group needed', type: 'select', options: BLOOD_GROUPS },
  { name: 'gender', label: 'Gender', type: 'select', options: GENDERS },
  { name: 'date_of_birth', label: 'Date of birth', type: 'date' },
  { name: 'urgency_level', label: 'Typical urgency', type: 'select', options: [['Low', 'Low'], ['Medium', 'Medium'], ['High', 'High']] },
  { name: 'hospital_preference', label: 'Hospital preference' },
  { name: 'medical_condition', label: 'Medical condition', full: true, textarea: true },
  { name: 'address', label: 'Address', full: true, textarea: true },
  { name: 'city', label: 'City' },
  { name: 'state', label: 'State' },
  { name: 'pincode', label: 'Pincode' },
];

const ReceiverProfile = () => {
  usePageTitle('Receiver profile');
  const [profile, setProfile] = useState(null);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/api/receiver/profile/');
      setProfile(res.data);
      setDraft(res.data);
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
      const res = await axiosInstance.patch('/api/receiver/profile/', payload);
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
  const renderValue = (f) => {
    const v = value(f);
    if (v === null || v === undefined || v === '') return <span className="muted">Not provided</span>;
    if (f.name === 'blood_group') return <BloodGroup group={v} />;
    if (f.name === 'gender') return GENDERS.find((g) => g[0] === v)?.[1] || v;
    return v;
  };

  return (
    <div>
      <PageHead
        title="Receiver profile"
        sub="Your contact and medical details, used to match your requests with hospitals."
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
          <span className="profile-avatar"><IconUser /></span>
          <h2>{profile.full_name || 'Receiver'}</h2>
          {profile.blood_group && <div style={{ marginTop: 'var(--space-2)' }}><BloodGroup group={profile.blood_group} /></div>}
          <StatusBadge status={profile.is_verified ? 'verified' : 'pending'} label={profile.is_verified ? 'Verified receiver' : 'Awaiting verification'} />
          <div className="profile-aside-meta">
            {profile.email && <span><IconMail /> {profile.email}</span>}
            {profile.contact_phone && <span><IconPhone /> {profile.contact_phone}</span>}
            {(profile.city || profile.state) && <span><IconMapPin /> {[profile.city, profile.state].filter(Boolean).join(', ')}</span>}
            {profile.urgency_level && <span><IconClock /> Typical urgency: {profile.urgency_level}</span>}
          </div>
        </aside>

        <section className="panel">
          <div className="card-header"><h3>Account details</h3></div>
          <div className="card-body">
            <dl className="profile-fields">
              {EDITABLE.map((f) => (
                <div className={`profile-field${f.full ? ' full' : ''}`} key={f.name}>
                  <dt>{f.icon} {f.label}</dt>
                  <dd>
                    {editing ? (
                      f.type === 'select' ? (
                        <select className="select" name={f.name} value={value(f) || ''} onChange={(e) => setDraft((d) => ({ ...d, [f.name]: e.target.value }))}>
                          <option value="">Select…</option>
                          {f.options.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
                        </select>
                      ) : f.textarea ? (
                        <textarea className="textarea" name={f.name} value={value(f) || ''} onChange={(e) => setDraft((d) => ({ ...d, [f.name]: e.target.value }))} />
                      ) : (
                        <input className="input" type={f.type || 'text'} name={f.name} value={value(f) || ''} onChange={(e) => setDraft((d) => ({ ...d, [f.name]: e.target.value }))} />
                      )
                    ) : (
                      renderValue(f)
                    )}
                  </dd>
                </div>
              ))}
            </dl>
            {!editing && (
              <p className="muted" style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-4)' }}>
                Your account email and verification status are managed by an administrator.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ReceiverProfile;
