require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');

const { verifySocketToken } = require('./auth/verifySocketToken');
const { initializeFirebaseAdmin } = require('./firebase/admin');
const { initializeGemini } = require('./services/geminiService');
const { registerSocketHandlers } = require('./socket/registerSocketHandlers');
const { createApp } = require('./app');
const { clientOrigins, port } = require('./utils/env');

initializeFirebaseAdmin();
initializeGemini();

const app = createApp();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: clientOrigins,
    credentials: true,
  },
  maxHttpBufferSize: 1e6,
  pingTimeout: 20000,
  pingInterval: 10000,
});
app.locals.io = io;

io.use(verifySocketToken);
registerSocketHandlers(io);

server.listen(port, () => {
  console.log(`FitMon backend listening on http://localhost:${port}`);
});
