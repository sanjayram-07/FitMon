import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import { authorizedRequest } from '../services/apiClient';
import '../index.css';

export default function Diet() {
  const token = useAuthStore((s) => s.token);
  const [plan, setPlan] = useState(null);
  const [bmi, setBmi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      if (!token) return;
      try {
        const data = await authorizedRequest('/api/diet/plan/latest', token);
        setPlan(data.plan);
        setBmi(data.bmi);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    try {
      const data = await authorizedRequest('/api/diet/plan', token, { method: 'POST', body: JSON.stringify({}) });
      setPlan(data);
      setBmi(data.bmi);
    } catch (e) {
      setError(e.message || 'Could not generate a plan right now.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
        <div className="container" style={{ paddingTop: '96px', textAlign: 'center', color: 'var(--muted)' }}>
          Loading your diet plan...
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: '80px' }}>
      <div className="container" style={{ paddingTop: '96px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
          <div>
            <p className="section-label">Diet</p>
            <h1 className="page-title" style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)' }}>Your Diet Plan</h1>
          </div>
          <button onClick={handleGenerate} disabled={generating} className="btn-primary button-inline" style={{ padding: '12px 22px' }}>
            <Sparkles className="icon-sm" />
            {generating ? 'Generating with Gemini...' : plan ? 'Regenerate Plan' : 'Generate My Plan'}
          </button>
        </div>

        {error && (
          <div className="camera-error camera-error-inline" style={{ marginBottom: '24px' }}>
            <p style={{ fontSize: '0.85rem' }}>{error}</p>
          </div>
        )}

        {bmi && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <StatCard label="BMI" value={bmi.value} sub={bmi.category} />
            {plan?.targets && (
              <>
                <StatCard label="Daily Calories" value={plan.targets.kcal} sub="kcal" accent />
                <StatCard label="Protein" value={`${plan.targets.protein}g`} sub={`${plan.targets.proteinPerKg}g/kg`} />
                <StatCard label="Carbs / Fat" value={`${plan.targets.carbs}g / ${plan.targets.fat}g`} sub="daily" />
              </>
            )}
          </div>
        )}

        {!plan ? (
          <div className="card" style={{ textAlign: 'center', padding: '64px 32px' }}>
            <p style={{ color: 'var(--muted)', marginBottom: '8px' }}>
              No diet plan yet. FitMon uses your BMI, goal, and recent training activity with Gemini to build a full day of meals.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>
              Haven't set up your body profile? <Link to="/onboarding" style={{ color: 'var(--accent)' }}>Complete onboarding</Link> first.
            </p>
          </div>
        ) : (
          <>
            {plan.tip && (
              <div className="card" style={{ padding: '16px 24px', marginBottom: '24px', borderColor: 'var(--accent-border)' }}>
                <p style={{ color: 'var(--accent)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Coach Tip</p>
                <p style={{ color: 'var(--text)', fontSize: '0.9rem' }}>{plan.tip}</p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {plan.meals?.map((meal, idx) => {
                const mealTotals = meal.items.reduce((t, i) => ({
                  kcal: t.kcal + i.kcal, protein: t.protein + i.protein, carbs: t.carbs + i.carbs, fat: t.fat + i.fat,
                }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });

                return (
                  <div key={idx} className="card" style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <div>
                        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)' }}>{meal.slot}</p>
                        {meal.time && <p style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>{meal.time}</p>}
                      </div>
                      <span className="badge-blue">{Math.round(mealTotals.kcal)} kcal</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {meal.items.map((item, i2) => (
                        <div key={i2} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--text)' }}>
                            {item.qty}x {item.name} <span style={{ color: 'var(--muted)' }}>({item.unit})</span>
                          </span>
                          <span style={{ color: 'var(--muted)' }}>{item.kcal} kcal · {item.protein}p</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {plan.targets && plan.verify?.totals && (
              <div className="card" style={{ marginTop: '24px', padding: '20px 24px' }}>
                <p className="section-label" style={{ marginBottom: '12px' }}>Daily Total vs Target</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', fontSize: '0.85rem' }}>
                  <TotalRow label="Kcal" actual={plan.verify.totals.kcal} target={plan.targets.kcal} />
                  <TotalRow label="Protein" actual={plan.verify.totals.p} target={plan.targets.protein} suffix="g" />
                  <TotalRow label="Carbs" actual={plan.verify.totals.c} target={plan.targets.carbs} suffix="g" />
                  <TotalRow label="Fat" actual={plan.verify.totals.f} target={plan.targets.fat} suffix="g" />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '20px 12px' }}>
      <p style={{ color: 'var(--muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>{label}</p>
      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.4rem', color: accent ? 'var(--accent)' : 'var(--text)' }}>{value}</p>
      {sub && <p style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '4px' }}>{sub}</p>}
    </div>
  );
}

function TotalRow({ label, actual, target, suffix = '' }) {
  const pct = Math.round((actual / target) * 100);
  const color = Math.abs(pct - 100) <= 8 ? 'var(--accent)' : 'var(--warning)';
  return (
    <div>
      <p style={{ color: 'var(--muted)', fontSize: '0.72rem', marginBottom: '4px' }}>{label}</p>
      <p style={{ color, fontWeight: 600 }}>{Math.round(actual)}{suffix} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>/ {target}{suffix}</span></p>
    </div>
  );
}
