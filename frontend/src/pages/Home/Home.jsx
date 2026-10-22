import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import { SectionHead, StatCard, usePageTitle } from '../../components/ui';
import {
  IconDroplet, IconHospital, IconUsers, IconShield, IconSearch, IconCalendar,
  IconBell, IconChart, IconActivity, IconArrowRight, IconCheck, IconHeart,
  IconClipboard, IconMapPin,
} from '../../components/icons';
import './Home.css';

const CountUp = ({ value = 0 }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!Number.isFinite(value)) return undefined;
    let raf;
    const start = performance.now();
    const dur = 1100;
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(eased * value));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{display.toLocaleString()}</>;
};

const CAPABILITIES = [
  { icon: <IconSearch />, title: 'Find blood nearby', text: 'Search available units by blood group and location, ranked by distance to the hospital holding stock.' },
  { icon: <IconDroplet />, title: 'Live inventory', text: 'Hospitals record every unit added or issued so the network reflects real, current availability.' },
  { icon: <IconBell />, title: 'Emergency requests', text: 'Receivers raise requests with an urgency level; hospitals approve, reject and fulfil them in one flow.' },
  { icon: <IconCalendar />, title: 'Donation camps', text: 'Hospitals publish camps, donors register, and attendance is tracked through to donation.' },
  { icon: <IconChart />, title: 'Operational insight', text: 'Administrators monitor stock, trends and low-stock alerts from real platform activity.' },
  { icon: <IconShield />, title: 'Verified & secure', text: 'Role-based access, verified hospitals and donors, and token-based authentication throughout.' },
];

const ROLES = [
  {
    key: 'DONOR', icon: <IconHeart />, title: 'For donors',
    points: ['Register and track your eligibility', 'Find and join donation camps', 'See your donation history'],
    cta: 'Register as a donor', accent: 'blood',
  },
  {
    key: 'HOSPITAL', icon: <IconHospital />, title: 'For hospitals',
    points: ['Manage blood stock by group', 'Publish camps and approve donors', 'Handle incoming blood requests'],
    cta: 'Register your hospital', accent: 'brand',
  },
  {
    key: 'RECEIVER', icon: <IconClipboard />, title: 'For receivers',
    points: ['Raise blood requests with urgency', 'Track approval status end-to-end', 'Share medical context securely'],
    cta: 'Register as a receiver', accent: 'info',
  },
];

const STEPS = [
  { n: '01', title: 'Create your account', text: 'Choose donor, hospital or receiver. Each role sees only what it needs.' },
  { n: '02', title: 'Connect to the network', text: 'Hospitals publish stock; donors join camps; receivers raise requests.' },
  { n: '03', title: 'Coordinate safely', text: 'Requests are reviewed by hospitals, and every unit is accounted for.' },
  { n: '04', title: 'Save lives', text: 'Faster matching means blood reaches the people who need it sooner.' },
];

const Home = () => {
  usePageTitle('Home');
  const [stats, setStats] = useState({ donors: 0, hospitals: 0, receivers: 0 });
  const [loading, setLoading] = useState(true);
  const [uncertain, setUncertain] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await axiosInstance.get('/api/accounts/stats/');
        if (alive && res?.data) setStats({
          donors: res.data.donors ?? 0,
          hospitals: res.data.hospitals ?? 0,
          receivers: res.data.receivers ?? 0,
        });
      } catch (err) {
        console.error('Failed to fetch stats:', err);
        if (alive) setUncertain(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div className="home">
      {/* ------------------------------ Hero ------------------------------ */}
      <section className="hero">
        <div className="hero-bg" aria-hidden="true" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow animate-rise rise-1">
              <IconActivity /> Connected blood network
            </span>
            <h1 className="hero-title animate-rise rise-2">
              Blood availability, coordinated <span className="hero-accent">in real time</span>.
            </h1>
            <p className="hero-sub animate-rise rise-3">
              Cloud Blood Bank links hospitals, donors and receivers on one trusted
              platform — so the right blood reaches the right place, faster and safer.
            </p>
            <div className="hero-cta animate-rise rise-4">
              <Link to="/find-blood" className="btn btn-primary btn-lg">
                <IconSearch /> Find blood
              </Link>
              <Link to="/auth/register" className="btn btn-secondary btn-lg">
                Join the network <IconArrowRight />
              </Link>
            </div>
            <ul className="hero-trust animate-rise rise-5">
              <li><IconCheck /> Verified hospitals &amp; donors</li>
              <li><IconCheck /> Role-based access</li>
              <li><IconCheck /> Secure authentication</li>
            </ul>
          </div>

          <aside className="hero-panel animate-rise rise-3" aria-label="Network at a glance">
            <div className="hero-panel-head">
              <span className="hero-panel-title">Network at a glance</span>
              <span className="badge badge-brand"><IconActivity /> Live</span>
            </div>
            <div className="hero-metrics">
              <div className="hero-metric">
                <span className="hero-metric-icon blood"><IconHeart /></span>
                <div>
                  <div className="hero-metric-value">{loading ? '—' : <CountUp value={stats.donors} />}</div>
                  <div className="hero-metric-label">Registered donors</div>
                </div>
              </div>
              <div className="hero-metric">
                <span className="hero-metric-icon"><IconHospital /></span>
                <div>
                  <div className="hero-metric-value">{loading ? '—' : <CountUp value={stats.hospitals} />}</div>
                  <div className="hero-metric-label">Hospitals</div>
                </div>
              </div>
              <div className="hero-metric">
                <span className="hero-metric-icon info"><IconUsers /></span>
                <div>
                  <div className="hero-metric-value">{loading ? '—' : <CountUp value={stats.receivers} />}</div>
                  <div className="hero-metric-label">Receivers</div>
                </div>
              </div>
            </div>
            <div className="hero-panel-foot">
              <IconMapPin />
              <span>Counts reflect accounts currently registered on the platform.</span>
            </div>
          </aside>
        </div>
      </section>

      {/* ------------------------------ Impact stats ------------------------------ */}
      <section className="section-tight">
        <div className="container">
          {uncertain && (
            <div className="alert alert-warning" role="status" style={{ marginBottom: '1rem' }}>
              Live counts could not be loaded right now.
            </div>
          )}
          <div className="stat-grid">
            <StatCard label="Registered donors" value={loading ? '—' : stats.donors.toLocaleString()} icon={<IconHeart />} tone="blood" foot="People ready to give" />
            <StatCard label="Partner hospitals" value={loading ? '—' : stats.hospitals.toLocaleString()} icon={<IconHospital />} foot="Facilities managing stock" />
            <StatCard label="Receivers" value={loading ? '—' : stats.receivers.toLocaleString()} icon={<IconUsers />} tone="info" foot="Requests raised & tracked" />
            <StatCard label="Coverage" value="8" icon={<IconDroplet />} tone="success" foot="Blood groups supported" />
          </div>
        </div>
      </section>

      {/* ------------------------------ Capabilities ------------------------------ */}
      <section className="section">
        <div className="container">
          <SectionHead
            center
            eyebrow="Platform"
            title="Everything a blood network needs"
            sub="One consistent system for availability, requests, camps and oversight — built on real operational data."
          />
          <div className="cap-grid">
            {CAPABILITIES.map((c, i) => (
              <article className={`cap-card card animate-rise rise-${(i % 6) + 1}`} key={c.title}>
                <span className="cap-icon">{c.icon}</span>
                <h3>{c.title}</h3>
                <p>{c.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------ Roles ------------------------------ */}
      <section className="section roles-section">
        <div className="container">
          <SectionHead
            center
            eyebrow="Built for every role"
            title="Your role, your view"
            sub="The network adapts to how you participate — with a tailored console for each participant."
          />
          <div className="role-grid">
            {ROLES.map((r, i) => (
              <article className={`role-card card animate-rise rise-${i + 1}`} key={r.key}>
                <span className={`role-icon ${r.accent}`}>{r.icon}</span>
                <h3>{r.title}</h3>
                <ul className="role-points">
                  {r.points.map((p) => <li key={p}><IconCheck /> {p}</li>)}
                </ul>
                <Link to="/auth/register" className="btn btn-secondary btn-block">{r.cta}</Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------ How it works ------------------------------ */}
      <section className="section how-section">
        <div className="container how-grid">
          <div>
            <SectionHead
              eyebrow="How it works"
              title="From registration to transfusion"
              sub="A clear, auditable journey for every unit of blood that moves through the network."
            />
            <ol className="steps">
              {STEPS.map((s) => (
                <li className="step" key={s.n}>
                  <span className="step-n">{s.n}</span>
                  <div>
                    <h4>{s.title}</h4>
                    <p>{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <aside className="trust-panel card">
            <span className="role-icon brand"><IconShield /></span>
            <h3>Safety is the default</h3>
            <p>
              Critical information is never conveyed by colour alone. Requests carry an
              explicit urgency level, hospitals verify records, and every action is tied
              to an authenticated account.
            </p>
            <ul className="role-points">
              <li><IconCheck /> Verified hospital accounts</li>
              <li><IconCheck /> Auditable request history</li>
              <li><IconCheck /> Accessible, keyboard-friendly UI</li>
            </ul>
            <Link to="/eligibility" className="btn btn-soft btn-block">Check donation eligibility</Link>
          </aside>
        </div>
      </section>

      {/* ------------------------------ CTA ------------------------------ */}
      <section className="section-tight">
        <div className="container">
          <div className="cta-band">
            <div>
              <h2>Every donation starts with someone deciding to help.</h2>
              <p>Join the network as a donor, hospital or receiver and be part of the chain that saves lives.</p>
            </div>
            <div className="cta-actions">
              <Link to="/auth/register" className="btn btn-accent btn-lg">Create an account</Link>
              <Link to="/camps" className="btn btn-secondary btn-lg"><IconCalendar /> Browse camps</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
