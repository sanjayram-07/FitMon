const { analyzeFusion, computeRepInjuryRisk } = require('../fusion/fusionEngine');
const { buildSessionReport } = require('../services/reportService');
const {
  addInjuryRisk,
  addWarning,
  createSession,
  deleteSession,
  getSessionBySocket,
  recordRep,
  summarizeSession,
  updateFSR,
  updateFrame,
} = require('../session/sessionStore');

function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    socket.on('start_session', (_, callback) => {
      const existing = getSessionBySocket(socket.id);
      if (existing) {
        if (typeof callback === 'function') {
          callback({ status: 'started', sessionId: existing.id });
        }
        return;
      }

      const session = createSession({
        socketId: socket.id,
        uid: socket.user.uid,
        email: socket.user.email,
      });

      socket.emit('session_started', { sessionId: session.id });
      if (typeof callback === 'function') {
        callback({ status: 'started', sessionId: session.id });
      }
    });

    socket.on('frame', (_, callback) => {
      if (typeof callback === 'function') {
        callback({
          status: 'ignored',
          reason: 'FitMon processes MediaPipe pose data on the client and expects cv_results events.',
        });
      }
    });

    socket.on('cv_results', (payload) => {
      const session = getSessionBySocket(socket.id);
      if (!session || !payload?.valid) {
        return;
      }

      updateFrame(session, payload.postureScore);
      const fusion = analyzeFusion(session, payload);
      const feedback = [...(payload.feedback || []), ...fusion.alerts];

      feedback.forEach((warning) => addWarning(session, warning));

      if (payload.repCompleted) {
        const repInjuryRisk = computeRepInjuryRisk(fusion.cvScore, fusion.fsrScore);
        addInjuryRisk(session, repInjuryRisk);
        recordRep(session, {
          ...payload,
          avgFsr: fusion.averageFsr,
          fsrScore: fusion.fsrScore,
          peakFsr: session.latestFSR.value,
          fusionScore: fusion.fusionScore,
          injuryRisk: repInjuryRisk,
          engagementStatus: fusion.engagementStatus,
        });
      }

      socket.emit('feedback', {
        type: 'update',
        angle: payload.angle,
        repCount: session.totalReps,
        repState: payload.repState,
        postureScore: payload.postureScore,
        formScore: payload.formScore,
        elbowStability: payload.elbowStability,
        smoothness: payload.smoothness,
        cvScore: fusion.cvScore,
        fsrScore: fusion.fsrScore,
        engagementStatus: fusion.engagementStatus,
        feedback,
        averageFsr: fusion.averageFsr,
      });
    });

    socket.on('iot_data', (payload) => {
      const session = getSessionBySocket(socket.id);
      if (!session || typeof payload?.value !== 'number') {
        return;
      }

      updateFSR(session, payload.value, payload.timestamp);
    });

    socket.on('end_session', async (_, callback) => {
      const session = getSessionBySocket(socket.id);
      if (!session) {
        if (typeof callback === 'function') {
          callback({ status: 'idle' });
        }
        return;
      }

      try {
        const report = await buildSessionReport(summarizeSession(session));
        socket.emit('session_summary', report);

        if (typeof callback === 'function') {
          callback({ status: 'completed', report });
        }
      } catch (error) {
        socket.emit('feedback', {
          type: 'warning',
          message: 'Session ended, but report generation failed. Check backend configuration.',
        });

        if (typeof callback === 'function') {
          callback({ status: 'error', message: error.message });
        }
      } finally {
        deleteSession(session.id);
      }
    });

    socket.on('disconnect', () => {
      const session = getSessionBySocket(socket.id);
      if (session) {
        deleteSession(session.id);
      }
    });
  });
}

module.exports = { registerSocketHandlers };
