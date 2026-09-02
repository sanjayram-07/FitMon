import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserPlus, UserCheck } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import { authorizedRequest } from '../services/apiClient';
import '../index.css';

function initialsOf(name) {
  return (name || 'FA').split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
}

export default function PublicProfile() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function load() {
      if (!token) return;
      setLoading(true);
      try {
        const data = await authorizedRequest(`/api/social/users/${uid}`, token);
        if (data.isSelf) {
          navigate('/profile', { replace: true });
          return;
        }
        setProfile(data);
      } catch (e) {
        console.error('Failed to load profile', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [uid, token, navigate]);

  const toggleFollow = async () => {
    setBusy(true);
    try {
      const method = profile.isFollowing ? 'DELETE' : 'POST';
      await authorizedRequest(`/api/social/follow/${uid}`, token, { method });
      setProfile((p) => ({
        ...p,
        isFollowing: !p.isFollowing,
        followersCount: p.followersCount + (p.isFollowing ? -1 : 1),
      }));
    } catch (e) {
      console.error('Failed to update follow state', e);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
        <div className="container" style={{ paddingTop: '96px', textAlign: 'center', color: 'var(--muted)' }}>Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
        <div className="container" style={{ paddingTop: '96px', textAlign: 'center', color: 'var(--muted)' }}>Athlete not found.</div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: '80px' }}>
      <div className="container" style={{ paddingTop: '96px', maxWidth: '760px', margin: '0 auto' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '24px', padding: '28px', marginBottom: '24px' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%', background: 'var(--accent-dim)',
            border: '1px solid var(--accent-border)', color: 'var(--accent)', fontFamily: 'var(--font-display)',
            fontSize: '1.6rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            {initialsOf(profile.name)}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--text)' }}>{profile.name}</p>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{profile.goal || 'FitMon athlete'}</p>
          </div>
          <button
            onClick={toggleFollow}
            disabled={busy}
            className={profile.isFollowing ? 'btn-secondary button-inline' : 'btn-primary button-inline'}
            style={{ padding: '10px 20px' }}
          >
            {profile.isFollowing ? <UserCheck className="icon-sm" /> : <UserPlus className="icon-sm" />}
            {profile.isFollowing ? 'Following' : 'Follow'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <StatCard label="Followers" value={profile.followersCount} />
          <StatCard label="Following" value={profile.followingCount} />
          <StatCard label="Sessions" value={profile.totalSessions} />
        </div>

        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--text)', marginBottom: '16px' }}>Badges</h2>
          {profile.badges?.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {profile.badges.map((b) => (
                <span key={b.id || b} className="badge-blue" style={{ padding: '8px 14px' }}>
                  {b.label || b}
                </span>
              ))}
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '32px', color: 'var(--muted)' }}>
              No badges earned yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '20px 12px' }}>
      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.4rem', color: 'var(--text)' }}>{value ?? 0}</p>
      <p style={{ color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px' }}>{label}</p>
    </div>
  );
}
