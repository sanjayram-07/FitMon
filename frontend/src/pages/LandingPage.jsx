import { createElement, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowRight, BarChart3, Brain, Shield, TrendingUp, ChevronDown } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

/* ─── tiny hook: reveals element when it enters viewport ─── */
function useFadeIn(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ─── animated counter ─── */
function Counter({ target, suffix = '' }) {
  const [val, setVal] = useState(0);
  const [ref, visible] = useFadeIn(0.5);
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = target / 60;
    const t = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(t); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(t);
  }, [visible, target]);
  return <span ref={ref}>{val}{suffix}</span>;
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
    <div className="lp-root">

      {/* ── NAVBAR ── */}
      <nav className={`lp-nav${scrolled ? ' lp-nav--scrolled' : ''}`}>
        <div className="lp-nav__inner">
          <Link to="/" className="lp-nav__brand">
            Fit<span className="lp-brand-dot">·</span>Mon
          </Link>
          <div className="lp-nav__links">
            <a href="#features" className="lp-nav__link">Features</a>
            <a href="#how-it-works" className="lp-nav__link">How It Works</a>
            <a href="#contact" className="lp-nav__link">Contact</a>
          </div>
          <div className="lp-nav__cta">
            <Link to="/login" className="lp-btn-ghost">Sign In</Link>
            <Link to="/login" className="lp-btn-solid">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="lp-hero">
        {/* background layers */}
        <div className="lp-hero__bg-grid" />
        <div className="lp-hero__orb lp-hero__orb--a" />
        <div className="lp-hero__orb lp-hero__orb--b" />
        <div className="lp-hero__scanline" />

        <div className="lp-container lp-hero__body">
          {/* left col */}
          <div className="lp-hero__copy lp-anim-up">
            <div className="lp-eyebrow">
              <span className="lp-eyebrow__dot" />
              Real-time Injury Prevention
            </div>

            <h1 className="lp-hero__h1">
              Train<br />
              <em>Smarter.</em><br />
              Move <span className="lp-hero__accent">Safer.</span>
            </h1>

            <p className="lp-hero__sub">
              FitMon monitors your form in real time, tracks your effort, and
              helps you prevent injury before it happens — one rep at a time.
            </p>

            <div className="lp-hero__actions">
              <Link to={primaryHref} className="lp-btn-solid lp-btn--lg">
                {user ? 'Go to Dashboard' : 'Start for Free'}
                <ArrowRight size={18} />
              </Link>
              <a href="#how-it-works" className="lp-btn-outline lp-btn--lg">
                See How It Works
              </a>
            </div>

            <div className="lp-hero__trust">
              <span className="lp-hero__trust-dot" />
              No equipment needed · Works with any camera
            </div>
          </div>

          {/* right col — mock monitor card */}
          <div className="lp-hero__visual lp-anim-up lp-anim-up--delay">
            <div className="lp-monitor">
              <div className="lp-monitor__chrome">
                <span /><span /><span />
              </div>
              <div className="lp-monitor__screen">
                {/* waveform bars */}
                <div className="lp-monitor__wave">
                  {[60,80,50,90,70,100,65,85,55,95,72,88].map((h, i) => (
                    <div key={i} className="lp-monitor__bar" style={{ height: `${h}%`, animationDelay: `${i * 0.08}s` }} />
                  ))}
                </div>
                {/* metric pills */}
                <div className="lp-monitor__metrics">
                  <MetricPill label="Angle" value="42°" color="var(--accent)" />
                  <MetricPill label="Reps" value="12" color="var(--blue)" />
                  <MetricPill label="Form" value="88%" color="var(--accent)" glow />
                </div>
                {/* skeleton joints */}
                <div className="lp-monitor__skeleton">
                  <svg viewBox="0 0 120 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="60" cy="20" r="10" stroke="rgba(0,229,160,0.6)" strokeWidth="2" />
                    <line x1="60" y1="30" x2="60" y2="80" stroke="rgba(0,229,160,0.4)" strokeWidth="2" />
                    <line x1="60" y1="50" x2="30" y2="70" stroke="rgba(0,229,160,0.4)" strokeWidth="2" />
                    <line x1="60" y1="50" x2="90" y2="70" stroke="rgba(0,229,160,0.4)" strokeWidth="2" />
                    <line x1="30" y1="70" x2="20" y2="95" stroke="rgba(0,229,160,0.3)" strokeWidth="2" />
                    <line x1="90" y1="70" x2="100" y2="95" stroke="rgba(0,229,160,0.3)" strokeWidth="2" />
                    <line x1="60" y1="80" x2="45" y2="130" stroke="rgba(0,229,160,0.4)" strokeWidth="2" />
                    <line x1="60" y1="80" x2="75" y2="130" stroke="rgba(0,229,160,0.4)" strokeWidth="2" />
                    <line x1="45" y1="130" x2="40" y2="170" stroke="rgba(0,229,160,0.3)" strokeWidth="2" />
                    <line x1="75" y1="130" x2="80" y2="170" stroke="rgba(0,229,160,0.3)" strokeWidth="2" />
                    {[
                      [60,30],[60,80],[30,70],[90,70],[20,95],[100,95],
                      [45,130],[75,130],[40,170],[80,170]
                    ].map(([cx,cy],i)=>(
                      <circle key={i} cx={cx} cy={cy} r="3.5" fill="rgba(0,229,160,0.9)" />
                    ))}
                  </svg>
                </div>
                {/* live badge */}
                <div className="lp-monitor__live">
                  <span className="lp-monitor__live-dot" />
                  LIVE
                </div>
              </div>
            </div>
            {/* floating score chip */}
            <div className="lp-monitor__score-chip">
              <span className="lp-monitor__score-val">88</span>
              <span className="lp-monitor__score-lbl">Form Score</span>
            </div>
          </div>
        </div>

        {/* scroll cue */}
        <a href="#stats" className="lp-hero__scroll-cue">
          <ChevronDown size={20} />
        </a>
      </section>

      {/* ── STATS TICKER ── */}
      <section id="stats" className="lp-stats">
        <div className="lp-container lp-stats__grid">
          <StatItem num={<Counter target={94} suffix="%" />} label="Injury risk reduction" />
          <div className="lp-stats__divider" />
          <StatItem num="Live" label="Real-time posture feedback" />
          <div className="lp-stats__divider" />
          <StatItem num="AI" label="Post-session coaching reports" />
          <div className="lp-stats__divider" />
          <StatItem num={<Counter target={3} suffix="s" />} label="Avg feedback latency" />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="lp-section">
        <div className="lp-container">
          <SectionLabel text="What FitMon Does" />
          <FadeIn>
            <h2 className="lp-section__h2">
              Everything you need<br />to train <em>safely</em>
            </h2>
          </FadeIn>
          <FadeIn delay={100}>
            <p className="lp-section__sub">
              A complete system that watches your form, measures your effort,
              and helps you improve every single session.
            </p>
          </FadeIn>

          <div className="lp-features-grid">
            {[
              { icon: Activity,    title: 'Posture Tracking',      copy: 'Your camera tracks joint movement in real time and scores your form on every rep.',                      tone: 'green' },
              { icon: Shield,      title: 'Injury Prevention',     copy: 'Risk signals surface early so you can adjust before fatigue or bad form causes damage.',                  tone: 'red'   },
              { icon: Brain,       title: 'AI Coaching Reports',   copy: 'After each session, get a personalised summary with actionable improvement tips.',                        tone: 'blue'  },
              { icon: TrendingUp,  title: 'Progress Tracking',     copy: 'Every session is saved. Watch your posture score and rep quality improve over time.',                     tone: 'green' },
              { icon: BarChart3,   title: 'Session History',       copy: 'Review all past sessions, download reports, and filter by risk level anytime.',                          tone: 'blue'  },
              { icon: Activity,    title: 'Workout Library',       copy: 'Browse guided workout videos filtered by muscle group and difficulty level.',                             tone: 'red'   },
            ].map((f, i) => (
              <FadeIn key={f.title} delay={i * 60}>
                <FeatureCard {...f} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS — cinematic sticky scroll ── */}
      <section id="how-it-works" className="lp-section lp-how">
        <div className="lp-container">
          <SectionLabel text="How It Works" />
          <FadeIn>
            <h2 className="lp-section__h2">
              From first rep<br />to final report
            </h2>
          </FadeIn>
        </div>

        <div className="lp-steps">
          {[
            { n: '01', title: 'Sign In',             desc: 'Log in securely and your profile is ready instantly. Your history and goals sync across devices.' },
            { n: '02', title: 'Start a Session',     desc: 'Open the session page, position yourself in frame, and begin your workout.' },
            { n: '03', title: 'Get Live Feedback',   desc: 'FitMon tracks your joints in real time, scoring every rep and surfacing risk alerts instantly.' },
            { n: '04', title: 'Review Your Report',  desc: 'See your posture score, injury risk level, and personalised AI coaching tips after every session.' },
          ].map((s, i) => (
            <FadeIn key={s.n} delay={i * 80} className="lp-step">
              <span className="lp-step__num">{s.n}</span>
              <div className="lp-step__body">
                <h4 className="lp-step__title">{s.title}</h4>
                <p className="lp-step__desc">{s.desc}</p>
              </div>
              {i < 3 && <div className="lp-step__connector" />}
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="lp-cta-section">
        <div className="lp-container">
          <FadeIn className="lp-cta-card">
            <div className="lp-cta-card__glow" />
            <div className="lp-cta-card__content">
              <p className="lp-eyebrow lp-eyebrow--center">
                <span className="lp-eyebrow__dot" />
                Ready to start?
              </p>
              <h2 className="lp-cta-card__h2">
                Train with confidence<br />from day one
              </h2>
              <p className="lp-cta-card__sub">
                Join FitMon and start your first session today.
                No equipment needed beyond your camera.
              </p>
              <Link to={primaryHref} className="lp-btn-solid lp-btn--lg">
                {user ? 'Go to Dashboard' : 'Get Started Free'}
                <ArrowRight size={18} />
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="lp-section">
        <div className="lp-container lp-contact">
          <div className="lp-contact__left">
            <SectionLabel text="Contact" />
            <FadeIn>
              <h2 className="lp-section__h2">Get in touch</h2>
            </FadeIn>
            <FadeIn delay={100}>
              <p className="lp-section__sub" style={{ maxWidth: 340 }}>
                Have a question or want to learn more? We'd love to hear from you.
              </p>
            </FadeIn>
          </div>
          <FadeIn className="lp-contact__form-card" delay={120}>
            <div className="lp-form-field">
              <label className="lp-form-label">Name</label>
              <input type="text" className="lp-input" placeholder="Your name" />
            </div>
            <div className="lp-form-field">
              <label className="lp-form-label">Email</label>
              <input type="email" className="lp-input" placeholder="you@email.com" />
            </div>
            <div className="lp-form-field">
              <label className="lp-form-label">Message</label>
              <textarea className="lp-input lp-textarea" rows={4} placeholder="How can we help?" />
            </div>
            <button className="lp-btn-solid" style={{ width: '100%', justifyContent: 'center' }}>
              Send Message
            </button>
          </FadeIn>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-container lp-footer__inner">
          <span className="lp-nav__brand" style={{ fontSize: '1rem' }}>
            Fit<span className="lp-brand-dot">·</span>Mon
          </span>
          <p className="lp-footer__copy">
            © {new Date().getFullYear()} FitMon. All rights reserved.
          </p>
          <div className="lp-footer__links">
            <a href="#how-it-works" className="lp-nav__link">How It Works</a>
            <a href="#contact" className="lp-nav__link">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── sub-components ── */

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

function SectionLabel({ text }) {
  return (
    <p className="lp-section-label">{text}</p>
  );
}

function StatItem({ num, label }) {
  return (
    <div className="lp-stat">
      <span className="lp-stat__val">{num}</span>
      <span className="lp-stat__lbl">{label}</span>
    </div>
  );
}

function MetricPill({ label, value, color, glow }) {
  return (
    <div className="lp-metric-pill" style={{ '--pill-color': color, boxShadow: glow ? `0 0 18px ${color}55` : 'none' }}>
      <span className="lp-metric-pill__val" style={{ color }}>{value}</span>
      <span className="lp-metric-pill__lbl">{label}</span>
    </div>
  );
}

function FeatureCard({ icon, title, copy, tone }) {
  const colors = { green: 'var(--accent)', red: 'var(--danger)', blue: 'var(--blue)' };
  const bg = { green: 'var(--accent-dim)', red: 'var(--danger-dim)', blue: 'var(--blue-dim)' };
  const c = colors[tone];
  const b = bg[tone];
  return (
    <div className="lp-feature-card">
      <div className="lp-feature-card__icon" style={{ background: b, color: c }}>
        {createElement(icon, { size: 22 })}
      </div>
      <h3 className="lp-feature-card__title">{title}</h3>
      <p className="lp-feature-card__copy">{copy}</p>
    </div>
  );
}