import { io } from 'socket.io-client';
import useSessionStore from '../stores/useSessionStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected:', this.socket.id);
      useSessionStore.getState().setConnected(true);
    });

    this.socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      useSessionStore.getState().setConnected(false);
    });

    this.socket.on('session_started', (data) => {
      console.log('[Socket] Session started:', data.sessionId);
      useSessionStore.getState().setSessionId(data.sessionId);
      useSessionStore.getState().setSessionActive(true);
    });

    this.socket.on('feedback', (data) => {
      if (data.type === 'update') {
        useSessionStore.getState().updateFeedback(data);
      } else if (data.type === 'warning') {
        useSessionStore.getState().updateFeedback({
          feedback: [data.message],
          repCount: data.repCount,
        });
      }
    });

    this.socket.on('session_summary', (report) => {
      console.log('[Socket] Session summary received');
      useSessionStore.getState().setReport(report);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  startSession() {
    if (!this.socket?.connected) {
      console.warn('[Socket] Not connected');
      return;
    }
    this.socket.emit('start_session', {});
  }

  sendFrame(landmarks, timestamp) {
    if (!this.socket?.connected) return;
    this.socket.volatile.emit('frame', { landmarks, timestamp });
  }

  sendIoTData(value, timestamp) {
    if (!this.socket?.connected) return;
    this.socket.emit('iot_data', { value, timestamp: timestamp || Date.now() });
  }

  endSession() {
    if (!this.socket?.connected) return;
    useSessionStore.getState().setGeneratingReport(true);
    this.socket.emit('end_session', {});
  }
}

const socketService = new SocketService();
export default socketService;
