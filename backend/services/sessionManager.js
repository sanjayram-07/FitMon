const { v4: uuidv4 } = require('uuid');

// In-memory store
const sessions = new Map();

/**
 * Create a new session.
 */
function createSession(socketId) {
  const sessionId = uuidv4();
  const session = {
    id: sessionId,
    socketId,
    startedAt: Date.now(),
    totalReps: 0,
    correctReps: 0,
    incorrectReps: 0,
    postureScoreSum: 0,
    frameCount: 0,
    warnings: [],
    repHistory: [],
    currentRep: {
      minAngle: 180,
      maxAngle: 0,
      peakFSR: 0,
      avgFSR: 0,
      fsrReadings: [],
      formScore: 0,
      startTime: null,
    },
    // State machine
    repState: 'IDLE', // IDLE → CURLING → PEAK → EXTENDING → IDLE
    prevAngle: null,
    prevTimestamp: null,
    velocityHistory: [],
    // FSR data
    latestFSR: { value: 0, timestamp: 0 },
    fsrWindow: [],       // time-window buffer
    fsrWindowMs: 500,    // averaging window
    // Engagement tracking
    ineffectiveReps: 0,
    injuryRiskEvents: 0,
  };

  sessions.set(sessionId, session);
  return session;
}

/**
 * Get session by ID.
 */
function getSession(sessionId) {
  return sessions.get(sessionId) || null;
}

/**
 * Get session by socket ID.
 */
function getSessionBySocket(socketId) {
  for (const session of sessions.values()) {
    if (session.socketId === socketId) return session;
  }
  return null;
}

/**
 * Update frame count and posture score.
 */
function updateFrame(session, postureScore) {
  session.frameCount++;
  session.postureScoreSum += postureScore;
}

/**
 * Record a completed rep.
 */
function recordRep(session, isCorrect, repData) {
  session.totalReps++;

  if (isCorrect) {
    session.correctReps++;
  } else {
    session.incorrectReps++;
  }

  session.repHistory.push({
    repNumber: session.totalReps,
    correct: isCorrect,
    ...repData,
  });

  // Reset current rep tracker
  session.currentRep = {
    minAngle: 180,
    maxAngle: 0,
    peakFSR: 0,
    avgFSR: 0,
    fsrReadings: [],
    formScore: 0,
    startTime: null,
  };
}

/**
 * Add warning to session.
 */
function addWarning(session, warning) {
  session.warnings.push({
    message: warning,
    timestamp: Date.now(),
    rep: session.totalReps,
  });
}

/**
 * Update FSR data with time-windowed averaging.
 */
function updateFSR(session, value, timestamp) {
  session.latestFSR = { value, timestamp };
  session.fsrWindow.push({ value, timestamp });

  // Prune old readings outside window
  const cutoff = timestamp - session.fsrWindowMs;
  session.fsrWindow = session.fsrWindow.filter((r) => r.timestamp >= cutoff);

  // Update current rep FSR
  session.currentRep.fsrReadings.push(value);
  session.currentRep.peakFSR = Math.max(session.currentRep.peakFSR, value);
}

/**
 * Get averaged FSR value from current window.
 */
function getAveragedFSR(session) {
  if (session.fsrWindow.length === 0) return 0;
  const sum = session.fsrWindow.reduce((acc, r) => acc + r.value, 0);
  return sum / session.fsrWindow.length;
}

/**
 * Generate final session summary.
 */
function generateSummary(session) {
  const duration = (Date.now() - session.startedAt) / 1000;
  const avgPosture = session.frameCount > 0
    ? Math.round(session.postureScoreSum / session.frameCount)
    : 0;
  const accuracy = session.totalReps > 0
    ? Math.round((session.correctReps / session.totalReps) * 100)
    : 0;

  // Injury risk score (0-100): based on proportion of risk events
  const injuryRisk = session.totalReps > 0
    ? Math.min(100, Math.round((session.injuryRiskEvents / session.totalReps) * 100))
    : 0;

  return {
    sessionId: session.id,
    duration: Math.round(duration),
    totalReps: session.totalReps,
    correctReps: session.correctReps,
    incorrectReps: session.incorrectReps,
    accuracy,
    avgPostureScore: avgPosture,
    ineffectiveReps: session.ineffectiveReps,
    injuryRiskScore: injuryRisk,
    warnings: session.warnings,
    repHistory: session.repHistory,
    startedAt: session.startedAt,
    endedAt: Date.now(),
  };
}

/**
 * Delete session from memory.
 */
function deleteSession(sessionId) {
  sessions.delete(sessionId);
}

module.exports = {
  createSession,
  getSession,
  getSessionBySocket,
  updateFrame,
  recordRep,
  addWarning,
  updateFSR,
  getAveragedFSR,
  generateSummary,
  deleteSession,
};
