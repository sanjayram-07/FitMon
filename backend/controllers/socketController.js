const sessionManager = require('../services/sessionManager');
const { processFrame } = require('../services/cvProcessor');
const { analyzeFusion, getRepEngagement } = require('../services/fusionEngine');
const { generateReport } = require('../services/reportGenerator');

/**
 * Register all Socket.IO event handlers.
 */
function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // ─── START SESSION ───
    socket.on('start_session', (data, callback) => {
      console.log(`[Socket] start_session from ${socket.id}`);
      const session = sessionManager.createSession(socket.id);

      console.log(`[Session] Created: ${session.id}`);

      if (typeof callback === 'function') {
        callback({ sessionId: session.id, status: 'started' });
      }

      socket.emit('session_started', { sessionId: session.id });
    });

    // ─── FRAME DATA (landmarks from client MediaPipe) ───
    socket.on('frame', (data) => {
      const session = sessionManager.getSessionBySocket(socket.id);
      if (!session) return;

      const { landmarks, timestamp } = data;
      if (!landmarks) return;

      // Process CV
      const frameResult = processFrame(session, landmarks, timestamp || Date.now());

      if (!frameResult.valid) {
        socket.emit('feedback', {
          type: 'warning',
          message: frameResult.message,
          repCount: session.totalReps,
        });
        return;
      }

      // Update frame stats
      sessionManager.updateFrame(session, frameResult.postureScore);

      // Run fusion analysis
      const fusionResult = analyzeFusion(session, frameResult);

      // Handle completed rep
      if (frameResult.repCompleted) {
        const engagement = getRepEngagement(session);
        sessionManager.recordRep(session, frameResult.repCorrect, {
          formScore: frameResult.formScore,
          minAngle: frameResult.repData?.minAngle,
          maxAngle: frameResult.repData?.maxAngle,
          engagement,
        });
      }

      // Collect all feedback messages
      const allFeedback = [
        ...frameResult.feedback,
        ...fusionResult.alerts,
      ];

      // Add warnings to session
      allFeedback.forEach((msg) => {
        sessionManager.addWarning(session, msg);
      });

      // Emit feedback to client
      socket.emit('feedback', {
        type: 'update',
        angle: frameResult.angle,
        repCount: session.totalReps,
        repState: frameResult.repState,
        postureScore: frameResult.postureScore,
        elbowStability: frameResult.elbowStability,
        smoothness: frameResult.smoothness,
        formScore: frameResult.formScore,
        cvScore: fusionResult.cvScore,
        fsrScore: fusionResult.fsrScore,
        engagementStatus: fusionResult.engagementStatus,
        feedback: allFeedback,
        repCompleted: frameResult.repCompleted,
        repCorrect: frameResult.repCorrect,
      });
    });

    // ─── IOT DATA (FSR from ESP32) ───
    socket.on('iot_data', (data) => {
      const session = sessionManager.getSessionBySocket(socket.id);
      if (!session) return;

      const { value, timestamp } = data;
      if (typeof value !== 'number') return;

      sessionManager.updateFSR(session, value, timestamp || Date.now());
    });

    // ─── END SESSION ───
    socket.on('end_session', async (data, callback) => {
      const session = sessionManager.getSessionBySocket(socket.id);
      if (!session) {
        if (typeof callback === 'function') {
          callback({ error: 'No active session' });
        }
        return;
      }

      console.log(`[Session] Ending: ${session.id}`);

      // Generate summary
      const summary = sessionManager.generateSummary(session);

      // Generate full report (Firestore + Gemini)
      const report = await generateReport(summary);

      // Send to client
      socket.emit('session_summary', report);

      if (typeof callback === 'function') {
        callback({ status: 'completed', report });
      }

      // Clean up
      sessionManager.deleteSession(session.id);
      console.log(`[Session] Cleaned up: ${session.id}`);
    });

    // ─── DISCONNECT ───
    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
      const session = sessionManager.getSessionBySocket(socket.id);
      if (session) {
        sessionManager.deleteSession(session.id);
        console.log(`[Session] Auto-cleaned on disconnect: ${session.id}`);
      }
    });
  });
}

module.exports = { registerSocketHandlers };
