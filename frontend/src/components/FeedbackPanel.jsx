import { useEffect, useRef, useState } from 'react';
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
  const sessionActive = useSessionStore((s) => s.sessionActive);

  const [displayedReps, setDisplayedReps] = useState(repCount);
  const [displayedPosture, setDisplayedPosture] = useState(postureScore);
  const [displayedPressure, setDisplayedPressure] = useState(averageFsr);
  const [displayedForm, setDisplayedForm] = useState(engagementStatus);
  const [delayedMessages, setDelayedMessages] = useState([]);

  const queueRef = useRef([]);
  const seenIdsRef = useRef(new Set());
  const timerRef = useRef(null);

  useEffect(() => {
    if (repCount !== displayedReps) {
      const timer = setTimeout(() => setDisplayedReps(repCount), 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [displayedReps, repCount]);

  useEffect(() => {
    if (postureScore !== displayedPosture) {
      const timer = setTimeout(() => setDisplayedPosture(postureScore), 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [displayedPosture, postureScore]);

  useEffect(() => {
    if (averageFsr !== displayedPressure) {
      const timer = setTimeout(() => setDisplayedPressure(averageFsr), 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [averageFsr, displayedPressure]);

  useEffect(() => {
    if (engagementStatus !== displayedForm) {
      const timer = setTimeout(() => setDisplayedForm(engagementStatus), 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [displayedForm, engagementStatus]);

  useEffect(() => {
    if (sessionActive) return undefined;
    setDelayedMessages([]);
    queueRef.current = [];
    seenIdsRef.current = new Set();
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    return undefined;
  }, [sessionActive]);

  useEffect(() => {
    if (!sessionActive) return undefined;
    if (!feedbackMessages?.length) {
      setDelayedMessages([]);
      return undefined;
    }

    feedbackMessages.forEach((msg) => {
      if (!seenIdsRef.current.has(msg.id)) {
        seenIdsRef.current.add(msg.id);
        queueRef.current.push(msg);
      }
    });

    const pumpQueue = () => {
      if (!queueRef.current.length) {
        timerRef.current = null;
        return;
      }

      const next = queueRef.current.shift();
      setDelayedMessages((prev) => {
        const updated = [...prev, next];
        return updated.slice(-3);
      });

      timerRef.current = setTimeout(pumpQueue, 700);
    };

    if (!timerRef.current) {
      timerRef.current = setTimeout(pumpQueue, 700);
    }

    return undefined;
  }, [feedbackMessages, sessionActive]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

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

  const getEngagementLabel = (status) => {
    switch (status) {
      case 'good': return { text: 'Strong', badgeClass: 'badge-success' };
      case 'low':
      case 'low_engagement':
        return { text: 'Low', badgeClass: 'badge-warning' };
      case 'risk':
      case 'injury_risk':
        return { text: 'Risk', badgeClass: 'badge-danger' };
      case 'weak_peak': return { text: 'Weak Peak', badgeClass: 'badge-warning' };
      case 'sensor_live': return { text: 'Connected', badgeClass: 'badge-blue' };
      case 'no_sensor': return { text: 'Not Ready', badgeClass: 'badge-blue' };
      default: return { text: 'Normal', badgeClass: 'badge-blue' };
    }
  };

  const engagement = getEngagementLabel(displayedForm);
  const repsUpdating = displayedReps !== repCount;
  const postureUpdating = displayedPosture !== postureScore;
  const pressureUpdating = displayedPressure !== averageFsr;
  const formUpdating = displayedForm !== engagementStatus;

  return (
    <div className="feedback-panel">
      <div className="card feedback-hero">
        <p className="feedback-label">Reps</p>
        <p className={`feedback-count tabular-nums metric-value ${repsUpdating ? 'metric-updating' : ''}`}>
          {displayedReps}
        </p>
        <p className="feedback-state text-accent">{getRepStateLabel()}</p>
      </div>

      <div className="feedback-grid">
        <div className="card feedback-card">
          <div className="feedback-row">
            <Gauge className="icon-sm text-accent" />
            <span className="feedback-card-label">Angle</span>
          </div>
          <p className="feedback-value tabular-nums">{angle}°</p>
        </div>

        <div className="card feedback-card">
          <div className="feedback-row">
            <Target className="icon-sm text-accent" />
            <span className="feedback-card-label">Posture</span>
          </div>
          <p
            className={`feedback-value tabular-nums metric-value ${getScoreColor(displayedPosture)} ${postureUpdating ? 'metric-updating' : ''}`}
          >
            {displayedPosture}
          </p>
        </div>

        <div className="card feedback-card">
          <div className="feedback-row">
            <Shield className="icon-sm text-accent" />
            <span className="feedback-card-label">Stability</span>
          </div>
          <p className={`feedback-value tabular-nums ${getScoreColor(elbowStability)}`}>{elbowStability}%</p>
        </div>

        <div className="card feedback-card">
          <div className="feedback-row">
            <TrendingUp className="icon-sm text-accent" />
            <span className="feedback-card-label">Smooth</span>
          </div>
          <p className={`feedback-value tabular-nums ${getScoreColor(smoothness)}`}>{smoothness}</p>
        </div>
      </div>

      <div className="feedback-grid">
        <div className="card feedback-card">
          <div className="feedback-row">
            <Zap className="icon-sm text-accent" />
            <span className="feedback-card-label">Pressure</span>
          </div>
          <p className={`feedback-value tabular-nums metric-value ${pressureUpdating ? 'metric-updating' : ''}`}>
            {Math.round(displayedPressure || 0)}
          </p>
        </div>

        <div className="card feedback-card">
          <div className="feedback-row feedback-row-between">
            <div className="feedback-row">
              <Zap className="icon-sm text-accent" />
              <span className="feedback-card-label">Form Quality</span>
            </div>
            <span className={`feedback-status ${engagement.badgeClass} ${formUpdating ? 'metric-updating' : ''}`}>
              {engagement.text}
            </span>
          </div>
        </div>
      </div>

      {delayedMessages.length > 0 && (
        <div className="card feedback-warning">
          <div className="feedback-row">
            <AlertTriangle className="icon-sm text-warning" />
            <span className="feedback-warning-label">Feedback</span>
          </div>
          <div className="feedback-messages">
            {delayedMessages.map((msg) => (
              <p key={msg.id} className="text-secondary fade-up">
                {msg.text}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
