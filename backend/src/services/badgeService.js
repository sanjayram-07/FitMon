const { admin, getDb } = require('../firebase/admin');

const EXERCISE_DEBUT_BADGES = {
  bicep_curl: { id: 'debut_bicep_curl', label: 'Bicep Curl Debut' },
  squat: { id: 'debut_squat', label: 'Squat Debut' },
  push_up: { id: 'debut_push_up', label: 'Push-Up Debut' },
  shoulder_press: { id: 'debut_shoulder_press', label: 'Shoulder Press Debut' },
};

const SESSION_MILESTONES = [
  { count: 1, id: 'first_workout', label: 'First Workout' },
  { count: 10, id: 'ten_workouts', label: '10 Workouts' },
  { count: 25, id: 'twentyfive_workouts', label: '25 Workouts' },
  { count: 50, id: 'fifty_workouts', label: '50 Workouts' },
];

const REP_MILESTONES = [
  { count: 50, id: 'fifty_reps', label: '50 Total Reps' },
  { count: 250, id: 'twofifty_reps', label: '250 Total Reps' },
  { count: 1000, id: 'thousand_reps', label: '1000 Total Reps' },
];

const STREAK_MILESTONES = [
  { count: 3, id: 'streak_3', label: '3-Day Streak' },
  { count: 7, id: 'streak_7', label: '7-Day Streak' },
  { count: 30, id: 'streak_30', label: '30-Day Streak' },
];

function dayKey(timestamp) {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function computeStreak(sessions) {
  const days = new Set(sessions.map((s) => dayKey(s.startedAt || s.endedAt || Date.now())));
  if (!days.size) return 0;

  const today = dayKey(Date.now());
  const yesterday = dayKey(Date.now() - 24 * 60 * 60 * 1000);
  if (!days.has(today) && !days.has(yesterday)) return 0;

  let cursor = days.has(today) ? new Date() : new Date(Date.now() - 24 * 60 * 60 * 1000);
  let streak = 0;
  while (days.has(dayKey(cursor.getTime()))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/**
 * Runs after every session ends. Recomputes the athlete's lifetime stats
 * from their session history and awards any badges newly earned — first
 * workout, session-count milestones, cumulative rep milestones, per-exercise
 * debut badges, and day-streak milestones.
 */
async function evaluateBadges(uid, latestSummary) {
  const db = getDb();
  const userRef = db.collection('users').doc(uid);

  const [userSnap, sessionsSnap] = await Promise.all([
    userRef.get(),
    db.collection('sessions').where('uid', '==', uid).get(),
  ]);

  const sessions = sessionsSnap.docs.map((doc) => doc.data());
  const totalSessions = sessions.length;
  const totalReps = sessions.reduce((sum, s) => sum + (s.totalReps || 0), 0);
  const exercisesDone = new Set(sessions.map((s) => s.exercise || 'bicep_curl'));
  const streak = computeStreak(sessions);

  const existingBadges = userSnap.exists ? userSnap.data().badges || [] : [];
  const existingIds = new Set(existingBadges.map((b) => b.id));
  const newlyEarned = [];

  const award = (badge) => {
    if (!existingIds.has(badge.id)) {
      existingIds.add(badge.id);
      newlyEarned.push({ ...badge, earnedAt: Date.now() });
    }
  };

  SESSION_MILESTONES.filter((m) => totalSessions >= m.count).forEach(award);
  REP_MILESTONES.filter((m) => totalReps >= m.count).forEach(award);
  STREAK_MILESTONES.filter((m) => streak >= m.count).forEach(award);

  const currentExercise = latestSummary.exercise || 'bicep_curl';
  if (exercisesDone.has(currentExercise) && EXERCISE_DEBUT_BADGES[currentExercise]) {
    award(EXERCISE_DEBUT_BADGES[currentExercise]);
  }

  const badges = [...existingBadges, ...newlyEarned];

  await userRef.set(
    {
      totalSessions,
      totalReps,
      streak,
      badges,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return { badges, newlyEarned, totalSessions, totalReps, streak };
}

module.exports = { evaluateBadges };
