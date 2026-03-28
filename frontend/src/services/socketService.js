import { io } from 'socket.io-client';
import useSessionStore from '../stores/useSessionStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

class SocketService {
  constructor() {
    this.socket = null;
    this.listenersBound = false;
  }

  connect(token) {
    if (!token) {
      return;
    }

    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        autoConnect: false,
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
    }

    this.socket.auth = { token };

    if (!this.listenersBound) {
      this.bindListeners();
      this.listenersBound = true;
    }

    if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  bindListeners() {
    this.socket.on('connect', () => {
      useSessionStore.getState().setConnected(true);
      useSessionStore.getState().setSocketError('');
    });

    this.socket.on('disconnect', () => {
      useSessionStore.getState().setConnected(false);
    });

    this.socket.on('session_started', ({ sessionId }) => {
      useSessionStore.getState().setSessionId(sessionId);
      useSessionStore.getState().setSessionActive(true);
    });

    this.socket.on('feedback', (payload) => {
      if (payload.type === 'warning') {
        useSessionStore.getState().updateFeedback({
          feedback: [payload.message],
        });
        return;
      }

      useSessionStore.getState().updateFeedback(payload);
    });

    this.socket.on('session_summary', (report) => {
      useSessionStore.getState().setReport(report);
    });

    this.socket.on('connect_error', (error) => {
      useSessionStore.getState().setSocketError(error.message);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listenersBound = false;
    }
  }

  startSession() {
    if (this.socket?.connected) {
      this.socket.emit('start_session', {});
    }
  }

  sendCVResults(results) {
    if (this.socket?.connected) {
      this.socket.emit('cv_results', results);
    }
  }

  sendIoTData(value, timestamp = Date.now()) {
    if (this.socket?.connected) {
      this.socket.emit('iot_data', { value, timestamp });
    }
  }

  endSession() {
    if (this.socket?.connected) {
      useSessionStore.getState().setGeneratingReport(true);
      this.socket.emit('end_session', {});
    }
  }
}

const socketService = new SocketService();
export default socketService;
