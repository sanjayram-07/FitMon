const cors = require('cors');
const express = require('express');

const { verifyToken } = require('./auth/verifyToken');
const { createAuthenticatedSession } = require('./controllers/authController');
const { receiveSensorReading } = require('./controllers/iotController');
const { clientOrigins } = require('./utils/env');

function createApp() {
  const app = express();

  app.use(
    cors({
      origin: clientOrigins,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  app.post('/api/auth/session', verifyToken, createAuthenticatedSession);
  app.get('/api/auth/me', verifyToken, createAuthenticatedSession);
  app.post('/api/iot/reading', receiveSensorReading);

  return app;
}

module.exports = { createApp };
