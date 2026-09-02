import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, UserPlus, UserCheck } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import { authorizedRequest } from '../services/apiClient';
import '../index.css';

function initialsOf(name) {
  return (name || 'FA').split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
}

export default function People() {
  const token = useAuthStore((s) => s.token);
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pending, setPending] = useState(null);

  const load = async (q = '') => {
    setLoading(true);
    try {
      const query = q ? `?q=${encodeURIComponent(q)}` : '';
      const { people: results } = await authorizedRequest(`/api/social/people${query}`, token);
      setPeople(results || []);
    } catch (e) {
      console.error('Failed to load people', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    const timer = setTimeout(() => load(search), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const toggleFollow = async (person) => {
    setPending(person.uid);
    try {
      const method = person.isFollowing ? 'DELETE' : 'POST';
      await authorizedRequest(`/api/social/follow/${person.uid}`, token, { method });
      setPeople((prev) => prev.map((p) => (p.uid === person.uid ? { ...p, isFollowing: !p.isFollowing } : p)));
    } catch (e) {
      console.error('Failed to update follow state', e);
    } finally {
      setPending(null);
    }
  };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: '80px' }}>
      <div className="container" style={{ paddingTop: '96px', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <p className="section-label">People</p>
          <h1 className="page-title" style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)' }}>Find Athletes</h1>
        </div>

        <div style={{ position: 'relative', maxWidth: '420px', marginBottom: '28px' }}>
          <Search className="icon-sm" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input
            className="input-field"
            style={{ paddingLeft: '38px' }}
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '64px' }}>Loading athletes...</div>
        ) : people.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {people.map((person) => (
              <div key={person.uid} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px' }}>
                <Link to={`/u/${person.uid}`} style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, textDecoration: 'none' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%', background: 'var(--accent-dim)',
                    border: '1px solid var(--accent-border)', color: 'var(--accent)', fontFamily: 'var(--font-display)',
                    fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {initialsOf(person.name)}
                  </div>
                  <div>
                    <p style={{ color: 'var(--text)', fontWeight: 600, fontSize: '0.95rem' }}>{person.name}</p>
                    <p style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
                      {person.followersCount} followers • {person.totalSessions} sessions
                    </p>
                  </div>
                </Link>
                <button
                  onClick={() => toggleFollow(person)}
                  disabled={pending === person.uid}
                  className={person.isFollowing ? 'btn-secondary button-inline' : 'btn-primary button-inline'}
                  style={{ padding: '8px 16px', fontSize: '0.82rem', flexShrink: 0 }}
                >
                  {person.isFollowing ? <UserCheck className="icon-sm" /> : <UserPlus className="icon-sm" />}
                  {person.isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '64px 32px', color: 'var(--muted)' }}>
            No athletes found.
          </div>
        )}
      </div>
    </div>
  );
}
