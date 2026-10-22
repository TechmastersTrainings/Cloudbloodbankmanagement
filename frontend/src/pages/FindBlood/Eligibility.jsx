import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHead, Alert, usePageTitle } from '../../components/ui';
import { IconCheck, IconXCircle, IconHeart, IconShield, IconInfo } from '../../components/icons';
import './Eligibility.css';

const QUESTIONS = [
  { name: 'age', label: 'How old are you?', type: 'number', placeholder: 'e.g. 28', suffix: 'years', hint: 'Donors must be between 18 and 65.' },
  { name: 'weight', label: 'What is your weight?', type: 'number', placeholder: 'e.g. 62', suffix: 'kg', hint: 'A minimum of 50 kg is required.' },
];

const YesNo = ({ name, value, onChange, label, hint }) => (
  <fieldset className="elig-field">
    <legend className="field-label">{label}</legend>
    {hint && <p className="field-hint">{hint}</p>}
    <div className="seg">
      {[{ v: 'yes', t: 'Yes' }, { v: 'no', t: 'No' }].map((o) => (
        <label key={o.v} className={`seg-opt${value === o.v ? ' selected' : ''}`}>
          <input
            type="radio"
            name={name}
            value={o.v}
            checked={value === o.v}
            onChange={onChange}
          />
          {o.t}
        </label>
      ))}
    </div>
  </fieldset>
);

const Eligibility = () => {
  usePageTitle('Eligibility');
  const [answers, setAnswers] = useState({ age: '', weight: '', health: '', recentDonation: '' });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (e) => setAnswers((a) => ({ ...a, [e.target.name]: e.target.value }));

  const check = (e) => {
    e.preventDefault();
    const { age, weight, health, recentDonation } = answers;
    if (!age || !weight || !health || !recentDonation) {
      setError('Please answer all four questions to see your result.');
      setResult(null);
      return;
    }
    setError('');

    if (parseInt(age, 10) < 18 || parseInt(age, 10) > 65) {
      setResult({ ok: false, title: 'Age requirement not met', text: 'Donors must be between 18 and 65 years old. Please speak to a doctor if you have questions.' });
    } else if (parseFloat(weight) < 50) {
      setResult({ ok: false, title: 'Weight requirement not met', text: 'A minimum weight of 50 kg is required to donate safely. This protects both you and the recipient.' });
    } else if (health !== 'yes') {
      setResult({ ok: false, title: 'Health check needed', text: 'You should be in good health and free from active infection. A clinician can advise when it is safe to donate.' });
    } else if (recentDonation === 'yes') {
      setResult({ ok: false, title: 'Please wait between donations', text: 'A gap of at least 3 months between whole-blood donations is recommended for your recovery.' });
    } else {
      setResult({ ok: true, title: 'You look eligible to donate', text: 'Based on your answers you meet the common criteria. A final check happens at the donation centre on the day.' });
    }
  };

  const reset = () => {
    setAnswers({ age: '', weight: '', health: '', recentDonation: '' });
    setResult(null);
    setError('');
  };

  return (
    <div className="page page-narrow">
      <PageHead
        title="Check your donation eligibility"
        sub="Answer four quick questions to see whether you meet the usual criteria for donating blood. This is guidance, not a medical decision."
      />

      <form className="elig-card card card-pad-lg" onSubmit={check}>
        <div className="field-row">
          {QUESTIONS.map((q) => (
            <div className="field" key={q.name}>
              <label className="field-label" htmlFor={q.name}>{q.label}</label>
              <div className="input-affix">
                <input
                  id={q.name}
                  name={q.name}
                  type={q.type}
                  min="0"
                  inputMode="numeric"
                  className="input"
                  placeholder={q.placeholder}
                  value={answers[q.name]}
                  onChange={handleChange}
                />
                <span className="input-affix-text">{q.suffix}</span>
              </div>
              <span className="field-hint">{q.hint}</span>
            </div>
          ))}
        </div>

        <YesNo
          name="health"
          label="Are you in good health, free from fever or infection?"
          value={answers.health}
          onChange={handleChange}
        />
        <YesNo
          name="recentDonation"
          label="Have you donated blood in the last 3 months?"
          value={answers.recentDonation}
          onChange={handleChange}
        />

        {error && <Alert tone="warning">{error}</Alert>}

        <div className="row gap-3 row-wrap">
          <button type="submit" className="btn btn-primary btn-lg"><IconHeart /> Check eligibility</button>
          <button type="button" className="btn btn-ghost" onClick={reset}>Reset</button>
        </div>
      </form>

      {result && (
        <div
          className={`elig-result card animate-rise ${result.ok ? 'ok' : 'no'}`}
          role="status"
          aria-live="polite"
        >
          <span className={`elig-result-icon ${result.ok ? 'ok' : 'no'}`}>
            {result.ok ? <IconCheck /> : <IconXCircle />}
          </span>
          <div>
            <h3>{result.title}</h3>
            <p>{result.text}</p>
            {result.ok && (
              <div className="row gap-3 row-wrap" style={{ marginTop: '0.75rem' }}>
                <Link to="/camps" className="btn btn-primary btn-sm">Find a donation camp</Link>
                <Link to="/auth/register" className="btn btn-secondary btn-sm">Register as a donor</Link>
              </div>
            )}
          </div>
        </div>
      )}

      <Alert tone="info" className="elig-note">
        <IconShield />
        <span>
          Eligibility depends on your full medical history and the donation centre&apos;s assessment.
          Always follow the advice of qualified medical staff.
        </span>
      </Alert>
    </div>
  );
};

export default Eligibility;
