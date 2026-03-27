const sessionManager = require('../services/sessionManager');
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

      if (typeof callback === 'function') {
        callback({ sessionId: session.id, status: 'started' });
      }

      socket.emit('session_started', { sessionId: session.id });
    });

    // ─── CV RESULTS (Processed results from Python or Frontend) ───
    socket.on('cv_results', (data) => {
      const session = sessionManager.getSessionBySocket(socket.id);
      if (!session) return;

      const {
        angle,
        repCount,
        repState,
        postureScore,
        elbowStability,
        smoothness,
        feedback,
        repCompleted,
        repCorrect,
        landmarks,
      } = data;

      // Update frame stats internally for report consistency
      sessionManager.updateFrame(session, postureScore || 0);

      // Handle completed rep
      if (repCompleted) {
        // Here we still call fusion engine to evaluate engagement
        const engagement = getRepEngagement(session);
        sessionManager.recordRep(session, repCorrect, {
          formScore: data.formScore || postureScore,
          minAngle: data.minAngle,
          maxAngle: data.maxAngle,
          engagement,
        });
      }

      // Fusion analysis (fusing with Latest FSR sensor data)
      // We pass a synthetic frameResult to the fusion engine
      const syntheticFrameResult = {
        valid: true,
        postureScore: postureScore || 0,
        repState: repState || 'IDLE',
      };
      const fusionResult = analyzeFusion(session, syntheticFrameResult);

      // Collect feedback from CV + Fusion
      const allFeedback = [
        ...(feedback || []),
        ...fusionResult.alerts,
      ];

      // Store warnings in session for report
      allFeedback.forEach((msg) => {
        sessionManager.addWarning(session, msg);
      });

      // Broadcast back to current client (and potentially others)
      socket.emit('feedback', {
        type: 'update',
        angle,
        repCount: session.totalReps,
        repState,
        postureScore,
        elbowStability,
        smoothness,
        cvScore: fusionResult.cvScore,
        fsrScore: fusionResult.fsrScore,
        engagementStatus: fusionResult.engagementStatus,
        feedback: allFeedback,
        repCompleted,
        repCorrect,
      });
    });

    // ─── LEGACY FRAME HANDLER (Now just a relay or warning) ───
    socket.on('frame', (data) => {
      // Backend no longer processes raw landmarks.
      // Clients must process locally and send 'cv_results'.
      socket.emit('feedback', {
        type: 'warning',
        message: 'Backend CV processing disabled. Please update your client to send processed results.',
      });
    });

    // ─── IOT DATA (FSR from ESP32) ───
    socket.on('iot_data', (data) => {
      const session = sessionManager.getSessionBySocket(socket.id);
      if (!session) return;
      sessionManager.updateFSR(session, data.value, data.timestamp || Date.now());
    });

    // ─── END SESSION ───
    socket.on('end_session', async (data, callback) => {
      const session = sessionManager.getSessionBySocket(socket.id);
      if (!session) return;

      const summary = sessionManager.generateSummary(session);
      const report = await generateReport(summary);

      socket.emit('session_summary', report);
      if (typeof callback === 'function') callback({ status: 'completed', report });

      sessionManager.deleteSession(session.id);
    });

    socket.on('disconnect', () => {
      const session = sessionManager.getSessionBySocket(socket.id);
      if (session) sessionManager.deleteSession(session.id);
    });
  });
}

module.exports = { registerSocketHandlers };
