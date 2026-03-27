import { useLocation, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Trophy,
  Target,
  AlertTriangle,
  TrendingUp,
  Clock,
  Repeat,
  CheckCircle2,
  XCircle,
  Zap,
  Brain,
  Shield,
  Lightbulb,
  ThumbsUp,
} from 'lucide-react';

export default function ReportPage() {
  const location = useLocation();
  const report = location.state?.report;

  if (!report) {
    return (
      <div className="min-h-screen pt-20 flex flex-col items-center justify-center text-center px-6">
        <div className="glass-card p-12 max-w-md">
          <Trophy className="w-12 h-12 text-dark-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No Report Found</h2>
          <p className="text-dark-300 text-sm mb-6">Complete a session to generate your workout report.</p>
          <Link to="/session" className="btn-primary inline-flex items-center gap-2 no-underline">
            Start a Session
          </Link>
        </div>
      </div>
    );
  }

  const insights = report.insights || {};
  const grade = insights.overallGrade || 'C';

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 animate-fade-in">
          <Link to="/session" className="p-2 rounded-xl bg-dark-700 hover:bg-dark-600 transition-colors no-underline text-dark-200">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Session Report</h1>
            <p className="text-sm text-dark-300">
              {new Date(report.startedAt).toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Grade + Summary */}
        <div className="glass-card p-8 mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-start gap-6">
            <div className={`grade-badge grade-${grade} shrink-0`}>
              {grade}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white mb-2">Overall Performance</h2>
              <p className="text-sm text-dark-200 leading-relaxed">
                {insights.summary || `You completed ${report.totalReps} reps with ${report.accuracy}% accuracy.`}
              </p>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <MetricCard icon={Repeat} label="Total Reps" value={report.totalReps} />
          <MetricCard icon={Target} label="Accuracy" value={`${report.accuracy}%`} color={report.accuracy >= 70 ? 'text-success' : 'text-warning'} />
          <MetricCard icon={Clock} label="Duration" value={formatDuration(report.duration)} />
          <MetricCard icon={TrendingUp} label="Posture Score" value={report.avgPostureScore} color={report.avgPostureScore >= 70 ? 'text-success' : 'text-warning'} />
        </div>

        {/* Rep Breakdown */}
        <div className="grid md:grid-cols-3 gap-4 mb-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="glass-card p-6 flex items-center gap-4">
            <CheckCircle2 className="w-8 h-8 text-success shrink-0" />
            <div>
              <p className="text-2xl font-bold text-white">{report.correctReps}</p>
              <p className="text-xs text-dark-300">Correct Reps</p>
            </div>
          </div>
          <div className="glass-card p-6 flex items-center gap-4">
            <XCircle className="w-8 h-8 text-danger shrink-0" />
            <div>
              <p className="text-2xl font-bold text-white">{report.incorrectReps}</p>
              <p className="text-xs text-dark-300">Incorrect Reps</p>
            </div>
          </div>
          <div className="glass-card p-6 flex items-center gap-4">
            <Shield className="w-8 h-8 text-warning shrink-0" />
            <div>
              <p className="text-2xl font-bold text-white">{report.injuryRiskScore}%</p>
              <p className="text-xs text-dark-300">Injury Risk</p>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="grid md:grid-cols-2 gap-6 mb-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          {/* Improvements */}
          {insights.improvements && insights.improvements.length > 0 && (
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-warning" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Improvements</h3>
              </div>
              <ul className="flex flex-col gap-3">
                {insights.improvements.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-dark-200">
                    <span className="text-warning font-bold mt-0.5">→</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Positive Feedback */}
          {insights.positiveFeedback && insights.positiveFeedback.length > 0 && (
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <ThumbsUp className="w-5 h-5 text-success" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">What You Did Well</h3>
              </div>
              <ul className="flex flex-col gap-3">
                {insights.positiveFeedback.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-dark-200">
                    <span className="text-success font-bold mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Warnings */}
        {insights.warnings && insights.warnings.length > 0 && (
          <div className="glass-card p-6 border-danger/20 mb-6 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-danger" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Caution</h3>
            </div>
            <ul className="flex flex-col gap-2">
              {insights.warnings.map((w, i) => (
                <li key={i} className="text-sm text-dark-200">⚠️ {w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Rep History Table */}
        {report.repHistory && report.repHistory.length > 0 && (
          <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Rep History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-600">
                    <th className="text-left py-2 px-3 text-dark-300 font-medium">Rep</th>
                    <th className="text-left py-2 px-3 text-dark-300 font-medium">Form Score</th>
                    <th className="text-left py-2 px-3 text-dark-300 font-medium">ROM</th>
                    <th className="text-left py-2 px-3 text-dark-300 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {report.repHistory.map((rep) => (
                    <tr key={rep.repNumber} className="border-b border-dark-700/50">
                      <td className="py-2 px-3 text-dark-100 font-medium">#{rep.repNumber}</td>
                      <td className="py-2 px-3">
                        <span className={`font-bold ${rep.formScore >= 60 ? 'text-success' : 'text-danger'}`}>
                          {rep.formScore}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-dark-200">
                        {rep.minAngle !== undefined ? `${Math.round(rep.minAngle)}° — ${Math.round(rep.maxAngle)}°` : '—'}
                      </td>
                      <td className="py-2 px-3">
                        {rep.correct ? (
                          <span className="text-success font-medium">✓ Good</span>
                        ) : (
                          <span className="text-danger font-medium">✗ Fix</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action */}
        <div className="text-center mt-10 animate-fade-in" style={{ animationDelay: '0.7s' }}>
          <Link to="/session" className="btn-primary inline-flex items-center gap-2 no-underline">
            <Repeat className="w-4 h-4" />
            Start New Session
          </Link>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color = 'text-white' }) {
  return (
    <div className="glass-card p-5 text-center">
      <Icon className="w-5 h-5 text-accent-primary mx-auto mb-2" />
      <p className={`text-2xl font-bold ${color} tabular-nums`}>{value}</p>
      <p className="text-xs text-dark-300 mt-1">{label}</p>
    </div>
  );
}
