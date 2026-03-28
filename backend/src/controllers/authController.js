const { ensureUserProfile } = require('../services/userService');

async function createAuthenticatedSession(req, res) {
  try {
    const user = await ensureUserProfile(req.user);
    res.json({ user });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to initialize user profile',
      details: error.message,
    });
  }
}

module.exports = { createAuthenticatedSession };
