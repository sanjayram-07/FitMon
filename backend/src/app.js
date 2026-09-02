const cors = require('cors');
const express = require('express');

const { verifyToken } = require('./auth/verifyToken');
const { createAuthenticatedSession } = require('./controllers/authController');
const { submitContact } = require('./controllers/contactController');
const { receiveSensorReading } = require('./controllers/iotController');
const { submitOnboarding, generatePlan, getLatestPlan } = require('./controllers/dietController');
const {
  followUser,
  unfollowUser,
  listFollowers,
  listFollowing,
  listPeople,
  getFollowingFeed,
  getPublicProfile,
} = require('./controllers/socialController');
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
  app.post('/api/contact', submitContact);

  app.post('/api/onboarding', verifyToken, submitOnboarding);
  app.post('/api/diet/plan', verifyToken, generatePlan);
  app.get('/api/diet/plan/latest', verifyToken, getLatestPlan);

  app.get('/api/social/people', verifyToken, listPeople);
  app.get('/api/social/feed', verifyToken, getFollowingFeed);
  app.get('/api/social/users/:uid', verifyToken, getPublicProfile);
  app.get('/api/social/users/:uid/followers', verifyToken, listFollowers);
  app.get('/api/social/users/:uid/following', verifyToken, listFollowing);
  app.post('/api/social/follow/:uid', verifyToken, followUser);
  app.delete('/api/social/follow/:uid', verifyToken, unfollowUser);

  return app;
}

module.exports = { createApp };
