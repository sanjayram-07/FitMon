const { getAuth } = require('../firebase/admin');

async function decodeBearerToken(token) {
  if (!token) {
    throw new Error('Missing Firebase ID token');
  }

  return getAuth().verifyIdToken(token);
}

function extractBearerToken(headerValue) {
  if (!headerValue) {
    return null;
  }

  const [scheme, token] = headerValue.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
}

async function verifyToken(req, res, next) {
  try {
    const token = extractBearerToken(req.headers.authorization);
    const decodedToken = await decodeBearerToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({
      message: 'Unauthorized',
      details: error.message,
    });
  }
}

module.exports = {
  decodeBearerToken,
  extractBearerToken,
  verifyToken,
};
