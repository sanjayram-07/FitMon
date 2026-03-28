import { createElement } from 'react';
import { Activity, ArrowRight, Shield, Sparkles, TimerReset, BarChart3, HeartPulse } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import useSessionStore from '../stores/useSessionStore';

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const sessionActive = useSessionStore((state) => state.sessionActive);
  const repCount = useSessionStore((state) => state.repCount);
  const postureScore = useSessionStore((state) => state.postureScore);
  const averageFsr = useSessionStore((state) => state.averageFsr);
  const engagementStatus = useSessionStore((state) => state.engagementStatus);
  const lastCompletedReport = useSessionStore((state) => state.lastCompletedReport);

  const dashboardMetrics = sessionActive
    ? {
        title: 'Live Session Snapshot',
        repValue: repCount,
        postureValue: postureScore,
        fsrValue: Math.round(averageFsr || 0),
        riskValue: engagementStatus,
      }
    : {
        title: 'Latest Session Snapshot',
        repValue: lastCompletedReport?.totalReps ?? 0,
        postureValue: lastCompletedReport?.avgPostureScore ?? 0,
        fsrValue: Math.round(lastCompletedReport?.perRepData?.at?.(-1)?.avgFsr ?? 0),
        riskValue: `${lastCompletedReport?.injuryRiskScore ?? 0}%`,
      };

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        <section className="glass-card p-8 lg:p-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-dark-300">Trainee Dashboard</p>
              <h1 className="text-4xl font-black text-white mt-3">Welcome back, {user?.name?.split(' ')[0] || 'Athlete'}</h1>
              <p className="text-dark-200 mt-4 max-w-2xl">
                Your dashboard now reflects the current live session when active, and falls back to the most recent completed report after session end.
              </p>
            </div>

            <Link to="/session" className="btn-primary inline-flex items-center gap-2 no-underline">
              {sessionActive ? 'Resume Live Session' : 'Start Bicep Curl Session'}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        <section className="glass-card p-8">
          <div className="flex items-center gap-3 mb-5">
            <BarChart3 className="w-5 h-5 text-accent-primary" />
            <h2 className="text-xl font-bold text-white">{dashboardMetrics.title}</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            <SnapshotCard label="Reps" value={dashboardMetrics.repValue} />
            <SnapshotCard label="Posture" value={dashboardMetrics.postureValue} />
            <SnapshotCard label="FSR" value={dashboardMetrics.fsrValue} />
            <SnapshotCard label="Risk / Engage" value={dashboardMetrics.riskValue} />
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-4">
          <DashboardCard icon={Activity} title="Real-time Curl Tracking" copy="Webcam pose inference runs in-browser at 10-15 FPS for low-latency feedback." />
          <DashboardCard icon={Shield} title="Protected Session Transport" copy="Every API request and Socket.IO connection is verified with a Firebase ID token." />
          <DashboardCard icon={Sparkles} title="Post-session Insights" copy="Gemini analysis runs only after the session ends, keeping the live loop non-blocking." />
        </section>

        <section className="glass-card p-8">
          <div className="flex items-center gap-3 mb-4">
            <TimerReset className="w-5 h-5 text-accent-primary" />
            <h2 className="text-xl font-bold text-white">Recommended session checklist</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-dark-200">
            <p className="rounded-2xl bg-dark-800/60 border border-dark-600 p-4">Position your full working arm in frame before pressing Start Session.</p>
            <p className="rounded-2xl bg-dark-800/60 border border-dark-600 p-4">Keep the elbow fixed to your torso to improve stability scoring and rep quality.</p>
            <p className="rounded-2xl bg-dark-800/60 border border-dark-600 p-4">Stream ESP32 FSR data to the same authenticated socket for fusion-based engagement checks.</p>
          </div>
        </section>
      </div>
    </div>
  );
}

function SnapshotCard({ label, value }) {
  return (
    <div className="rounded-3xl border border-dark-600 bg-dark-800/70 p-5">
      <p className="text-xs uppercase tracking-[0.25em] text-dark-300">{label}</p>
      <p className="text-3xl font-black text-white mt-3 tabular-nums">{value}</p>
    </div>
  );
}

function DashboardCard({ icon, title, copy }) {
  return (
    <div className="glass-card p-6">
      {createElement(icon, { className: 'w-5 h-5 text-accent-primary' })}
      <h3 className="text-lg font-bold text-white mt-4">{title}</h3>
      <p className="text-dark-200 text-sm mt-3">{copy}</p>
    </div>
  );
}
