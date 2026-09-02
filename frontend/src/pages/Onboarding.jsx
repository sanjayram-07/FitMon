import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { authorizedRequest } from '../services/apiClient';
import '../index.css';

const ACTIVITY_OPTIONS = [
  { value: 1.2, label: 'Sedentary', hint: 'Little to no exercise, desk job' },
  { value: 1.375, label: 'Lightly Active', hint: 'Light exercise 1-3 days/week' },
  { value: 1.55, label: 'Moderately Active', hint: 'Moderate exercise 3-5 days/week' },
  { value: 1.725, label: 'Very Active', hint: 'Hard exercise 6-7 days/week' },
  { value: 1.9, label: 'Extremely Active', hint: 'Physical job or trains twice a day' },
];

const GOAL_OPTIONS = [
  { value: 'cut', label: 'Cut', hint: 'Lose fat, keep strength' },
  { value: 'recomp', label: 'Recomp', hint: 'Maintain weight, improve composition' },
  { value: 'bulk', label: 'Bulk', hint: 'Build muscle, gain weight' },
];

const DIET_OPTIONS = [
  { value: 'vegan', label: 'Vegan' },
  { value: 'veg', label: 'Vegetarian' },
  { value: 'egg', label: 'Eggetarian' },
  { value: 'nonveg', label: 'Non-Vegetarian' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const setAuthState = useAuthStore((s) => s.setAuthState);

  const [form, setForm] = useState({
    sex: 'm', age: 22, heightCm: 172, weightKg: 68,
    activity: 1.55, goal: 'recomp', diet: 'veg', kitchen: 'home', training: 'pm',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const { user: updatedUser } = await authorizedRequest('/api/onboarding', token, {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setAuthState({ user: { ...user, ...updatedUser }, token });
      navigate('/diet', { replace: true });
    } catch (err) {
      setError(err.message || 'Could not save your profile. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: '80px' }}>
      <div className="container" style={{ paddingTop: '96px', maxWidth: '640px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <p className="section-label">Welcome to FitMon</p>
          <h1 className="page-title" style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)' }}>Let's set up your profile</h1>
          <p className="text-secondary" style={{ marginTop: '8px' }}>
            A few quick numbers so FitMon can calculate your BMI and build a Gemini-powered diet plan tuned to your body and training.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Sex">
              <select className="input-field" value={form.sex} onChange={(e) => update('sex', e.target.value)}>
                <option value="m">Male</option>
                <option value="f">Female</option>
              </select>
            </Field>
            <Field label="Age">
              <input type="number" min="14" max="80" className="input-field" value={form.age} onChange={(e) => update('age', e.target.value)} />
            </Field>
            <Field label="Height (cm)">
              <input type="number" min="130" max="220" className="input-field" value={form.heightCm} onChange={(e) => update('heightCm', e.target.value)} />
            </Field>
            <Field label="Weight (kg)">
              <input type="number" min="35" max="200" className="input-field" value={form.weightKg} onChange={(e) => update('weightKg', e.target.value)} />
            </Field>
          </div>

          <Field label="Activity Level">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {ACTIVITY_OPTIONS.map((opt) => (
                <OptionRow key={opt.value} active={form.activity === opt.value} onClick={() => update('activity', opt.value)} label={opt.label} hint={opt.hint} />
              ))}
            </div>
          </Field>

          <Field label="Goal">
            <div style={{ display: 'flex', gap: '8px' }}>
              {GOAL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update('goal', opt.value)}
                  className={form.goal === opt.value ? 'btn-primary' : 'btn-secondary'}
                  style={{ flex: 1, padding: '12px', fontSize: '0.85rem' }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Diet Preference">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {DIET_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update('diet', opt.value)}
                  className={form.diet === opt.value ? 'btn-primary' : 'btn-secondary'}
                  style={{ padding: '10px', fontSize: '0.85rem' }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Kitchen Access">
              <select className="input-field" value={form.kitchen} onChange={(e) => update('kitchen', e.target.value)}>
                <option value="home">Home kitchen</option>
                <option value="hostel">Hostel mess</option>
                <option value="pg">PG / shared flat</option>
              </select>
            </Field>
            <Field label="Training Time">
              <select className="input-field" value={form.training} onChange={(e) => update('training', e.target.value)}>
                <option value="am">Morning</option>
                <option value="pm">Evening</option>
              </select>
            </Field>
          </div>

          {error && (
            <div className="camera-error camera-error-inline">
              <p style={{ fontSize: '0.85rem' }}>{error}</p>
            </div>
          )}

          <button type="submit" disabled={submitting} className="btn-primary button-block" style={{ padding: '14px 28px' }}>
            {submitting ? 'Saving...' : 'Save & Generate My Diet Plan'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <p style={{ color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
        {label}
      </p>
      {children}
    </div>
  );
}

function OptionRow({ active, onClick, label, hint }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={active ? 'btn-primary' : 'btn-secondary'}
      style={{ padding: '12px 16px', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}
    >
      <span>{label}</span>
      <span style={{ opacity: 0.75, fontSize: '0.75rem' }}>{hint}</span>
    </button>
  );
}
