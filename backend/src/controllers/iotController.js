const { getAllSessions, getSessionById, updateFSR } = require('../session/sessionStore');

const SENSOR_API_KEY = process.env.SENSOR_API_KEY || 'changeme123';

function emitSensorUpdate(io, session, sensorValue) {
  if (!io || !session.socketId) {
    return;
  }

  io.to(session.socketId).emit('feedback', {
    type: 'sensor_update',
    averageFsr: sensorValue,
    engagementStatus: 'sensor_live',
    feedback: [],
  });
}

async function receiveSensorReading(req, res) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey || apiKey !== SENSOR_API_KEY) {
    return res.status(401).json({
      success: false,
      message: 'Invalid API key',
    });
  }

  const { sessionId, value, sensor, timestamp } = req.body || {};
  const sensorValue = value ?? sensor;

  if (typeof sensorValue !== 'number' || Number.isNaN(sensorValue)) {
    return res.status(400).json({
      success: false,
      message: 'A numeric value or sensor field is required',
    });
  }

  const normalizedTimestamp = typeof timestamp === 'number' ? timestamp : Date.now();
  const io = req.app.locals.io;

  if (sessionId) {
    const session = getSessionById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or already ended',
      });
    }

    const normalizedValue = updateFSR(session, sensorValue, normalizedTimestamp);
    emitSensorUpdate(io, session, normalizedValue);

    return res.json({
      success: true,
      message: 'Sensor reading received',
      mode: 'session',
      sessionId,
      timestamp: normalizedTimestamp,
      value: normalizedValue,
    });
  }

  const activeSessions = getAllSessions();
  if (!activeSessions.length) {
    return res.status(404).json({
      success: false,
      message: 'No active session found',
    });
  }

  let normalizedValue = null;
  activeSessions.forEach((activeSession) => {
    const updatedValue = updateFSR(activeSession, sensorValue, normalizedTimestamp);
    if (normalizedValue === null) {
      normalizedValue = updatedValue;
    }
    emitSensorUpdate(io, activeSession, updatedValue);
  });

  return res.json({
    success: true,
    message: 'Sensor reading received',
    mode: 'broadcast_active_sessions',
    activeSessions: activeSessions.length,
    timestamp: normalizedTimestamp,
    value: normalizedValue ?? 0,
  });
}

module.exports = { receiveSensorReading };
