require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const { initializeFirebase } = require('./config/firebase');
const { initializeGemini } = require('./config/gemini');
const { registerSocketHandlers } = require('./controllers/socketController');

// ─── APP SETUP ───
const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3001;

// CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST'],
}));

app.use(express.json());

// ─── SOCKET.IO ───
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
  },
  maxHttpBufferSize: 1e6, // 1MB max payload
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ─── INITIALIZE SERVICES ───
initializeFirebase();
initializeGemini();

// ─── REGISTER SOCKET HANDLERS ───
registerSocketHandlers(io);

// ─── HEALTH CHECK ───
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ─── START SERVER ───
server.listen(PORT, () => {
  console.log(`\n🏋️  FitMon Backend running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket ready for connections\n`);
});
