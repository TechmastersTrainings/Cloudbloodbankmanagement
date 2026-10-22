import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import { Alert } from '../../components/ui';
import { IconCheck, IconArrowRight, IconRefresh } from '../../components/icons';
import './forms.css';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const URGENCY = [
  { v: 'LOW', t: 'Routine' },
  { v: 'MEDIUM', t: 'Moderate' },
  { v: 'HIGH', t: 'Urgent' },
  { v: 'CRITICAL', t: 'Critical' },
];

const EMPTY = {
  email: '', password: '', full_name: '', date_of_birth: '', gender: '', blood_group: '',
  contact_phone: '', address: '', city: '', state: '', pincode: '',
  medical_condition: '', urgency_level: '', hospital_preference: '', latitude: null, longitude: null,
};

const RegisterReceiverForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [gpsNote, setGpsNote] = useState('');

  const handleChange = (e) => setFormData((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleLocation = () => {
    if (!navigator.geolocation) { setGpsNote('Geolocation is not supported by this browser.'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((f) => ({ ...f, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
        setGpsNote('Location captured.');
      },
      () => setGpsNote('Could not retrieve location. You can continue without it.')
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (!formData.gender || !formData.blood_group) {
      setError('Please select your gender and the blood group required.');
      setLoading(false);
      return;
    }
    try {
      await axiosInstance.post('/api/receiver/register/', formData);
      setDone(true);
    } catch (err) {
      const d = err.response?.data;
      if (d?.detail) setError(d.detail);
      else if (d && typeof d === 'object') {
        const k = Object.keys(d)[0];
        setError(k ? `${k.replace(/_/g, ' ')}: ${Array.isArray(d[k]) ? d[k][0] : d[k]}` : 'Registration failed.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="reg-form">
        <div className="reg-success" role="status">
          <span className="reg-success-icon"><IconCheck /></span>
          <h3>Receiver account created</h3>
          <p className="muted">You can now sign in to raise and track blood requests.</p>
          <div className="row gap-3 row-wrap" style={{ marginTop: '0.5rem' }}>
            <button className="btn btn-primary" onClick={() => navigate('/login')}>Go to sign in <IconArrowRight /></button>
            <button className="btn btn-ghost" onClick={() => { setDone(false); setFormData(EMPTY); }}><IconRefresh /> Register another</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form className="reg-form" onSubmit={handleSubmit}>
      <div className="reg-form-head">
        <h2>Receiver registration</h2>
        <p>Create an account to request blood and follow the status of each request.</p>
      </div>

      {error && <Alert tone="error" className="reg-alert">{error}</Alert>}

      <div className="reg-form-body">
        <div className="reg-section">
          <div className="reg-section-title">Account</div>
          <div className="field-row">
            <div className="field reg-full">
              <label className="field-label" htmlFor="r_name">Full name <span className="req">*</span></label>
              <input id="r_name" className="input" name="full_name" value={formData.full_name} onChange={handleChange} required />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="r_email">Email <span className="req">*</span></label>
              <input id="r_email" className="input" type="email" name="email" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="r_password">Password <span className="req">*</span></label>
              <input id="r_password" className="input" type="password" name="password" minLength={6} value={formData.password} onChange={handleChange} required />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="r_dob">Date of birth <span className="req">*</span></label>
              <input id="r_dob" className="input" type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} required />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="r_gender">Gender <span className="req">*</span></label>
              <select id="r_gender" className="select" name="gender" value={formData.gender} onChange={handleChange} required>
                <option value="">Select</option>
                <option value="M">Male</option><option value="F">Female</option><option value="O">Other</option>
              </select>
            </div>
            <div className="field">
              <label className="field-label" htmlFor="r_bg">Blood group required <span className="req">*</span></label>
              <select id="r_bg" className="select" name="blood_group" value={formData.blood_group} onChange={handleChange} required>
                <option value="">Select</option>
                {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field-label" htmlFor="r_phone">Phone <span className="req">*</span></label>
              <input id="r_phone" className="input" name="contact_phone" value={formData.contact_phone} onChange={handleChange} required />
            </div>
          </div>
        </div>

        <div className="reg-section">
          <div className="reg-section-title">Medical context</div>
          <div className="field-row">
            <div className="field reg-full">
              <label className="field-label" htmlFor="r_condition">Medical condition</label>
              <textarea id="r_condition" className="textarea" name="medical_condition" value={formData.medical_condition} onChange={handleChange} />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="r_urgency">Typical urgency</label>
              <select id="r_urgency" className="select" name="urgency_level" value={formData.urgency_level} onChange={handleChange}>
                <option value="">Select</option>
                {URGENCY.map((u) => <option key={u.v} value={u.v}>{u.t}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field-label" htmlFor="r_pref">Hospital preference</label>
              <input id="r_pref" className="input" name="hospital_preference" value={formData.hospital_preference} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="reg-section">
          <div className="reg-section-title">Address</div>
          <div className="field-row">
            <div className="field reg-full">
              <label className="field-label" htmlFor="r_addr">Address <span className="req">*</span></label>
              <textarea id="r_addr" className="textarea" name="address" value={formData.address} onChange={handleChange} required />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="r_city">City <span className="req">*</span></label>
              <input id="r_city" className="input" name="city" value={formData.city} onChange={handleChange} required />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="r_state">State <span className="req">*</span></label>
              <input id="r_state" className="input" name="state" value={formData.state} onChange={handleChange} required />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="r_pin">Pincode <span className="req">*</span></label>
              <input id="r_pin" className="input" name="pincode" value={formData.pincode} onChange={handleChange} required />
            </div>
            <div className="field">
              <label className="field-label">Location (optional)</label>
              <div className="row gap-3">
                <button type="button" className="btn btn-secondary" onClick={handleLocation}>Use my location</button>
                {formData.latitude != null && <span className="count-chip">Captured</span>}
              </div>
              {gpsNote && <span className="field-hint">{gpsNote}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="reg-actions">
        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
          {loading ? 'Submitting…' : 'Register as receiver'}
        </button>
      </div>
    </form>
  );
};

export default RegisterReceiverForm;
