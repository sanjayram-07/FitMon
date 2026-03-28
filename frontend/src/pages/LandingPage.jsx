import { createElement } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowRight, BarChart3, Brain, Cpu, Monitor, Shield, Zap } from 'lucide-react';
import BlurText from '../components/BlurText';
import CircularTextBadge from '../components/CircularTextBadge';
import ScrollFloat from '../components/ScrollFloat';
import useAuthStore from '../store/useAuthStore';

export default function LandingPage() {
  const user = useAuthStore((state) => state.user);
  const primaryHref = user ? (user.role === 'mentor' ? '/mentor' : '/dashboard') : '/login';

  return (
    <div className="min-h-screen pt-16">
      <section className="hero-section">
        <div className="hero-orb hero-orb--one" />
        <div className="hero-orb hero-orb--two" />
        <div className="hero-grid" />

        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-14 px-6 py-24 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="animate-fade-in">
            <div className="hero-pill mb-8">
              <Zap className="h-4 w-4 text-accent-primary" />
              <span>AI-powered curl tracking</span>
            </div>

            <ScrollFloat containerClassName="mb-4" textClassName="hero-title">
              FITMON
            </ScrollFloat>

            <BlurText
              text="Production-ready fitness monitoring with secure auth, live pose tracking, FSR fusion, and post-session AI reporting."
              delay={90}
              animateBy="words"
              direction="top"
              className="hero-subtitle"
            />

            <p className="hero-copy">
              FitMon pairs MediaPipe pose estimation with authenticated real-time sockets and Firestore-backed session data
              so every bicep curl can be measured, coached, and reviewed safely.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link to={primaryHref} className="btn-primary inline-flex items-center gap-2 no-underline">
                {user ? 'Open Workspace' : 'Sign In to Start'}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#features" className="btn-secondary inline-flex items-center gap-2 no-underline">
                Explore Features
              </a>
            </div>
          </div>

          <div className="hero-card animate-float">
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
      </section>

      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Intelligent Workout Analysis</h2>
          <p className="text-dark-200 max-w-xl mx-auto">
            A secure, modular pipeline for real-time form analysis and post-session coaching.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          <FeatureCard icon={Monitor} title="Computer Vision" copy="MediaPipe Pose tracks shoulder, elbow, and wrist motion in the browser." />
          <FeatureCard icon={Cpu} title="Sensor Fusion" copy="ESP32 FSR readings are streamed into the same authenticated session for engagement checks." />
          <FeatureCard icon={Shield} title="Secure Access" copy="Firebase OAuth and backend token verification protect every route and socket." />
          <FeatureCard icon={Brain} title="AI Reporting" copy="Gemini runs only after session end to keep live feedback fast and non-blocking." />
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-24 border-t border-dark-700">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How It Works</h2>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {[
            { step: '01', icon: Shield, title: 'Authenticate', desc: 'Sign in with Google and sync your profile to Firestore.' },
            { step: '02', icon: Activity, title: 'Start Session', desc: 'Open the protected webcam session and begin your curls.' },
            { step: '03', icon: Cpu, title: 'Fuse Signals', desc: 'Combine pose quality with FSR pressure for live coaching.' },
            { step: '04', icon: BarChart3, title: 'Review Report', desc: 'Store the summary and generate structured AI suggestions.' },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="relative inline-flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-2xl bg-dark-700 border border-dark-500 flex items-center justify-center">
                  {createElement(item.icon, { className: 'w-7 h-7 text-accent-primary' })}
                </div>
                <span className="absolute -top-2 -right-2 text-xs font-bold text-accent-primary bg-dark-800 border border-dark-500 rounded-full w-6 h-6 flex items-center justify-center">
                  {item.step}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mb-1">{item.title}</h4>
              <p className="text-xs text-dark-300">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-dark-700 py-8 text-center">
        <p className="text-xs text-dark-400">
          FitMon | AI-assisted fitness intelligence built with Firebase, MediaPipe, Socket.IO, and Gemini.
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, copy }) {
  return (
    <div className="glass-card p-8 group">
      <div className="w-12 h-12 rounded-xl bg-accent-primary/15 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
        {createElement(icon, { className: 'w-6 h-6 text-accent-primary' })}
      </div>
      <h3 className="text-lg font-bold text-white mb-3">{title}</h3>
      <p className="text-sm text-dark-200 leading-relaxed">{copy}</p>
    </div>
  );
}
