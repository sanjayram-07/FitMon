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

  return {
    ...summary,
    firestoreId,
    insights,
  };
}

module.exports = { buildSessionReport };
