const { admin, getDb } = require('../firebase/admin');
const { generateSessionInsights } = require('./geminiService');

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

  return {
    ...summary,
    firestoreId,
    insights,
  };
}

module.exports = { buildSessionReport };
