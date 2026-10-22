import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import {
  PageHead, EmptyState, Spinner, Alert, BloodGroup, Modal, usePageTitle,
} from '../../components/ui';
import { portalHomeFor } from '../../utils/portal';
import {
  IconSearch, IconMapPin, IconDroplet, IconArrowRight, IconRefresh, IconExternal,
  IconHospital, IconAlert, IconPlus, IconCheckCircle, IconLock,
} from '../../components/icons';
import './FindBlood.css';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const URGENCY = ['Low', 'Medium', 'High'];

const readUser = () => {
  try {
    const raw = localStorage.getItem('current_user');
    if (!raw || raw === 'undefined' || raw === 'null') return null;
    const parsed = JSON.parse(raw);
    return parsed?.email ? parsed : null;
  } catch {
    return null;
  }
};

const FindBlood = () => {
  usePageTitle('Find Blood');
  const [bloodGroup, setBloodGroup] = useState('');
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  // Request-to-hospital flow
  const [dialog, setDialog] = useState(null); // { kind: 'guest' } | { kind: 'role', role } | { kind: 'request', hospital }
  const [reqForm, setReqForm] = useState({ quantity_requested: '1', urgency_level: 'Medium' });
  const [reqError, setReqError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [requestNotice, setRequestNotice] = useState(null);

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser. You can still search without it.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setError('Could not access your location. Grant permission or search without distance.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!bloodGroup) {
      setError('Please choose a blood group to search.');
      return;
    }
    setError('');
    setLoading(true);
    setResults(null);
    setRequestNotice(null);
    try {
      const params = { blood_group: bloodGroup };
      if (coords) { params.lat = coords.lat; params.lon = coords.lon; }
      const res = await axiosInstance.get('/api/hospital/find-blood/', { params });
      setResults(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        'We could not complete the search. Please try again in a moment.'
      );
      setResults([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  // Asking a hospital for blood requires a signed-in receiver account.
  const openRequest = (hospital) => {
    const current = readUser();
    setReqError('');
    if (!current) {
      setDialog({ kind: 'guest' });
      return;
    }
    if (String(current.role || '').toUpperCase() !== 'RECEIVER') {
      setDialog({ kind: 'role', role: String(current.role || '').toUpperCase() });
      return;
    }
    setReqForm({ quantity_requested: '1', urgency_level: 'Medium' });
    setDialog({ kind: 'request', hospital });
  };

  const submitRequest = async () => {
    if (dialog?.kind !== 'request') return;
    const { hospital } = dialog;
    setSubmitting(true);
    setReqError('');
    try {
      await axiosInstance.post('/api/blood/request/', {
        hospital: hospital.hospital_id,
        blood_group: hospital.stock_info?.blood_group || bloodGroup,
        quantity_requested: parseInt(reqForm.quantity_requested, 10) || 1,
        urgency_level: reqForm.urgency_level,
      });
      setDialog(null);
      setRequestNotice({
        tone: 'success',
        text: `Request sent to ${hospital.hospital}. Track its status from your receiver dashboard while the hospital reviews it.`,
      });
    } catch (err) {
      const d = err.response?.data;
      const raw = d?.detail || (d && typeof d === 'object'
        ? `${Object.keys(d)[0]}: ${Object.values(d)[0]}`
        : 'Could not send the request. Please try again in a moment.');
      setReqError(Array.isArray(raw) ? raw[0] : String(raw));
    } finally {
      setSubmitting(false);
    }
  };

  const totalUnits = (results || []).reduce((sum, r) => sum + (r.stock_info?.available_units || 0), 0);

  return (
    <div className="page">
      <PageHead
        title="Find blood near you"
        sub="Search verified hospitals holding a specific blood group. Add your location to rank results by distance — and send a request straight from the list."
      />

      <form className="search-card card" onSubmit={handleSearch}>
        <div className="field">
          <span className="field-label">Blood group</span>
          <div className="bgroup-picker" role="radiogroup" aria-label="Blood group">
            {BLOOD_GROUPS.map((g) => (
              <button
                key={g}
                type="button"
                role="radio"
                aria-checked={bloodGroup === g}
                className={`bgroup-chip${bloodGroup === g ? ' selected' : ''}`}
                onClick={() => setBloodGroup(g)}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="search-card-row">
          <button type="button" className="btn btn-secondary" onClick={fetchLocation} disabled={locating}>
            <IconMapPin /> {locating ? 'Locating…' : coords ? 'Update location' : 'Use my location'}
          </button>
          {coords && (
            <span className="loc-pill">
              <IconMapPin /> {coords.lat.toFixed(3)}, {coords.lon.toFixed(3)}
              <button type="button" className="btn-link" onClick={() => setCoords(null)}>Clear</button>
            </span>
          )}
          <button type="submit" className="btn btn-primary" disabled={loading || !bloodGroup}>
            <IconSearch /> {loading ? 'Searching…' : 'Search stock'}
          </button>
        </div>

        {error && <Alert tone="warning" className="search-alert">{error}</Alert>}
      </form>

      <div className="results-region" aria-live="polite">
        {requestNotice && (
          <Alert tone={requestNotice.tone} className="request-notice">{requestNotice.text}</Alert>
        )}

        {loading && <Spinner label="Searching hospitals…" />}

        {!loading && searched && results && results.length === 0 && (
          <div className="card">
            <EmptyState
              icon={<IconDroplet />}
              title={`No ${bloodGroup} units found right now`}
              message="No verified hospital currently reports this blood group in stock. Try another group, or check back shortly."
              action={<button className="btn btn-secondary" onClick={handleSearch}><IconRefresh /> Retry search</button>}
            />
          </div>
        )}

        {!loading && results && results.length > 0 && (
          <>
            <div className="results-summary">
              <div>
                <strong>{results.length}</strong> hospital{results.length > 1 ? 's' : ''} with <BloodGroup group={bloodGroup} />
              </div>
              <div className="count-chip"><IconDroplet /> {totalUnits} units available</div>
            </div>

            <div className="results-list">
              {results.map((r, idx) => {
                const units = r.stock_info?.available_units ?? 0;
                const mapUrl = r.latitude && r.longitude
                  ? `https://www.google.com/maps/search/?api=1&query=${r.latitude},${r.longitude}`
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.address || r.hospital || '')}`;
                const isNearest = idx === 0 && typeof r.distance_km === 'number';
                return (
                  <article className="result-card card" key={`${r.hospital_id}-${r.stock_info?.blood_group}`}>
                    <div className="result-main">
                      <span className="result-icon"><IconHospital /></span>
                      <div className="result-info">
                        <h3>{r.hospital || 'Hospital'}</h3>
                        <p className="result-address"><IconMapPin /> {r.address || 'Address not provided'}</p>
                        <div className="result-meta">
                          {isNearest && (
                            <span className="badge badge-brand"><IconMapPin /> Nearest recommended</span>
                          )}
                          {typeof r.distance_km === 'number' && (
                            <span className="badge badge-info"><IconMapPin /> {r.distance_km} km away</span>
                          )}
                          <span className="badge badge-neutral">{r.stock_info?.blood_group}</span>
                        </div>
                      </div>
                    </div>
                    <div className="result-side">
                      <div className="result-units">
                        <span className="result-units-value">{units}</span>
                        <span className="result-units-label">units</span>
                      </div>
                      <div className="result-actions">
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => openRequest(r)}>
                          <IconPlus /> Request blood
                        </button>
                        <a className="btn btn-secondary btn-sm" href={mapUrl} target="_blank" rel="noopener noreferrer">
                          Directions <IconExternal />
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}

        {!searched && !loading && (
          <div className="search-intro card">
            <span className="role-icon brand"><IconDroplet /></span>
            <div>
              <h3>How availability works</h3>
              <p>
                Results come directly from hospital stock records. A unit is listed only when a
                verified hospital reports the group as available, so what you see reflects the network,
                not an estimate. Adding your location sorts hospitals by real distance.
              </p>
              <div className="row gap-3 row-wrap">
                <Link to="/camps" className="btn btn-soft btn-sm">Join a donation camp <IconArrowRight /></Link>
                <Link to="/eligibility" className="btn btn-ghost btn-sm">Check eligibility</Link>
              </div>
            </div>
          </div>
        )}
      </div>

      <Alert tone="info" className="find-disclaimer">
        <IconAlert />
        <span>
          In a medical emergency, contact the nearest hospital directly. Availability shown here can
          change as hospitals record new units or fulfil requests.
        </span>
      </Alert>

      {/* ---- Request requires a signed-in receiver account ---- */}
      <Modal
        open={dialog?.kind === 'guest'}
        onClose={() => setDialog(null)}
        title="Sign in to request blood"
        labelledBy="fb-guest-title"
        footer={
          <>
            <Link to="/auth/register?role=RECEIVER" className="btn btn-secondary" onClick={() => setDialog(null)}>
              Register as receiver
            </Link>
            <Link to="/login" className="btn btn-primary" onClick={() => setDialog(null)}>
              Sign in <IconArrowRight />
            </Link>
          </>
        }
      >
        <p className="req-lead">
          Anyone can search and see which hospitals list a blood group. Sending a request is
          reserved for signed-in <strong>receiver</strong> accounts, so the hospital knows who to
          respond to.
        </p>
        <ul className="req-list">
          <li><IconLock /> Sign in to your receiver account, or</li>
          <li><IconCheckCircle /> Register as a receiver if you are new — it takes a minute.</li>
        </ul>
      </Modal>

      <Modal
        open={dialog?.kind === 'role'}
        onClose={() => setDialog(null)}
        title="Receiver account required"
        labelledBy="fb-role-title"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setDialog(null)}>Close</button>
            <Link to={portalHomeFor(dialog?.role)} className="btn btn-secondary" onClick={() => setDialog(null)}>
              Go to my dashboard
            </Link>
          </>
        }
      >
        <p className="req-lead">
          You are signed in as a <strong>{dialog?.role}</strong> account. Only <strong>receiver</strong>
          {' '}accounts can raise blood requests. If you need blood, sign in with a receiver account
          (or register one) and try again.
        </p>
      </Modal>

      <Modal
        open={dialog?.kind === 'request'}
        onClose={() => { if (!submitting) setDialog(null); }}
        title="Request blood"
        labelledBy="fb-request-title"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setDialog(null)} disabled={submitting}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={submitRequest} disabled={submitting}>
              <IconPlus /> {submitting ? 'Sending…' : 'Send request'}
            </button>
          </>
        }
      >
        {dialog?.kind === 'request' && dialog.hospital && (
          <div className="req-form">
            <div className="req-target">
              <span className="req-target-icon"><IconHospital /></span>
              <div className="req-target-info">
                <strong>{dialog.hospital.hospital}</strong>
                <span className="muted"><IconMapPin /> {dialog.hospital.address || 'Address not provided'}</span>
              </div>
              <span className="badge badge-neutral">{dialog.hospital.stock_info?.blood_group}</span>
            </div>

            {reqError && <Alert tone="error">{reqError}</Alert>}

            <div className="field">
              <label className="field-label" htmlFor="fb_req_qty">Units needed <span className="req">*</span></label>
              <input
                id="fb_req_qty"
                className="input"
                type="number"
                min="1"
                inputMode="numeric"
                value={reqForm.quantity_requested}
                onChange={(e) => setReqForm((f) => ({ ...f, quantity_requested: e.target.value }))}
              />
              <span className="field-hint">
                {dialog.hospital.stock_info?.available_units ?? 0} units of
                {' '}{dialog.hospital.stock_info?.blood_group} currently listed at this hospital.
              </span>
            </div>

            <div className="field">
              <span className="field-label">Urgency</span>
              <div className="req-urgency" role="radiogroup" aria-label="Urgency level">
                {URGENCY.map((u) => (
                  <button
                    key={u}
                    type="button"
                    role="radio"
                    aria-checked={reqForm.urgency_level === u}
                    className={`${reqForm.urgency_level === u ? 'active' : ''}${u === 'High' ? ' danger' : ''}`}
                    onClick={() => setReqForm((f) => ({ ...f, urgency_level: u }))}
                  >
                    {u}
                  </button>
                ))}
              </div>
              <span className="field-hint">Use High only for genuinely urgent needs — it is highlighted for the hospital.</span>
            </div>

            <Alert tone="info">
              The hospital reviews your request and approves it when stock is available. You can follow
              every status change from your receiver dashboard.
            </Alert>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FindBlood;
