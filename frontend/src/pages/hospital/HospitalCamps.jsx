import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import { PageHead, EmptyState, Alert, StatusBadge, SkeletonRows, usePageTitle } from '../../components/ui';
import { IconCalendar, IconPlus, IconMapPin, IconRefresh, IconClock } from '../../components/icons';
import './HospitalCamps.css';

const EMPTY = {
  camp_name: '', description: '', address: '', city: '', state: '', pincode: '',
  start_date: '', end_date: '', start_time: '', end_time: '',
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

const HospitalCamps = () => {
  usePageTitle('Donation camps');
  const [form, setForm] = useState(EMPTY);
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/api/camps/hospital/');
      setCamps(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setNotice({ tone: 'error', text: 'Failed to load camps.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      await axiosInstance.post('/api/camps/hospital/', form);
      setNotice({ tone: 'success', text: 'Camp created. It will appear to donors once approved by an administrator.' });
      setForm(EMPTY);
      load();
    } catch (err) {
      console.error(err);
      const d = err.response?.data;
      const msg = d?.detail || (d && typeof d === 'object' ? `${Object.keys(d)[0]}: ${Object.values(d)[0]}` : 'Failed to create camp.');
      setNotice({ tone: 'error', text: Array.isArray(msg) ? msg[0] : msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHead
        title="Donation camps"
        sub="Publish a camp so donors can register. Camps are visible to donors after admin approval."
        actions={<button className="btn btn-secondary btn-sm" onClick={load}><IconRefresh /> Refresh</button>}
      />

      {notice && <Alert tone={notice.tone} className="camps-alert">{notice.text}
        <button className="btn-link" style={{ marginLeft: '0.75rem' }} onClick={() => setNotice(null)}>Dismiss</button>
      </Alert>}

      <div className="camp-layout">
        <form className="panel camp-form" onSubmit={handleSubmit}>
          <div className="card-header"><h3>Create a camp</h3></div>
          <div className="card-body stack stack-4">
            <div className="field">
              <label className="field-label" htmlFor="c_name">Camp name <span className="req">*</span></label>
              <input id="c_name" className="input" name="camp_name" value={form.camp_name} onChange={handleChange} required />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="c_desc">Description</label>
              <textarea id="c_desc" className="textarea" name="description" value={form.description} onChange={handleChange} />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="c_addr">Address <span className="req">*</span></label>
              <textarea id="c_addr" className="textarea" name="address" value={form.address} onChange={handleChange} required />
            </div>
            <div className="field-row-3 field-row">
              <div className="field">
                <label className="field-label" htmlFor="c_city">City <span className="req">*</span></label>
                <input id="c_city" className="input" name="city" value={form.city} onChange={handleChange} required />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="c_state">State <span className="req">*</span></label>
                <input id="c_state" className="input" name="state" value={form.state} onChange={handleChange} required />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="c_pin">Pincode <span className="req">*</span></label>
                <input id="c_pin" className="input" name="pincode" value={form.pincode} onChange={handleChange} required />
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label className="field-label" htmlFor="c_sdate">Start date <span className="req">*</span></label>
                <input id="c_sdate" className="input" type="date" name="start_date" value={form.start_date} onChange={handleChange} required />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="c_stime">Start time <span className="req">*</span></label>
                <input id="c_stime" className="input" type="time" name="start_time" value={form.start_time} onChange={handleChange} required />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="c_edate">End date <span className="req">*</span></label>
                <input id="c_edate" className="input" type="date" name="end_date" value={form.end_date} onChange={handleChange} required />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="c_etime">End time <span className="req">*</span></label>
                <input id="c_etime" className="input" type="time" name="end_time" value={form.end_time} onChange={handleChange} required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}><IconPlus /> {saving ? 'Creating…' : 'Create camp'}</button>
          </div>
        </form>

        <section className="panel">
          <div className="card-header">
            <h3>Your camps</h3>
            <span className="count-chip">{camps.length}</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {loading ? <SkeletonRows rows={4} /> : camps.length === 0 ? (
              <EmptyState icon={<IconCalendar />} title="No camps organised" message="Camps you create will be listed here with their approval status." />
            ) : (
              <ul className="camp-list">
                {camps.map((c) => (
                  <li className="camp-item" key={c.id}>
                    <div className="camp-item-main">
                      <h4>{c.camp_name}</h4>
                      {c.description && <p>{c.description}</p>}
                      <div className="camp-item-meta">
                        <span><IconMapPin /> {[c.city, c.state].filter(Boolean).join(', ') || c.address || '—'}</span>
                        <span><IconClock /> {fmtDate(c.start_date)}{c.start_time ? ` ${c.start_time}` : ''}{c.end_date ? ` – ${fmtDate(c.end_date)}` : ''}</span>
                      </div>
                    </div>
                    <div className="camp-item-side">
                      <StatusBadge status={c.is_approved ? 'approved' : 'pending'} label={c.is_approved ? 'Approved' : 'Pending'} />
                      <span className="count-chip">{c.total_registrations ?? 0} registered</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="card-footer">
            <Link to="/hospital/camp-requests" className="btn-link">Manage donor registrations</Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HospitalCamps;
