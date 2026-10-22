import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Alert, Wordmark, usePageTitle } from '../../components/ui';
import { portalHomeFor } from '../../utils/portal';
import { IconMail, IconLock, IconEye, IconEyeOff, IconArrowRight, IconShield, IconCheck } from '../../components/icons';
import './LoginPage.css';

function LoginPage({ onLogin }) {
  usePageTitle('Sign in');
  const navigate = useNavigate();
  const location = useLocation();
  const sessionExpired = new URLSearchParams(location.search).get('sessionExpired');

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setFormData((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(
        'http://127.0.0.1:8000/api/accounts/login/',
        formData,
        { headers: { 'Content-Type': 'application/json' } }
      );
      const { access, refresh, user } = res.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('current_user', JSON.stringify(user));
      if (onLogin) onLogin(user);
      navigate(portalHomeFor(user?.role), { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        'We could not sign you in. Please check your email and password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <aside className="auth-aside" aria-hidden="true">
        <div className="auth-aside-inner">
          <Wordmark light />
          <h1>Welcome back to the network.</h1>
          <p>Sign in to manage blood stock, requests, camps and donations from your role&apos;s console.</p>
          <ul className="auth-points">
            <li><IconShield /> Role-based access control</li>
            <li><IconCheck /> Verified hospital &amp; donor records</li>
            <li><IconCheck /> Live inventory &amp; request tracking</li>
          </ul>
        </div>
      </aside>

      <div className="auth-main">
        <div className="auth-card">
          <header className="auth-head">
            <h2>Sign in</h2>
            <p className="muted">Use the email address linked to your account.</p>
          </header>

          {sessionExpired && (
            <Alert tone="warning">Your session expired. Please sign in again to continue.</Alert>
          )}
          {error && <Alert tone="error">{error}</Alert>}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label className="field-label" htmlFor="email">Email address</label>
              <div className="input-affix">
                <span className="input-icon"><IconMail /></span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input with-icon"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="password">Password</label>
              <div className="input-affix">
                <span className="input-icon"><IconLock /></span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="input with-icon with-trailing"
                  placeholder="Your password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="input-trailing"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
              {loading ? 'Signing in…' : <>Sign in <IconArrowRight /></>}
            </button>
          </form>

          <p className="auth-foot">
            New to Cloud Blood Bank? <Link to="/auth/register">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
