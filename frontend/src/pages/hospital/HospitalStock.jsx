import React, { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../api/axios';
import { PageHead, EmptyState, Alert, BloodGroup, SkeletonRows, usePageTitle } from '../../components/ui';
import { IconDroplet, IconPlus, IconRefresh, IconAlert, IconCheck } from '../../components/icons';
import './HospitalStock.css';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const LOW_THRESHOLD = 5;

const fmtDateTime = (d) => (d ? new Date(d).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');

const HospitalStock = () => {
  usePageTitle('Blood stock');
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ blood_group: '', quantity: '' });
  const [notice, setNotice] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/api/blood/stock/');
      setStock(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setNotice({ tone: 'error', text: 'Failed to load stock records.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.blood_group || form.quantity === '') {
      setNotice({ tone: 'warning', text: 'Select a blood group and enter a quantity.' });
      return;
    }
    setSaving(true);
    try {
      await axiosInstance.post('/api/blood/stock/', {
        blood_group: form.blood_group,
        quantity: parseInt(form.quantity, 10),
      });
      setNotice({ tone: 'success', text: `${form.blood_group} stock added or updated.` });
      setForm({ blood_group: '', quantity: '' });
      load();
    } catch (err) {
      console.error(err);
      const d = err.response?.data;
      const msg = d?.detail || d?.error || (d && typeof d === 'object' ? Object.values(d)[0] : null);
      setNotice({ tone: 'error', text: Array.isArray(msg) ? msg[0] : (msg || 'Failed to add stock.') });
    } finally {
      setSaving(false);
    }
  };

  const total = useMemo(() => stock.reduce((s, i) => s + (i.quantity || 0), 0), [stock]);
  const covered = stock.filter((s) => (s.quantity || 0) > 0).length;
  const low = stock.filter((s) => (s.quantity || 0) <= LOW_THRESHOLD);
  const maxQty = Math.max(1, ...stock.map((s) => s.quantity || 0));

  return (
    <div>
      <PageHead
        title="Blood stock"
        sub="Record units by blood group. Adding a group that already exists updates its quantity."
        actions={<button className="btn btn-secondary btn-sm" onClick={load}><IconRefresh /> Refresh</button>}
      />

      {notice && <Alert tone={notice.tone} className="stock-alert">{notice.text}
        <button className="btn-link" style={{ marginLeft: '0.75rem' }} onClick={() => setNotice(null)}>Dismiss</button>
      </Alert>}

      <div className="stock-summary">
        <div className="stock-summary-card card card-pad">
          <span className="stat-icon"><IconDroplet /></span>
          <div>
            <div className="stock-summary-value">{total}</div>
            <div className="stock-summary-label">Total units in stock</div>
          </div>
        </div>
        <div className="stock-summary-card card card-pad">
          <span className="stat-icon success"><IconCheck /></span>
          <div>
            <div className="stock-summary-value">{covered} / 8</div>
            <div className="stock-summary-label">Blood groups available</div>
          </div>
        </div>
        <div className="stock-summary-card card card-pad">
          <span className="stat-icon warn"><IconAlert /></span>
          <div>
            <div className="stock-summary-value">{low.length}</div>
            <div className="stock-summary-label">Groups low (≤ {LOW_THRESHOLD} units)</div>
          </div>
        </div>
      </div>

      <div className="stock-grid">
        <section className="panel">
          <div className="card-header"><h3>Add or update stock</h3></div>
          <form className="card-body stack stack-4" onSubmit={handleSubmit}>
            <div className="field">
              <label className="field-label" htmlFor="stock_group">Blood group <span className="req">*</span></label>
              <select id="stock_group" className="select" value={form.blood_group} onChange={(e) => setForm((f) => ({ ...f, blood_group: e.target.value }))}>
                <option value="">Select blood group</option>
                {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field-label" htmlFor="stock_qty">Quantity (units) <span className="req">*</span></label>
              <input id="stock_qty" className="input" type="number" min="0" inputMode="numeric" placeholder="e.g. 12" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} />
              <span className="field-hint">This quantity sets the recorded total for the selected group.</span>
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}><IconPlus /> {saving ? 'Saving…' : 'Add / update stock'}</button>
          </form>
        </section>

        <section className="panel">
          <div className="card-header">
            <h3>Current stock</h3>
            {low.length > 0 && <span className="badge badge-warn"><IconAlert /> {low.length} low</span>}
          </div>
          <div className="card-body">
            {loading ? <SkeletonRows rows={6} /> : stock.length === 0 ? (
              <EmptyState icon={<IconDroplet />} title="No stock recorded" message="Add your first blood group using the form to start tracking availability." />
            ) : (
              <ul className="stock-list">
                {stock
                  .slice()
                  .sort((a, b) => (b.quantity || 0) - (a.quantity || 0))
                  .map((s) => {
                    const qty = s.quantity || 0;
                    const lowRow = qty <= LOW_THRESHOLD;
                    return (
                      <li className="stock-row" key={s.id}>
                        <BloodGroup group={s.blood_group} />
                        <div className="stock-bar">
                          <span className={lowRow ? 'warn' : ''} style={{ width: `${Math.round((qty / maxQty) * 100)}%` }} />
                        </div>
                        <div className="stock-qty">
                          <strong className={lowRow ? 'text-danger' : ''}>{qty}</strong>
                          <span>units</span>
                        </div>
                        <div className="stock-updated muted">{fmtDateTime(s.last_updated)}</div>
                      </li>
                    );
                  })}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default HospitalStock;
