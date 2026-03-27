import { create } from 'zustand';

const useSessionStore = create((set, get) => ({
  // Connection
  isConnected: false,
  sessionId: null,
  sessionActive: false,

  // Real-time feedback
  repCount: 0,
  angle: 0,
  repState: 'IDLE',
  postureScore: 0,
  formScore: 0,
  elbowStability: 100,
  smoothness: 100,
  cvScore: 0,
  fsrScore: 0,
  engagementStatus: 'normal',
  feedbackMessages: [],

  // Session report
  report: null,
  isGeneratingReport: false,

  // MediaPipe
  poseReady: false,

  // Actions
  setConnected: (connected) => set({ isConnected: connected }),
  setSessionId: (id) => set({ sessionId: id }),
  setSessionActive: (active) => set({ sessionActive: active }),
  setPoseReady: (ready) => set({ poseReady: ready }),

  updateFeedback: (data) => {
    const updates = {
      repCount: data.repCount ?? get().repCount,
      angle: data.angle ?? get().angle,
      repState: data.repState ?? get().repState,
      postureScore: data.postureScore ?? get().postureScore,
      formScore: data.formScore ?? get().formScore,
      elbowStability: data.elbowStability ?? get().elbowStability,
      smoothness: data.smoothness ?? get().smoothness,
      cvScore: data.cvScore ?? get().cvScore,
      fsrScore: data.fsrScore ?? get().fsrScore,
      engagementStatus: data.engagementStatus ?? get().engagementStatus,
    };

    // Keep last 5 feedback messages
    if (data.feedback && data.feedback.length > 0) {
      const current = get().feedbackMessages;
      const newMessages = data.feedback.map((msg) => ({
        id: Date.now() + Math.random(),
        text: msg,
        timestamp: Date.now(),
      }));
      updates.feedbackMessages = [...newMessages, ...current].slice(0, 5);
    }

    set(updates);
  },

  setReport: (report) => set({ report, isGeneratingReport: false }),
  setGeneratingReport: (val) => set({ isGeneratingReport: val }),

  resetSession: () =>
    set({
      sessionId: null,
      sessionActive: false,
      repCount: 0,
      angle: 0,
      repState: 'IDLE',
      postureScore: 0,
      formScore: 0,
      elbowStability: 100,
      smoothness: 100,
      cvScore: 0,
      fsrScore: 0,
      engagementStatus: 'normal',
      feedbackMessages: [],
      report: null,
      isGeneratingReport: false,
    }),
}));

export default useSessionStore;
