const { admin, getDb } = require('../firebase/admin');
const { generateSessionInsights } = require('./geminiService');
const { evaluateBadges } = require('./badgeService');

async function saveSessionSummary(summary) {
  const db = getDb();
  const sessionRef = db.collection('sessions').doc(summary.sessionId);

  await sessionRef.set({
    ...summary,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return sessionRef.id;
}

async function buildSessionReport(summary) {
  const firestoreId = await saveSessionSummary(summary);
  const insights = await generateSessionInsights(summary);

  if (firestoreId) {
    const db = getDb();
    await db.collection('sessions').doc(firestoreId).set(
      {
        insights,
        insightsUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }

  let newlyEarnedBadges = [];
  if (summary.uid) {
    try {
      const badgeResult = await evaluateBadges(summary.uid, summary);
      newlyEarnedBadges = badgeResult.newlyEarned;
    } catch (error) {
      console.error('[Badges] Failed to evaluate badges:', error.message);
    }
  }

  return {
    ...summary,
    firestoreId,
    insights,
    newlyEarnedBadges,
  };
}

module.exports = { buildSessionReport };
