import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

function useFadeIn(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return [ref, visible];
}

function Counter({ target, suffix = '' }) {
  const [val, setVal] = useState(0);
  const [ref, visible] = useFadeIn(0.5);

  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = target / 60;
    const t = setInterval(() => {
      start += step;
      if (start >= target) {
        setVal(target);
        clearInterval(t);
      } else {
        setVal(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(t);
  }, [visible, target]);

  return (
    <span ref={ref}>
      {val}
      {suffix}
    </span>
  );
}

export default function LandingPage() {
  const user = useAuthStore((state) => state.user);
  const primaryHref = user ? '/dashboard' : '/login';
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div id="top" style={{ background: 'var(--bg)' }}>
      <nav
        className="navbar"
        style={{
          borderBottomColor: scrolled ? 'var(--border-light)' : 'var(--border)',
        }}
      >
        <div className="navbar-inner">
          <Link to="/" className="navbar-brand" style={{ fontSize: '1.1rem' }}>
            Fit<span className="navbar-dot">·</span>Mon
          </Link>
          <div className="navbar-links">
            <a href="#top" className="navbar-link">Home</a>
            <a href="#how-it-works" className="navbar-link">How It Works</a>
            <a href="#contact" className="navbar-link">Contact</a>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Link to="/login" className="btn-secondary navbar-cta">Sign In</Link>
            <Link to="/login" className="btn-primary navbar-cta">Log In</Link>
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-inner container">
          <FadeIn className="hero-content">
            <span className="badge-success" style={{ width: 'fit-content' }}>
              Real-time Injury Prevention
            </span>
            <h1 className="page-title" style={{ marginTop: '16px' }}>
              Train Smarter.
              <br />
              Move Safer.
            </h1>
            <p className="text-secondary" style={{ maxWidth: '520px' }}>
              FitMon monitors your form, tracks your pressure, and prevents injury in real time.
            </p>
            <div className="hero-actions" style={{ marginTop: '12px' }}>
              <Link to={primaryHref} className="btn-primary">
                Get Started
              </Link>
              <a href="#how-it-works" className="btn-secondary">
                See How It Works
              </a>
            </div>
          </FadeIn>

          <FadeIn className="hero-visual" delay={120}>
            <div
              className="card"
              style={{
                width: '320px',
                borderColor: 'var(--border-light)',
                background: 'var(--surface)',
                animation: 'drift 10s ease-in-out infinite',
              }}
            >
              <p className="section-label" style={{ marginBottom: '12px' }}>
                Live Snapshot
              </p>
              <div className="divider" style={{ marginBottom: '16px' }} />
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <p className="metric-label">Form Score</p>
                  <p className="metric-value metric-value--accent">
                    <Counter target={88} suffix="%" />
                  </p>
                </div>
                <div>
                  <p className="metric-label">Reps</p>
                  <p className="metric-value">12</p>
                </div>
                <div>
                  <p className="metric-label">Pressure</p>
                  <p className="metric-value metric-value--blue">62</p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <section id="how-it-works" className="section">
        <div className="container">
          <p className="section-label">How It Works</p>
          <h2 className="page-title" style={{ fontSize: 'clamp(1.6rem, 2.6vw, 2.4rem)', marginBottom: '24px' }}>
            A clear path from setup to results
          </h2>
          <div className="steps">
            {[
              { n: '01', title: 'Start a Session', desc: 'Open FitMon and position your camera for a clear view.' },
              { n: '02', title: 'Follow Guidance', desc: 'Stay aligned with posture guidance as you move.' },
              { n: '03', title: 'Get Live Feedback', desc: 'See real-time signals as you complete each rep.' },
              { n: '04', title: 'Review Your Report', desc: 'Check your session summary and next steps.' },
            ].map((step) => (
              <div key={step.n} className="step-card">
                <div className="step-number">{step.n}</div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-copy">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="section section-border">
        <div className="container" style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="card" style={{ width: '100%', maxWidth: '520px' }}>
            <p className="section-label">Contact</p>
            <h2 className="page-title" style={{ fontSize: 'clamp(1.4rem, 2.4vw, 2rem)', marginBottom: '16px' }}>
              Let’s talk
            </h2>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label className="text-secondary" style={{ display: 'block', marginBottom: '8px' }}>
                  Name
                </label>
                <input className="input-field" placeholder="Your name" />
              </div>
              <div>
                <label className="text-secondary" style={{ display: 'block', marginBottom: '8px' }}>
                  Email
                </label>
                <input className="input-field" type="email" placeholder="you@email.com" />
              </div>
              <div>
                <label className="text-secondary" style={{ display: 'block', marginBottom: '8px' }}>
                  Message
                </label>
                <textarea className="input-field" rows="4" placeholder="How can we help?" />
              </div>
              <button type="button" className="btn-primary button-block">
                Send Message
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer-section">
        <div
          className="container"
          style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}
        >
          <span className="navbar-brand" style={{ fontSize: '1rem' }}>
            Fit<span className="navbar-dot">·</span>Mon
          </span>
          <p className="text-secondary" style={{ fontSize: '0.85rem' }}>
            © {new Date().getFullYear()} FitMon. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: '16px' }}>
            <a href="#top" className="navbar-link">Home</a>
            <a href="#how-it-works" className="navbar-link">How It Works</a>
            <a href="#contact" className="navbar-link">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FadeIn({ children, delay = 0, className = '' }) {
  const [ref, visible] = useFadeIn(0.12);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}