const admin = require('firebase-admin');
const path = require('path');

let db = null;
let initialized = false;

function initializeFirebase() {
  if (initialized) return db;

  try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

    if (!serviceAccountPath) {
      console.warn('[Firebase] No service account path configured. Firestore disabled.');
      return null;
    }

    const resolvedPath = path.resolve(serviceAccountPath);
    const serviceAccount = require(resolvedPath);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    db = admin.firestore();
    initialized = true;
    console.log('[Firebase] Firestore initialized successfully.');
    return db;
  } catch (error) {
    console.warn('[Firebase] Failed to initialize:', error.message);
    console.warn('[Firebase] Firestore features will be disabled.');
    return null;
  }
}

function getDb() {
  if (!initialized) {
    initializeFirebase();
  }
  return db;
}

module.exports = { initializeFirebase, getDb };
