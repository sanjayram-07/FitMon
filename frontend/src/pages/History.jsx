import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { firebaseApp } from '../firebase/config';
import useAuthStore from '../store/useAuthStore';
import '../index.css';

const db = firebaseApp ? getFirestore(firebaseApp) : null;

export default function History() {
  const user = useAuthStore((state) => state.user);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    async function fetchSessions() {
      if (!db || !user?.uid) return;
      try {
        const q = query(collection(db, 'sessions'), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        const data = [];
        snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
        data.sort((a, b) => new Date(b.startedAt || 0) - new Date(a.startedAt || 0));
        setSessions(data);
      } catch (e) {
        console.error('Failed to fetch history', e);
      } finally {
        setLoading(false);
      }
    }
    fetchSessions();
  }, [user]);

  const getRiskLevel = (score) => {
    if (score < 25) return 'Low Risk';
    if (score < 55) return 'Moderate Risk';
    return 'High Risk';
  };

  const getRiskBadge = (score) => {
    if (score < 25) return { text: 'Low Risk', cls: 'badge-success' };
    if (score < 55) return { text: 'Moderate', cls: 'badge-warning' };
    return { text: 'High Risk', cls: 'badge-danger' };
  };

  const filteredSessions = sessions.filter((sess) => {
    if (filter === 'All') return true;
    return getRiskLevel(sess.injuryRiskScore || 0) === filter;
  });

  const handleDownload = (session) => {
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitmon-report-${new Date(session.startedAt || 0).toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const formatDate = (ts) =>
    new Date(ts).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: '80px' }}>

      <div className="container" style={{ paddingTop: '96px', maxWidth: '960px', margin: '0 auto' }}>

        {/* Page header */}
        <div style={{ marginBottom: '32px' }}>
          <p className="section-label">History</p>
          <h1 className="page-title" style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)' }}>Session History</h1>
        </div>

        {/* Filter row */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', flexWrap: 'wrap' }}>
          {['All', 'Low Risk', 'Moderate Risk', 'High Risk'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={filter === f ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '8px 18px', fontSize: '0.82rem' }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '64px' }}>
            Loading your sessions...
          </div>
        ) : filteredSessions.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px',
          }}>
            {filteredSessions.map((sess) => {
              const badge = getRiskBadge(sess.injuryRiskScore || 0);
              const postureColor = (sess.avgPostureScore || 0) >= 70 ? 'var(--accent)' : 'var(--warning)';
              return (
                <div key={sess.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                  {/* Top row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ color: 'var(--text)', fontWeight: 500, fontSize: '0.95rem', marginBottom: '4px' }}>
                        {formatDate(sess.startedAt)}
                      </p>
                      <p style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>
                        Duration: {formatDuration(sess.duration)}
                      </p>
                    </div>
                    <span className={badge.cls}>{badge.text}</span>
                  </div>

                  {/* Metrics */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <p style={{ color: 'var(--muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                        Posture Score
                      </p>
                      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.3rem', color: postureColor }}>
                        {sess.avgPostureScore || 0}
                        <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: '0.9rem' }}>/100</span>
                      </p>
                    </div>
                    <div>
                      <p style={{ color: 'var(--muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                        Reps
                      </p>
                      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.3rem', color: 'var(--text)' }}>
                        {sess.totalReps || 0}
                      </p>
                    </div>
                  </div>

                  {/* Download */}
                  <button
                    onClick={() => handleDownload(sess)}
                    className="btn-secondary"
                    style={{ width: '100%', padding: '10px', fontSize: '0.85rem', marginTop: 'auto' }}
                  >
                    Download Report
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '64px 32px' }}>
            <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>
              No sessions yet. Start your first session to see your history here.
            </p>
            <Link to="/session" className="btn-primary">Start a Session</Link>
          </div>
        )}
      </div>
    </div>
  );
}