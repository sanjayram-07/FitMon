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
    <div className="page dashboard-page">
      <div className="container">
        <section className="card dashboard-hero-card">
          <div className="dashboard-hero">
            <div>
              <p className="section-label">Trainee Dashboard</p>
              <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0] || 'Athlete'}</h1>
              <p className="dashboard-copy">
                Your dashboard now reflects the current live session when active, and falls back to the most recent completed report after session end.
              </p>
            </div>

            <Link to="/session" className="btn-primary button-inline">
              {sessionActive ? 'Resume Live Session' : 'Start Bicep Curl Session'}
              <ArrowRight className="icon-sm" />
            </Link>
          </div>
        </section>

        {sessionActive ? (
          <section className="card live-banner live-session-banner fade-up">
            <span className="live-dot" aria-hidden />
            <div>
              <p className="section-label">Live now</p>
              <p className="text-primary">
                Session is active — metrics below mirror your current socket stream.
              </p>
            </div>
          </section>
        ) : null}

        {lastCompletedReport && !sessionActive ? (
          <section className="card report-card dashboard-last-report fade-up">
            <p className="section-label">Last completed report</p>
            <h2 className="section-title">Session snapshot</h2>
            <p className="text-secondary">
              {lastCompletedReport.totalReps ?? 0} reps · Avg posture {lastCompletedReport.avgPostureScore ?? '—'} · Injury risk{' '}
              {lastCompletedReport.injuryRiskScore ?? 0}%
            </p>
          </section>
        ) : null}

        <section className="card dashboard-metrics">
          <div className="section-header">
            <BarChart3 className="icon-md text-accent" />
            <h2 className="section-title">{dashboardMetrics.title}</h2>
          </div>
          <div className="metrics-grid">
            <SnapshotCard label="Reps" value={dashboardMetrics.repValue} />
            <SnapshotCard label="Posture" value={dashboardMetrics.postureValue} />
            <SnapshotCard label="FSR" value={dashboardMetrics.fsrValue} />
            <SnapshotCard label="Risk / Engage" value={dashboardMetrics.riskValue} />
          </div>
        </section>

        <section className="dashboard-grid">
          <DashboardCard icon={Activity} title="Real-time Curl Tracking" copy="Webcam pose inference runs in-browser at 10-15 FPS for low-latency feedback." />
          <DashboardCard icon={Shield} title="Protected Session Transport" copy="Every API request and Socket.IO connection is verified with a Firebase ID token." />
          <DashboardCard icon={Sparkles} title="Post-session Insights" copy="Gemini analysis runs only after the session ends, keeping the live loop non-blocking." />
        </section>

        <section className="card dashboard-checklist">
          <div className="section-header">
            <TimerReset className="icon-md text-accent" />
            <h2 className="section-title">Recommended session checklist</h2>
          </div>
          <div className="dashboard-checklist-grid">
            <p className="dashboard-checklist-item">Position your full working arm in frame before pressing Start Session.</p>
            <p className="dashboard-checklist-item">Keep the elbow fixed to your torso to improve stability scoring and rep quality.</p>
            <p className="dashboard-checklist-item">Stream ESP32 FSR data to the same authenticated socket for fusion-based engagement checks.</p>
          </div>
        </section>
      </div>
    </div>
  );
}

function SnapshotCard({ label, value }) {
  const normalized = label.toLowerCase();
  const tone = normalized.includes('risk')
    ? 'metric-value--danger'
    : normalized.includes('fsr')
      ? 'metric-value--blue'
      : 'metric-value--accent';

  return (
    <div className="card metric-card">
      <p className="metric-label">{label}</p>
      <p className={`metric-value tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}

function DashboardCard({ icon, title, copy }) {
  return (
    <div className="card dashboard-card">
      {createElement(icon, { className: 'icon-md text-accent' })}
      <h3 className="card-title">{title}</h3>
      <p className="text-secondary">{copy}</p>
    </div>
  );
}
