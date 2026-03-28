import { createElement } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowRight, BarChart3, Brain, Cpu, Monitor, Shield, TrendingUp, Zap } from 'lucide-react';
import BlurText from '../components/BlurText';
import CircularTextBadge from '../components/CircularTextBadge';
import ScrollFloat from '../components/ScrollFloat';
import useAuthStore from '../store/useAuthStore';

export default function LandingPage() {
  const user = useAuthStore((state) => state.user);
  const primaryHref = user ? (user.role === 'mentor' ? '/mentor' : '/dashboard') : '/login';

  return (
    <div className="page landing-page">
      <section className="hero">
        <div className="hero-orb hero-orb--one" />
        <div className="hero-orb hero-orb--two" />
        <div className="hero-grid" />

        <div className="container hero-inner">
          <div className="hero-content fade-up">
            <div className="hero-pill badge-success">
              <Zap className="icon-sm" />
              <span>Live Injury Prevention</span>
            </div>

            <h1 className="page-title hero-heading">
              <span className="hero-title-line">Real-time form</span>
              <span className="hero-title-line">
                that <span className="hero-title-accent">protects</span> you
              </span>
            </h1>

            <ScrollFloat containerClassName="hero-title-float" textClassName="hero-title-float-text">
              FITMON
            </ScrollFloat>

            <BlurText
              text="Production-ready fitness monitoring with secure auth, live pose tracking, FSR fusion, and post-session AI reporting."
              delay={90}
              animateBy="words"
              direction="top"
              className="hero-subtitle"
            />

            <p className="hero-copy hero-subtext">
              FitMon pairs MediaPipe pose estimation with authenticated real-time sockets and Firestore-backed session data
              so every bicep curl can be measured, coached, and reviewed safely.
            </p>

            <div className="hero-actions">
              <Link to={primaryHref} className="btn-primary button-inline">
                {user ? 'Open Workspace' : 'Sign In to Start'}
                <ArrowRight className="icon-sm" />
              </Link>
              <a href="#features" className="btn-secondary button-inline">
                Explore Features
              </a>
            </div>
          </div>

          <div className="hero-visual">
          <div className="card hero-visual-card fade-up fade-up-2">
            <CircularTextBadge className="hero-badge" text="Form Motion Control Reps" centerText="AI" />
            <div className="hero-card__screen">
              <div className="hero-card__bar">
                <span />
                <span />
                <span />
              </div>
              <div className="hero-card__metrics">
                <div>
                  <p>Angle</p>
                  <strong>42°</strong>
                </div>
                <div>
                  <p>Reps</p>
                  <strong>12</strong>
                </div>
                <div>
                  <p>Form</p>
                  <strong>88</strong>
                </div>
              </div>
              <div className="hero-card__silhouette">
                <div className="hero-card__joint hero-card__joint--shoulder" />
                <div className="hero-card__joint hero-card__joint--elbow" />
                <div className="hero-card__joint hero-card__joint--wrist" />
              </div>
            </div>
          </div>
          </div>
        </div>
      </section>

      <section className="stats-row section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value tabular-nums">24/7</span>
              <span className="stat-label">Live pose &amp; socket monitoring</span>
            </div>
            <div className="stat-item">
              <span className="stat-value tabular-nums">FSR</span>
              <span className="stat-label">Sensor fusion for engagement signals</span>
            </div>
            <div className="stat-item">
              <span className="stat-value tabular-nums">AI</span>
              <span className="stat-label">Post-session reports when you finish</span>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="section">
        <div className="container">
          <div className="section-heading">
            <h2 className="page-title">Intelligent Workout Analysis</h2>
            <p className="text-secondary">
              A secure, modular pipeline for real-time form analysis and post-session coaching.
            </p>
          </div>

          <div className="features-grid">
            <FeatureCard icon={Monitor} title="Computer Vision" copy="MediaPipe Pose tracks shoulder, elbow, and wrist motion in the browser." tone="icon-green" />
            <FeatureCard icon={Cpu} title="Sensor Fusion" copy="ESP32 FSR readings are streamed into the same authenticated session for engagement checks." tone="icon-blue" />
            <FeatureCard icon={Shield} title="Secure Access" copy="Firebase OAuth and backend token verification protect every route and socket." tone="icon-green" />
            <FeatureCard icon={Brain} title="AI Reporting" copy="Gemini runs only after session end to keep live feedback fast and non-blocking." tone="icon-red" />
            <FeatureCard icon={Activity} title="Injury Signals" copy="Engagement and risk hints surface early so you can adjust load before fatigue sets in." tone="icon-red" />
            <FeatureCard icon={TrendingUp} title="Session Trends" copy="Per-rep metrics roll up into reports you can revisit after every workout." tone="icon-blue" />
          </div>
        </div>
      </section>

      <section className="section section-border">
        <div className="container">
          <div className="section-heading">
            <h2 className="page-title">How It Works</h2>
          </div>

          <div className="steps">
            {[
              { step: '01', icon: Shield, title: 'Authenticate', desc: 'Sign in with Google and sync your profile to Firestore.' },
              { step: '02', icon: Activity, title: 'Start Session', desc: 'Open the protected webcam session and begin your curls.' },
              { step: '03', icon: Cpu, title: 'Fuse Signals', desc: 'Combine pose quality with FSR pressure for live coaching.' },
              { step: '04', icon: BarChart3, title: 'Review Report', desc: 'Store the summary and generate structured AI suggestions.' },
            ].map((item) => (
              <div key={item.step} className="step-card">
                <span className="step-number">{item.step}</span>
                <div className="step-icon">
                  {createElement(item.icon, { className: 'icon-md text-accent' })}
                </div>
                <h4 className="step-title">{item.title}</h4>
                <p className="step-copy">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="section footer-section">
        <div className="container footer-note">
          <p className="text-secondary">
            FitMon | AI-assisted fitness intelligence built with Firebase, MediaPipe, Socket.IO, and Gemini.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, copy, tone }) {
  return (
    <div className="card feature-card">
      <div className={`feature-icon ${tone}`}>
        {createElement(icon, { className: 'icon-md' })}
      </div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-copy">{copy}</p>
    </div>
  );
}
