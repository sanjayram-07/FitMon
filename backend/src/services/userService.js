const { admin, getDb } = require('../firebase/admin');

async function ensureUserProfile(decodedToken) {
  const db = getDb();
  const userRef = db.collection('users').doc(decodedToken.uid);
  const snapshot = await userRef.get();

  const defaultProfile = {
    name: decodedToken.name || decodedToken.email?.split('@')[0] || 'FitMon User',
    email: decodedToken.email || '',
    role: 'trainee',
    goals: [],
    preferences: {
      dominantArm: 'right',
      units: 'metric',
    },
  };

  if (!snapshot.exists) {
    await userRef.set({
      ...defaultProfile,
      photoURL: decodedToken.picture || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } else {
    await userRef.set(
      {
        name: decodedToken.name || snapshot.data().name || defaultProfile.name,
        email: decodedToken.email || snapshot.data().email || defaultProfile.email,
        photoURL: decodedToken.picture || snapshot.data().photoURL || '',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }

  const refreshed = await userRef.get();
  return {
    uid: decodedToken.uid,
    ...refreshed.data(),
  };
}

module.exports = { ensureUserProfile };
