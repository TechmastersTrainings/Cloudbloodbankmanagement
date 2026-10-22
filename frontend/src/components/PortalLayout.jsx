import React, { useState } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { Wordmark, StatusBadge } from './ui';
import { portalHomeFor } from '../utils/portal';
import {
  IconMenu, IconX, IconGrid, IconHospital, IconUsers, IconDroplet, IconCalendar,
  IconClipboard, IconUser, IconLogout, IconChart, IconGlobe, IconSearch, IconBell,
} from './icons';

const NAV = {
  ADMIN: [
    { to: '/admin/dashboard', label: 'Overview', icon: IconGrid },
    { to: '/admin/manage-hospitals', label: 'Hospitals', icon: IconHospital },
    { to: '/admin/manage-donors', label: 'Donors', icon: IconUsers },
    { to: '/admin/manage-receivers', label: 'Receivers', icon: IconUser },
    { to: '/admin/manage-camps', label: 'Camps', icon: IconCalendar },
  ],
  HOSPITAL: [
    { to: '/hospital/dashboard', label: 'Overview', icon: IconGrid },
    { to: '/hospital/stock', label: 'Blood Stock', icon: IconDroplet },
    { to: '/hospital/create-camp', label: 'Camps', icon: IconCalendar },
    { to: '/hospital/camp-requests', label: 'Camp Requests', icon: IconClipboard },
    { to: '/hospital/profile', label: 'Profile', icon: IconHospital },
  ],
  DONOR: [
    { to: '/donor/dashboard', label: 'Overview', icon: IconGrid },
    { to: '/donor/my-camps', label: 'My Camps', icon: IconCalendar },
    { to: '/donor/profile', label: 'Profile', icon: IconUser },
  ],
  RECEIVER: [
    { to: '/receiver/dashboard', label: 'My Requests', icon: IconClipboard },
    { to: '/receiver/profile', label: 'Profile', icon: IconUser },
  ],
};

const PORTAL_TITLES = {
  ADMIN: 'Administrator console',
  HOSPITAL: 'Hospital console',
  DONOR: 'Donor console',
  RECEIVER: 'Receiver console',
};

const PortalLayout = ({ user, onLogout, children }) => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const role = (user?.role || '').toUpperCase();
  const items = NAV[role] || [];
  const home = portalHomeFor(role);
  const closeNav = () => setOpen(false);

  const active = items.find((i) => location.pathname.startsWith(i.to));
  const handleLogout = () => { onLogout?.(); navigate('/login'); };

  return (
    <div className="portal">
      <aside className={`sidebar${open ? ' open' : ''}`} aria-label="Portal navigation">
        <Link to="/" className="sidebar-brand">
          <Wordmark light />
        </Link>

        <nav className="sidebar-nav">
          <div className="sidebar-group-label">{PORTAL_TITLES[role] || 'Console'}</div>
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`sidebar-link${isActive ? ' active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={closeNav}
              >
                <Icon />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          <div className="sidebar-group-label">Shortcuts</div>
          <NavLink to="/find-blood" className="sidebar-link" onClick={closeNav}><IconSearch /> Find Blood</NavLink>
          <NavLink to="/camps" className="sidebar-link" onClick={closeNav}><IconGlobe /> Public Camps</NavLink>
          <NavLink to="/" className="sidebar-link" onClick={closeNav}><IconGlobe /> Public site</NavLink>
        </nav>

        <div className="sidebar-foot">
          <div className="sidebar-user">
            <span className="avatar sm" style={{ background: 'rgba(255,255,255,.16)', color: '#fff' }}>
              {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
            <div style={{ minWidth: 0 }}>
              <div className="name">{user?.full_name || user?.email}</div>
              <div className="role">{user?.role}</div>
            </div>
          </div>
          <button
            className="sidebar-link"
            style={{ marginTop: '0.4rem', width: '100%' }}
            onClick={handleLogout}
          >
            <IconLogout /> <span>Sign out</span>
          </button>
        </div>
      </aside>

      {open && <div className="sidebar-scrim" onClick={() => setOpen(false)} aria-hidden="true" />}

      <div className="portal-body">
        <header className="topbar">
          <div className="row gap-3">
            <button className="icon-button sidebar-toggle" onClick={() => setOpen((v) => !v)} aria-label="Toggle navigation">
              {open ? <IconX /> : <IconMenu />}
            </button>
            <div>
              <div className="topbar-title">{active?.label || 'Overview'}</div>
              <div className="topbar-crumb">{PORTAL_TITLES[role]}</div>
            </div>
          </div>

          <div className="topbar-actions">
            <Link to="/find-blood" className="btn btn-soft btn-sm hide-sm"><IconSearch /> Find blood</Link>
            <Link to={home} className="icon-button hide-sm" aria-label="Notifications"><IconBell /></Link>
            <Link
              to={`/${role.toLowerCase()}/profile`}
              className="row gap-3"
              style={{ textDecoration: 'none' }}
              aria-label="Your profile"
            >
              <span className="avatar sm">{user?.full_name?.charAt(0)?.toUpperCase() || 'U'}</span>
              <span className="stack hide-sm" style={{ lineHeight: 1.15 }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--ink-900)' }}>
                  {user?.full_name || user?.email}
                </span>
                <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--ink-500)' }}>{user?.role}</span>
              </span>
            </Link>
          </div>
        </header>

        <main className="portal-main animate-fade" aria-live="polite">
          {children}
        </main>
      </div>
    </div>
  );
};

export default PortalLayout;
