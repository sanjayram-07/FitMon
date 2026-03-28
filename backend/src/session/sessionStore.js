const { v4: uuidv4 } = require('uuid');

const sessions = new Map();

function createSession({ socketId, uid, email }) {
  const session = {
    id: uuidv4(),
    socketId,
    uid,
    email,
    startedAt: Date.now(),
    totalReps: 0,
    correctReps: 0,
    incorrectReps: 0,
    postureScoreSum: 0,
    frameCount: 0,
    warnings: [],
    perRepData: [],
    latestFSR: {
      value: 0,
      timestamp: 0,
    },
    fsrWindow: [],
    ineffectiveReps: 0,
    injuryRiskEvents: 0,
  };

  sessions.set(session.id, session);
  return session;
}

function getSessionBySocket(socketId) {
  for (const session of sessions.values()) {
    if (session.socketId === socketId) {
      return session;
    }
  }

  return null;
}

function getSessionById(sessionId) {
  return sessions.get(sessionId) || null;
}

function getAllSessions() {
  return Array.from(sessions.values());
}

function updateFrame(session, postureScore) {
  session.frameCount += 1;
  session.postureScoreSum += postureScore || 0;
}

function addWarning(session, warning) {
  if (!warning) {
    return;
  }

  session.warnings.push({
    message: warning,
    timestamp: Date.now(),
    rep: session.totalReps,
  });
}

function updateFSR(session, value, timestamp) {
  const normalizedTimestamp = timestamp || Date.now();
  session.latestFSR = { value, timestamp: normalizedTimestamp };
  session.fsrWindow.push({ value, timestamp: normalizedTimestamp });

  const cutoff = normalizedTimestamp - 500;
  session.fsrWindow = session.fsrWindow.filter((entry) => entry.timestamp >= cutoff);
}

function getAverageFSR(session) {
  if (!session.fsrWindow.length) {
    return 0;
  }

  const sum = session.fsrWindow.reduce((total, reading) => total + reading.value, 0);
  return sum / session.fsrWindow.length;
}

function recordRep(session, payload) {
  session.totalReps += 1;

  if (payload.repCorrect) {
    session.correctReps += 1;
  } else {
    session.incorrectReps += 1;
  }

  session.perRepData.push({
    repNumber: session.totalReps,
    correct: payload.repCorrect,
    formScore: payload.formScore || payload.postureScore || 0,
    minAngle: payload.minAngle ?? null,
    maxAngle: payload.maxAngle ?? null,
    peakFsr: payload.peakFsr ?? null,
    avgFsr: payload.avgFsr ?? null,
    fsrScore: payload.fsrScore ?? null,
    fusionScore: payload.fusionScore ?? null,
    engagementStatus: payload.engagementStatus ?? 'no_sensor',
    completedAt: Date.now(),
  });
}

function summarizeSession(session) {
  const avgPostureScore = session.frameCount
    ? Math.round(session.postureScoreSum / session.frameCount)
    : 0;
  const accuracy = session.totalReps
    ? Math.round((session.correctReps / session.totalReps) * 100)
    : 0;
  const injuryRiskScore = session.totalReps
    ? Math.min(100, Math.round((session.injuryRiskEvents / session.totalReps) * 100))
    : 0;

  return {
    sessionId: session.id,
    uid: session.uid,
    email: session.email,
    startedAt: session.startedAt,
    endedAt: Date.now(),
    duration: Math.round((Date.now() - session.startedAt) / 1000),
    totalReps: session.totalReps,
    correctReps: session.correctReps,
    incorrectReps: session.incorrectReps,
    accuracy,
    avgPostureScore,
    ineffectiveReps: session.ineffectiveReps,
    injuryRiskScore,
    warnings: session.warnings,
    perRepData: session.perRepData,
  };
}

function deleteSession(sessionId) {
  sessions.delete(sessionId);
}

module.exports = {
  createSession,
  getAverageFSR,
  getAllSessions,
  getSessionById,
  getSessionBySocket,
  updateFrame,
  addWarning,
  updateFSR,
  recordRep,
  summarizeSession,
  deleteSession,
};
