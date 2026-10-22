import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import RegisterDonorForm from './RegisterDonorForm';
import RegisterHospitalForm from './RegisterHospitalForm';
import RegisterReceiverForm from './RegisterReceiverForm';
import { usePageTitle } from '../../components/ui';
import { IconHeart, IconHospital, IconClipboard, IconArrowRight, IconArrowLeft, IconCheck } from '../../components/icons';
import './RegisterPage.css';

const ROLES = [
  { key: 'DONOR', icon: <IconHeart />, title: 'Donor', text: 'Give blood and join camps near you.',
    points: ['Track eligibility', 'Register for camps', 'See donation history'] },
  { key: 'HOSPITAL', icon: <IconHospital />, title: 'Hospital', text: 'Manage stock and coordinate requests.',
    points: ['Manage inventory', 'Publish camps', 'Approve requests'] },
  { key: 'RECEIVER', icon: <IconClipboard />, title: 'Receiver', text: 'Request blood and follow its status.',
    points: ['Raise requests', 'Set urgency', 'Track approvals'] },
];

const RegisterPage = () => {
  usePageTitle('Create account');
  const location = useLocation();
  const preselect = new URLSearchParams(location.search).get('role');
  const [role, setRole] = useState(() => (
    ROLES.some((r) => r.key === preselect) ? preselect : ''
  ));

  return (
    <div className="page register-page">
      <div className="register-head">
        <span className="eyebrow">Join Cloud Blood Bank</span>
        <h1>Create your account</h1>
        <p className="lead">Choose the role that matches how you participate. You can only hold one role per account.</p>
      </div>

      {!role ? (
        <div className="role-picker">
          {ROLES.map((r, i) => (
            <button
              key={r.key}
              type="button"
              className={`role-pick card card-hover animate-rise rise-${i + 1}`}
              onClick={() => setRole(r.key)}
            >
              <span className={`role-icon ${r.key === 'DONOR' ? 'blood' : r.key === 'HOSPITAL' ? 'brand' : 'info'}`}>{r.icon}</span>
              <h3>{r.title}</h3>
              <p>{r.text}</p>
              <ul className="role-points">
                {r.points.map((p) => <li key={p}><IconCheck /> {p}</li>)}
              </ul>
              <span className="role-pick-cta">Continue <IconArrowRight /></span>
            </button>
          ))}
        </div>
      ) : (
        <div className="register-form-wrap">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRole('')}>
            <IconArrowLeft /> Change role
          </button>
          <div className="register-form-body">
            {role === 'DONOR' && <RegisterDonorForm />}
            {role === 'HOSPITAL' && <RegisterHospitalForm />}
            {role === 'RECEIVER' && <RegisterReceiverForm />}
          </div>
        </div>
      )}

      <p className="register-foot">
        Already have an account? <Link to="/login">Sign in instead</Link>
      </p>
    </div>
  );
};

export default RegisterPage;
