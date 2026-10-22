import React, { useState } from 'react';
import axiosInstance from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import { Alert } from '../../components/ui';
import { IconCheck, IconArrowRight, IconRefresh } from '../../components/icons';
import './forms.css';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const EMPTY = {
  email: '', password: '', full_name: '', date_of_birth: '', gender: '', blood_group: '',
  weight_kg: '', height_cm: '', contact_phone: '', alternate_phone: '', address: '',
  city: '', state: '', pincode: '', medical_history: '', allergies: '', recent_illnesses: '', lifestyle: '',
};

const RegisterDonorForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setFormData((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const payload = {
      ...formData,
      weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
      height_cm: formData.height_cm ? parseFloat(formData.height_cm) : null,
      alternate_phone: formData.alternate_phone || '',
    };
    try {
      await axiosInstance.post('/api/donor/register/', payload);
      setFormData(EMPTY);
      setDone(true);
    } catch (err) {
      const d = err.response?.data || {};
      let msg = 'Registration failed. Please review your details and try again.';
      if (d.email?.[0]) msg = d.email[0];
      else if (d.error) msg = d.error;
      else if (d.detail) msg = d.detail;
      else if (typeof d === 'object') {
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
          <h3>Donor account created</h3>
          <p className="muted">Your registration is now awaiting admin approval. You can sign in once approved.</p>
          <div className="row gap-3 row-wrap" style={{ marginTop: '0.5rem' }}>
            <button className="btn btn-primary" onClick={() => navigate('/login')}>Go to sign in <IconArrowRight /></button>
            <button className="btn btn-ghost" onClick={() => setDone(false)}><IconRefresh /> Register another</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form className="reg-form" onSubmit={handleSubmit}>
      <div className="reg-form-head">
        <h2>Donor registration</h2>
        <p>Join the network of donors. Fields marked with an asterisk are required.</p>
      </div>

      {error && <Alert tone="error" className="reg-alert">{error}</Alert>}

      <div className="reg-form-body">
        <div className="reg-section">
          <div className="reg-section-title">Account</div>
          <div className="field-row">
            <div className="field reg-full">
              <label className="field-label" htmlFor="d_full_name">Full name <span className="req">*</span></label>
              <input id="d_full_name" className="input" name="full_name" value={formData.full_name} onChange={handleChange} required />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="d_email">Email <span className="req">*</span></label>
              <input id="d_email" className="input" type="email" name="email" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="d_password">Password <span className="req">*</span></label>
              <input id="d_password" className="input" type="password" name="password" minLength={6} value={formData.password} onChange={handleChange} required />
            </div>
          </div>
        </div>

        <div className="reg-section">
          <div className="reg-section-title">Personal details</div>
          <div className="field-row-3 field-row">
            <div className="field">
              <label className="field-label" htmlFor="d_dob">Date of birth <span className="req">*</span></label>
              <input id="d_dob" className="input" type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} required />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="d_gender">Gender <span className="req">*</span></label>
              <select id="d_gender" className="select" name="gender" value={formData.gender} onChange={handleChange} required>
                <option value="">Select</option>
                <option value="M">Male</option><option value="F">Female</option><option value="O">Other</option>
              </select>
            </div>
            <div className="field">
              <label className="field-label" htmlFor="d_bg">Blood group <span className="req">*</span></label>
              <select id="d_bg" className="select" name="blood_group" value={formData.blood_group} onChange={handleChange} required>
                <option value="">Select</option>
                {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="reg-section">
          <div className="reg-section-title">Physical &amp; contact</div>
          <div className="field-row">
            <div className="field">
              <label className="field-label" htmlFor="d_weight">Weight (kg)</label>
              <input id="d_weight" className="input" type="number" step="0.1" name="weight_kg" value={formData.weight_kg} onChange={handleChange} />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="d_height">Height (cm)</label>
              <input id="d_height" className="input" type="number" step="0.1" name="height_cm" value={formData.height_cm} onChange={handleChange} />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="d_phone">Contact phone <span className="req">*</span></label>
              <input id="d_phone" className="input" name="contact_phone" value={formData.contact_phone} onChange={handleChange} required />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="d_alt">Alternate phone</label>
              <input id="d_alt" className="input" name="alternate_phone" value={formData.alternate_phone} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="reg-section">
          <div className="reg-section-title">Address</div>
          <div className="field-row">
            <div className="field reg-full">
              <label className="field-label" htmlFor="d_addr">Full address <span className="req">*</span></label>
              <textarea id="d_addr" className="textarea" name="address" value={formData.address} onChange={handleChange} required />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="d_city">City <span className="req">*</span></label>
              <input id="d_city" className="input" name="city" value={formData.city} onChange={handleChange} required />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="d_state">State <span className="req">*</span></label>
              <input id="d_state" className="input" name="state" value={formData.state} onChange={handleChange} required />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="d_pin">Pincode <span className="req">*</span></label>
              <input id="d_pin" className="input" name="pincode" value={formData.pincode} onChange={handleChange} required />
            </div>
          </div>
        </div>

        <div className="reg-section">
          <div className="reg-section-title">Medical information (optional)</div>
          <div className="field-row">
            <div className="field">
              <label className="field-label" htmlFor="d_hist">Medical history</label>
              <textarea id="d_hist" className="textarea" name="medical_history" value={formData.medical_history} onChange={handleChange} />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="d_allergy">Allergies</label>
              <textarea id="d_allergy" className="textarea" name="allergies" value={formData.allergies} onChange={handleChange} />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="d_ill">Recent illnesses</label>
              <textarea id="d_ill" className="textarea" name="recent_illnesses" value={formData.recent_illnesses} onChange={handleChange} />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="d_life">Lifestyle notes</label>
              <textarea id="d_life" className="textarea" name="lifestyle" value={formData.lifestyle} onChange={handleChange} />
            </div>
          </div>
        </div>
      </div>

      <div className="reg-actions">
        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
          {loading ? 'Submitting…' : 'Register as donor'}
        </button>
      </div>
    </form>
  );
};

export default RegisterDonorForm;
