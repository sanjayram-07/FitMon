const { decodeBearerToken, extractBearerToken } = require('./verifyToken');

async function verifySocketToken(socket, next) {
  try {
    const authToken = socket.handshake.auth?.token;
    const headerToken = extractBearerToken(socket.handshake.headers.authorization);
    const token = authToken || headerToken;

    const decodedToken = await decodeBearerToken(token);
    socket.user = decodedToken;
    next();
  } catch (error) {
    next(new Error(`Unauthorized: ${error.message}`));
  }
}

module.exports = { verifySocketToken };
