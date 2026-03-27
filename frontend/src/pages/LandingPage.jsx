import { Link } from 'react-router-dom';
import { Activity, Zap, Brain, Shield, ArrowRight, Monitor, Cpu, BarChart3 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen pt-16">
      {/* ─── HERO ─── */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 py-32 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-primary/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-dark-700/80 border border-dark-500 rounded-full px-4 py-1.5 mb-8">
            <Zap className="w-4 h-4 text-accent-primary" />
            <span className="text-xs font-medium text-dark-200">AI-Powered Fitness Intelligence</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight tracking-tight mb-6">
            Train Smarter with{' '}
            <span className="bg-gradient-to-r from-accent-primary to-purple-400 bg-clip-text text-transparent">
              Real-Time AI
            </span>
          </h1>

          <p className="text-lg md:text-xl text-dark-200 max-w-2xl mx-auto mb-10 leading-relaxed">
            FitMon uses computer vision and sensor fusion to track your bicep curls in real-time, 
            providing instant form feedback and AI-powered post-session insights.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link to="/session" className="btn-primary inline-flex items-center gap-2 no-underline">
              Start Session
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#features" className="btn-secondary inline-flex items-center gap-2 no-underline">
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Intelligent Workout Analysis
          </h2>
          <p className="text-dark-200 max-w-xl mx-auto">
            Three layers of real-time analysis working together to perfect your form.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* CV Feature */}
          <div className="glass-card p-8 group">
            <div className="w-12 h-12 rounded-xl bg-accent-primary/15 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Monitor className="w-6 h-6 text-accent-primary" />
            </div>
            <h3 className="text-lg font-bold text-white mb-3">Computer Vision</h3>
            <p className="text-sm text-dark-200 leading-relaxed">
              MediaPipe Pose tracks your joints in real-time, computing elbow angles and detecting form deviations with sub-200ms latency.
            </p>
          </div>

          {/* Sensor Fusion */}
          <div className="glass-card p-8 group">
            <div className="w-12 h-12 rounded-xl bg-purple-500/15 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Cpu className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-3">Sensor Fusion</h3>
            <p className="text-sm text-dark-200 leading-relaxed">
              ESP32 FSR sensors measure muscle engagement. Combined with CV data, the system detects low engagement and injury risk patterns.
            </p>
          </div>

          {/* AI Insights */}
          <div className="glass-card p-8 group">
            <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Brain className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-3">AI Coaching</h3>
            <p className="text-sm text-dark-200 leading-relaxed">
              After each session, Gemini AI analyzes your performance and generates personalized improvement recommendations.
            </p>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="max-w-6xl mx-auto px-6 py-24 border-t border-dark-700">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How It Works</h2>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {[
            { step: '01', icon: Monitor, title: 'Position Camera', desc: 'Stand where your webcam can see your full arm.' },
            { step: '02', icon: Activity, title: 'Start Session', desc: 'Click start and begin your bicep curls.' },
            { step: '03', icon: Shield, title: 'Get Feedback', desc: 'See real-time form corrections and rep counting.' },
            { step: '04', icon: BarChart3, title: 'Review Report', desc: 'Get AI-powered insights to improve next time.' },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="relative inline-flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-2xl bg-dark-700 border border-dark-500 flex items-center justify-center">
                  <item.icon className="w-7 h-7 text-accent-primary" />
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

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-dark-700 py-8 text-center">
        <p className="text-xs text-dark-400">
          FitMon — AI-Powered Fitness Intelligence. Built with MediaPipe, Socket.IO, and Gemini.
        </p>
      </footer>
    </div>
  );
}
