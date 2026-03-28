import { useState } from 'react';
import '../index.css';

const workouts = [
  { id: 1, name: 'Push-Up Form Guide', muscle: 'Chest', difficulty: 'Beginner', ytId: 'IODxDxX7oi4' },
  { id: 2, name: 'Bench Press Technique', muscle: 'Chest', difficulty: 'Intermediate', ytId: 'rT7DgCr-3pg' },
  { id: 3, name: 'Pull-Up Tutorial', muscle: 'Back', difficulty: 'Intermediate', ytId: 'eGo4IYlbE5g' },
  { id: 4, name: 'Deadlift Form Guide', muscle: 'Back', difficulty: 'Advanced', ytId: 'op9kVnSso6Q' },
  { id: 5, name: 'Squat Technique', muscle: 'Legs', difficulty: 'Beginner', ytId: 'aclHkVaku9U' },
  { id: 6, name: 'Leg Press Guide', muscle: 'Legs', difficulty: 'Intermediate', ytId: 'IZxyjW7LOLM' },
  { id: 7, name: 'Shoulder Press Form', muscle: 'Shoulders', difficulty: 'Intermediate', ytId: 'qEwKCR5JCog' },
  { id: 8, name: 'Lateral Raise Tutorial', muscle: 'Shoulders', difficulty: 'Beginner', ytId: '3VcKaXpzqRo' },
  { id: 9, name: 'Bicep Curl Guide', muscle: 'Arms', difficulty: 'Beginner', ytId: 'ykJmrZ5v0Oo' },
  { id: 10, name: 'Tricep Dips Tutorial', muscle: 'Arms', difficulty: 'Intermediate', ytId: '0326dy_-CzM' },
  { id: 11, name: 'Plank Variations', muscle: 'Core', difficulty: 'Beginner', ytId: 'ASdvN_XEl_c' },
  { id: 12, name: 'Ab Workout Routine', muscle: 'Core', difficulty: 'Intermediate', ytId: 'DHD1-2P4ngg' },
];

export default function Workout() {
  const [search, setSearch] = useState('');

  const filtered = workouts.filter((workout) =>
    workout.name.toLowerCase().includes(search.toLowerCase()) ||
    workout.muscle.toLowerCase().includes(search.toLowerCase())
  );

  const difficultyBadge = (difficulty) => {
    if (difficulty === 'Beginner') return 'badge-success';
    if (difficulty === 'Intermediate') return 'badge-warning';
    return 'badge-danger';
  };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: '80px' }}>

      <div className="container" style={{ paddingTop: '96px' }}>
        <div style={{ marginBottom: '32px' }}>
          <p className="section-label">Workouts</p>
          <h1 className="page-title">Workouts</h1>
        </div>

        <div style={{ maxWidth: '520px', marginBottom: '32px' }}>
          <input
            className="input-field"
            placeholder="Search by workout or muscle group..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '20px',
          }}
        >
          {filtered.map((workout) => (
            <div key={workout.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  position: 'relative',
                  paddingTop: '56.25%',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                }}
              >
                <iframe
                  src={`https://www.youtube.com/embed/${workout.ytId}?rel=0&controls=0`}
                  title={workout.name}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    border: '0',
                  }}
                />
              </div>

              <div>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)' }}>
                  {workout.name}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                  <span className="badge-blue">{workout.muscle}</span>
                  <span className={difficultyBadge(workout.difficulty)}>{workout.difficulty}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}