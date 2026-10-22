import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Wordmark, StatusBadge } from '../ui';
import { portalHomeFor } from '../../utils/portal';
import {
  IconMenu, IconX, IconBell, IconChevronDown, IconLogout, IconGrid, IconUser,
} from '../icons';
import './Navbar.css';

const PUBLIC_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/find-blood', label: 'Find Blood' },
  { to: '/camps', label: 'Donation Camps' },
  { to: '/eligibility', label: 'Eligibility' },
];

const Navbar = ({ user, onLogout }) => {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Close the account dropdown when clicking outside it.
  useEffect(() => {
    const onDoc = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const handleLogout = () => { onLogout?.(); setMenuOpen(false); setOpen(false); navigate('/login'); };
  const closeMenus = () => { setMenuOpen(false); setOpen(false); };

  return (
    <header className="site-header">
      <div className="site-header-inner container">
        <Link to="/" className="site-brand" aria-label="Cloud Blood Bank home">
          <Wordmark />
        </Link>

        <nav className="site-nav" aria-label="Primary">
          {PUBLIC_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => `site-nav-link${isActive ? ' active' : ''}`}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="site-actions">
          {user ? (
            <>
              <Link to={portalHomeFor(user.role)} className="btn btn-soft btn-sm hide-sm">
                <IconGrid /> Portal
              </Link>
              <button className="icon-button hide-sm" aria-label="Notifications">
                <IconBell />
              </button>
              <div className="user-menu" ref={menuRef}>
                <button
                  className="user-trigger"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                >
                  <span className="avatar sm">{user.full_name?.charAt(0)?.toUpperCase() || 'U'}</span>
                  <span className="user-trigger-text">
                    <span className="user-trigger-name">{user.full_name || user.email}</span>
                    <span className="user-trigger-role">{user.role}</span>
                  </span>
                  <IconChevronDown />
                </button>
                {menuOpen && (
                  <div className="user-panel" role="menu">
                    <div className="user-panel-head">
                      <span className="avatar">{user.full_name?.charAt(0)?.toUpperCase() || 'U'}</span>
                      <div style={{ minWidth: 0 }}>
                        <div className="user-panel-name">{user.full_name || user.email}</div>
                        <div className="user-panel-email">{user.email}</div>
                        <StatusBadge status={user.role} />
                      </div>
                    </div>
                    <hr className="divider" />
                    <Link to={portalHomeFor(user.role)} className="menu-item" role="menuitem" onClick={closeMenus}>
                      <IconGrid /> Dashboard
                    </Link>
                    <Link to={`/${(user.role || '').toLowerCase()}/profile`} className="menu-item" role="menuitem" onClick={closeMenus}>
                      <IconUser /> Profile
                    </Link>
                    <hr className="divider" />
                    <button className="menu-item danger" onClick={handleLogout} role="menuitem">
                      <IconLogout /> Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Sign in</Link>
              <Link to="/auth/register" className="btn btn-primary btn-sm">Create account</Link>
            </>
          )}

          <button
            className="icon-button site-toggle"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="site-mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <IconX /> : <IconMenu />}
          </button>
        </div>
      </div>

      {open && (
        <div className="site-mobile" id="site-mobile-nav">
          <nav className="container site-mobile-inner" aria-label="Mobile">
            {PUBLIC_LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) => `site-mobile-link${isActive ? ' active' : ''}`}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </NavLink>
            ))}
            {user ? (
              <>
                <Link className="site-mobile-link" to={portalHomeFor(user.role)} onClick={closeMenus}>Go to Portal</Link>
                <Link className="site-mobile-link" to={`/${(user.role || '').toLowerCase()}/profile`} onClick={closeMenus}>My Profile</Link>
                <button className="btn btn-secondary btn-block" onClick={handleLogout} style={{ marginTop: '0.5rem' }}>
                  <IconLogout /> Sign out
                </button>
              </>
            ) : (
              <div className="row gap-3" style={{ marginTop: '0.75rem' }}>
                <Link to="/login" className="btn btn-secondary btn-block" onClick={closeMenus}>Sign in</Link>
                <Link to="/auth/register" className="btn btn-primary btn-block" onClick={closeMenus}>Register</Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
