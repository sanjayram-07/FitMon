import { Gauge, Target, Zap, AlertTriangle, TrendingUp, Shield } from 'lucide-react';
import useSessionStore from '../stores/useSessionStore';

export default function FeedbackPanel() {
  const repCount = useSessionStore((s) => s.repCount);
  const angle = useSessionStore((s) => s.angle);
  const postureScore = useSessionStore((s) => s.postureScore);
  const elbowStability = useSessionStore((s) => s.elbowStability);
  const smoothness = useSessionStore((s) => s.smoothness);
  const averageFsr = useSessionStore((s) => s.averageFsr);
  const engagementStatus = useSessionStore((s) => s.engagementStatus);
  const feedbackMessages = useSessionStore((s) => s.feedbackMessages);
  const repState = useSessionStore((s) => s.repState);

  const getRepStateLabel = () => {
    switch (repState) {
      case 'DOWN': return 'Ready';
      case 'UP': return 'Contracted';
      case 'READY': return 'Tracking';
      case 'CURLING': return 'Curling Up';
      case 'PEAK': return 'Peak';
      case 'EXTENDING': return 'Extending';
      default: return 'Ready';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-danger';
  };

  const getEngagementLabel = () => {
    switch (engagementStatus) {
      case 'good': return { text: 'Engaged', color: 'text-success' };
      case 'low':
      case 'low_engagement':
        return { text: 'Low', color: 'text-warning' };
      case 'risk':
      case 'injury_risk':
        return { text: 'Risk!', color: 'text-danger' };
      case 'weak_peak': return { text: 'Weak Peak', color: 'text-warning' };
      case 'sensor_live': return { text: 'Sensor Live', color: 'text-info' };
      case 'no_sensor': return { text: 'No Sensor', color: 'text-dark-300' };
      default: return { text: 'Normal', color: 'text-dark-200' };
    }
  };

  const engagement = getEngagementLabel();

  return (
    <div className="flex flex-col gap-4">
      <div className="glass-card p-6 text-center">
        <p className="text-xs uppercase tracking-widest text-dark-300 mb-1">Reps</p>
        <p className="text-6xl font-extrabold text-white tabular-nums">{repCount}</p>
        <p className="text-sm text-accent-secondary mt-2 font-medium">{getRepStateLabel()}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Gauge className="w-4 h-4 text-accent-primary" />
            <span className="text-xs text-dark-300">Angle</span>
          </div>
          <p className="text-2xl font-bold text-white tabular-nums">{angle}°</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-accent-primary" />
            <span className="text-xs text-dark-300">Posture</span>
          </div>
          <p className={`text-2xl font-bold tabular-nums ${getScoreColor(postureScore)}`}>{postureScore}</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-accent-primary" />
            <span className="text-xs text-dark-300">Stability</span>
          </div>
          <p className={`text-2xl font-bold tabular-nums ${getScoreColor(elbowStability)}`}>{elbowStability}%</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-accent-primary" />
            <span className="text-xs text-dark-300">Smooth</span>
          </div>
          <p className={`text-2xl font-bold tabular-nums ${getScoreColor(smoothness)}`}>{smoothness}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-accent-primary" />
            <span className="text-xs text-dark-300">FSR Value</span>
          </div>
          <p className="text-2xl font-bold text-white tabular-nums">{Math.round(averageFsr || 0)}</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent-primary" />
              <span className="text-xs text-dark-300">Engagement</span>
            </div>
            <span className={`text-sm font-bold ${engagement.color}`}>{engagement.text}</span>
          </div>
        </div>
      </div>

      {feedbackMessages.length > 0 && (
        <div className="glass-card p-4 border-warning/30">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <span className="text-xs text-warning font-semibold uppercase tracking-wider">Feedback</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {feedbackMessages.map((msg) => (
              <p key={msg.id} className="text-sm text-dark-100 animate-fade-in">
                {msg.text}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
