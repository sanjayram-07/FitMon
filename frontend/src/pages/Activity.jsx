import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { firebaseApp } from '../firebase/config';
import useAuthStore from '../store/useAuthStore';
import { buildReportPdf, getReportPdfFileName } from '../utils/reportPdf';
import { EXERCISES } from '../utils/cvLogic';
import { authorizedRequest } from '../services/apiClient';
import '../index.css';

const db = firebaseApp ? getFirestore(firebaseApp) : null;

const exerciseLabel = (id) => EXERCISES[id]?.label || 'Bicep Curl';

export default function Activity() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const [sessions, setSessions] = useState([]);
  const [feed, setFeed] = useState([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [tab, setTab] = useState('mine');

  useEffect(() => {
    async function fetchSessions() {
      if (!db || (!user?.uid && !user?.email)) {
        setLoading(false);
        return;
      }
      try {
        const sessionsRef = collection(db, 'sessions');
        const queries = [];
        if (user?.uid) queries.push(getDocs(query(sessionsRef, where('uid', '==', user.uid))));
        if (user?.email) queries.push(getDocs(query(sessionsRef, where('email', '==', user.email))));

        const snapshots = await Promise.all(queries);
        const sessionMap = new Map();
        snapshots.forEach((snap) => {
          snap.forEach((docSnap) => {
            sessionMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
          });
        });

        const data = Array.from(sessionMap.values());
        data.sort((a, b) => getSessionTimestamp(b) - getSessionTimestamp(a));
        setSessions(data);
      } catch (e) {
        console.error('Failed to fetch history', e);
      } finally {
        setLoading(false);
      }
    }
    fetchSessions();
  }, [user]);

  useEffect(() => {
    async function fetchFeed() {
      if (tab !== 'following' || !token) return;
      setFeedLoading(true);
      try {
        const { activities } = await authorizedRequest('/api/social/feed', token);
        setFeed(activities || []);
      } catch (e) {
        console.error('Failed to fetch following feed', e);
      } finally {
        setFeedLoading(false);
      }
    }
    fetchFeed();
  }, [tab, token]);

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

  const getSessionTimestamp = (session) => {
    const ts = session?.startedAt ?? session?.createdAt ?? session?.endedAt;
    if (!ts) return 0;
    if (typeof ts === 'number') return ts;
    if (typeof ts?.toDate === 'function') return ts.toDate().getTime();
    if (typeof ts?.seconds === 'number') return ts.seconds * 1000;
    const parsed = new Date(ts).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const filteredSessions = sessions.filter((sess) => {
    if (filter === 'All') return true;
    return getRiskLevel(sess.injuryRiskScore || 0) === filter;
  });

  const handleDownload = (session) => {
    const pdf = buildReportPdf(session);
    if (!pdf) return;
    pdf.save(getReportPdfFileName(session));
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
        <div style={{ marginBottom: '24px' }}>
          <p className="section-label">Activity</p>
          <h1 className="page-title" style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)' }}>Your Activity</h1>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <button
            onClick={() => setTab('mine')}
            className={tab === 'mine' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '8px 18px', fontSize: '0.82rem' }}
          >
            My Activity
          </button>
          <button
            onClick={() => setTab('following')}
            className={tab === 'following' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '8px 18px', fontSize: '0.82rem' }}
          >
            Following
          </button>
        </div>

        {tab === 'mine' && (
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
        )}

        {/* Content */}
        {tab === 'following' ? (
          feedLoading ? (
            <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '64px' }}>
              Loading activity from people you follow...
            </div>
          ) : feed.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {feed.map((item) => (
                <div key={item.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px' }}>
                  <div>
                    <p style={{ color: 'var(--text)', fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px' }}>
                      {item.name || item.email || 'FitMon athlete'}
                    </p>
                    <p style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>
                      {exerciseLabel(item.exercise)} • {formatDate(getSessionTimestamp(item))}
                    </p>
                  </div>
                  <span className="badge-blue">{item.totalReps || 0} reps</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '64px 32px' }}>
              <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>
                No activity yet from people you follow. Head to People to find athletes to follow.
              </p>
              <Link to="/people" className="btn-primary">Find People</Link>
            </div>
          )
        ) : loading ? (
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
              const repsCount = sess.totalReps ?? (sess.correctReps || 0) + (sess.incorrectReps || 0);
              return (
                <div key={sess.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                  {/* Top row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ color: 'var(--text)', fontWeight: 500, fontSize: '0.95rem', marginBottom: '4px' }}>
                        {formatDate(getSessionTimestamp(sess))}
                      </p>
                      <p style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>
                        Duration: {formatDuration(sess.duration)}
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                      <span className="badge-blue">{exerciseLabel(sess.exercise)}</span>
                      <span className={badge.cls}>{badge.text}</span>
                    </div>
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
                        {repsCount || 0}
                      </p>
                    </div>
                  </div>

                  {/* Download */}
                  <button
                    onClick={() => handleDownload(sess)}
                    className="btn-secondary"
                    style={{ width: '100%', padding: '10px', fontSize: '0.85rem', marginTop: 'auto' }}
                  >
                    Download PDF
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