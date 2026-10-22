import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import { Alert } from '../../components/ui';
import { IconCheck, IconArrowRight, IconRefresh, IconMapPin } from '../../components/icons';
import './forms.css';

const EMPTY = {
  email: '', password: '', full_name: '', hospital_name: '', registration_number: '',
  contact_person: '', contact_number: '', address: '', city: '', state: '', pincode: '',
  latitude: '', longitude: '', hospital_type: '', number_of_beds: '',
  blood_storage_capacity_pints: '', operating_hours: '', email_official: '', website: '',
};

const BED_OPTIONS = [20, 50, 100, 150, 200, 300, 400, 500];
const STORAGE_OPTIONS = [50, 100, 150, 200, 250, 300, 350];
const HOURS_OPTIONS = ['8 Hours Shift', '24x7'];
const TYPES = ['Public', 'Private', 'Charity'];

const RegisterHospitalForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [gpsNote, setGpsNote] = useState('');

  const handleChange = (e) => setFormData((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleLocation = () => {
    if (!navigator.geolocation) {
      setGpsNote('Geolocation is not supported. Enter coordinates manually.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((f) => ({ ...f, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
        setGpsNote('Coordinates captured. You can adjust them manually.');
      },
      () => setGpsNote('Could not retrieve location. Please enter coordinates manually.')
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axiosInstance.post('/api/hospital/register/', formData, {
        headers: { 'Content-Type': 'application/json' },
      });
      setDone(true);
    } catch (err) {
      const d = err.response?.data || {};
      let msg = 'Registration failed. Please check the highlighted details.';
      if (typeof d === 'string') msg = d;
      else if (d.detail) msg = d.detail;
      else {
        const k = Object.keys(d)[0];
        if (k) msg = `${k.replace(/_/g, ' ')}: ${Array.isArray(d[k]) ? d[k][0] : d[k]}`;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="reg-form">
        <div className="reg-success" role="status">
          <span className="reg-success-icon"><IconCheck /></span>
          <h3>Hospital registration submitted</h3>
          <p className="muted">Your facility is pending administrator approval. You will be able to sign in once verified.</p>
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
        <h2>Hospital registration</h2>
        <p>Register your facility so it can manage stock and requests on the network.</p>
      </div>

      {error && <Alert tone="error" className="reg-alert">{error}</Alert>}

      <div className="reg-form-body">
        <div className="reg-section">
          <div className="reg-section-title">Account &amp; identity</div>
          <div className="field-row">
            <div className="field reg-full">
              <label className="field-label" htmlFor="h_name">Hospital name <span className="req">*</span></label>
              <input id="h_name" className="input" name="hospital_name" value={formData.hospital_name} onChange={handleChange} required />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="h_email">Email <span className="req">*</span></label>
              <input id="h_email" className="input" type="email" name="email" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="h_password">Password <span className="req">*</span></label>
              <input id="h_password" className="input" type="password" name="password" minLength={6} value={formData.password} onChange={handleChange} required />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="h_admin">Administrator name <span className="req">*</span></label>
              <input id="h_admin" className="input" name="full_name" value={formData.full_name} onChange={handleChange} required />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="h_regno">Registration number <span className="req">*</span></label>
              <input id="h_regno" className="input" name="registration_number" value={formData.registration_number} onChange={handleChange} required />
            </div>
          </div>
        </div>

        <div className="reg-section">
          <div className="reg-section-title">Contact</div>
          <div className="field-row">
            <div className="field">
              <label className="field-label" htmlFor="h_cperson">Contact person</label>
              <input id="h_cperson" className="input" name="contact_person" value={formData.contact_person} onChange={handleChange} />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="h_cnumber">Contact number <span className="req">*</span></label>
              <input id="h_cnumber" className="input" name="contact_number" value={formData.contact_number} onChange={handleChange} required />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="h_emailoff">Official email</label>
              <input id="h_emailoff" className="input" type="email" name="email_official" value={formData.email_official} onChange={handleChange} />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="h_website">Website</label>
              <input id="h_website" className="input" type="url" name="website" value={formData.website} onChange={handleChange} placeholder="https://" />
            </div>
          </div>
        </div>

        <div className="reg-section">
          <div className="reg-section-title">Facility details</div>
          <div className="field-row-3 field-row">
            <div className="field">
              <label className="field-label" htmlFor="h_type">Hospital type <span className="req">*</span></label>
              <select id="h_type" className="select" name="hospital_type" value={formData.hospital_type} onChange={handleChange} required>
                <option value="">Select</option>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field-label" htmlFor="h_beds">Beds <span className="req">*</span></label>
              <select id="h_beds" className="select" name="number_of_beds" value={formData.number_of_beds} onChange={handleChange} required>
                <option value="">Select</option>
                {BED_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field-label" htmlFor="h_storage">Storage capacity (pints) <span className="req">*</span></label>
              <select id="h_storage" className="select" name="blood_storage_capacity_pints" value={formData.blood_storage_capacity_pints} onChange={handleChange} required>
                <option value="">Select</option>
                {STORAGE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field-label" htmlFor="h_hours">Operating hours <span className="req">*</span></label>
              <select id="h_hours" className="select" name="operating_hours" value={formData.operating_hours} onChange={handleChange} required>
                <option value="">Select</option>
                {HOURS_OPTIONS.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="reg-section">
          <div className="reg-section-title">Address &amp; location</div>
          <div className="field-row">
            <div className="field reg-full">
              <label className="field-label" htmlFor="h_addr">Address <span className="req">*</span></label>
              <textarea id="h_addr" className="textarea" name="address" value={formData.address} onChange={handleChange} required />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="h_city">City <span className="req">*</span></label>
              <input id="h_city" className="input" name="city" value={formData.city} onChange={handleChange} required />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="h_state">State <span className="req">*</span></label>
              <input id="h_state" className="input" name="state" value={formData.state} onChange={handleChange} required />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="h_pin">Pincode <span className="req">*</span></label>
              <input id="h_pin" className="input" name="pincode" value={formData.pincode} onChange={handleChange} required />
            </div>
            <div className="loc-row">
              <div className="field" style={{ flex: 1 }}>
                <label className="field-label" htmlFor="h_lat">Latitude</label>
                <input id="h_lat" className="input" type="number" step="any" name="latitude" value={formData.latitude} onChange={handleChange} />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label className="field-label" htmlFor="h_lon">Longitude</label>
                <input id="h_lon" className="input" type="number" step="any" name="longitude" value={formData.longitude} onChange={handleChange} />
              </div>
              <button type="button" className="btn btn-secondary" onClick={handleLocation}><IconMapPin /> Use GPS</button>
            </div>
            {gpsNote && <span className="field-hint">{gpsNote}</span>}
          </div>
        </div>
      </div>

      <div className="reg-actions">
        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
          {loading ? 'Submitting…' : 'Register hospital'}
        </button>
      </div>
    </form>
  );
};

export default RegisterHospitalForm;
