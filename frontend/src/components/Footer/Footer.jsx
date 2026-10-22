import React from 'react';
import { Link } from 'react-router-dom';
import { Wordmark } from '../ui';
import { IconDroplet, IconShield, IconActivity } from '../icons';
import './Footer.css';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer" role="contentinfo">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Wordmark light />
          <p className="footer-tagline">
            A connected network that helps hospitals, donors and receivers move blood
            safely — from donation to transfusion.
          </p>
          <ul className="footer-values">
            <li><IconShield /> Verified hospitals &amp; donors</li>
            <li><IconActivity /> Live inventory visibility</li>
            <li><IconDroplet /> Real-time emergency requests</li>
          </ul>
        </div>

        <nav className="footer-col" aria-label="Explore">
          <h4>Explore</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/find-blood">Find Blood</Link></li>
            <li><Link to="/camps">Donation Camps</Link></li>
            <li><Link to="/eligibility">Eligibility Check</Link></li>
          </ul>
        </nav>

        <nav className="footer-col" aria-label="Account">
          <h4>Account</h4>
          <ul>
            <li><Link to="/login">Sign in</Link></li>
            <li><Link to="/auth/register">Register as donor</Link></li>
            <li><Link to="/auth/register">Register as hospital</Link></li>
            <li><Link to="/auth/register">Register as receiver</Link></li>
          </ul>
        </nav>

        <div className="footer-col">
          <h4>Commitment</h4>
          <ul className="footer-plain">
            <li>Verified &amp; auditable records</li>
            <li>Role-based access control</li>
            <li>Secure token authentication</li>
            <li>Privacy-conscious by design</li>
          </ul>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>© {year} Cloud Blood Bank. All rights reserved.</span>
        <span className="footer-note">Built for safer, faster blood coordination.</span>
      </div>
    </footer>
  );
};

export default Footer;
