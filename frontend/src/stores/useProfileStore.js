import { create } from 'zustand';
import { getFirestore, doc, getDoc, updateDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import { firebaseApp } from '../firebase/config';

const db = firebaseApp ? getFirestore(firebaseApp) : null;

const useProfileStore = create((set) => ({
  goal: '',
  streak: 0,
  totalSessions: 0,
  accuracyRate: 0,
  recentSessions: [],
  isLoading: false,
  error: null,

  fetchProfileMetrics: async (uid) => {
    if (!db || !uid) return;
    set({ isLoading: true, error: null });
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      let streak = 0;
      let goal = 'Improve form and prevent injury';

      if (userSnap.exists()) {
        const data = userSnap.data();
        streak = data.streak || 0;
        goal = data.goal || goal;
      }

      const sessionsRef = collection(db, 'sessions');
      const qAll = query(sessionsRef, where('userId', '==', uid));
      const querySnapshotAll = await getDocs(qAll);
      
      let totalSessions = 0;
      let accurateSessions = 0;
      const allSessions = [];

      querySnapshotAll.forEach((d) => {
        totalSessions++;
        const sData = d.data();
        allSessions.push(sData);
        if ((sData.avgPostureScore || 0) >= 70) {
          accurateSessions++;
        }
      });

      // Sort computationally to avoid needing a composite index
      allSessions.sort((a,b) => new Date(b.startedAt || 0) - new Date(a.startedAt || 0));
      const recentSessions = allSessions.slice(0, 3);

      const accuracyRate = totalSessions > 0 ? Math.round((accurateSessions / totalSessions) * 100) : 0;

      set({ 
        streak, 
        goal, 
        totalSessions, 
        accuracyRate, 
        recentSessions,
        isLoading: false 
      });
    } catch (e) {
      set({ error: e.message, isLoading: false });
    }
  },

  updateGoal: async (uid, newGoal) => {
    if (!db || !uid) return;
    try {
      const userRef = doc(db, 'users', uid);
      try {
        await updateDoc(userRef, { goal: newGoal });
      } catch (err) {
        if (err.code === 'not-found') {
          await setDoc(userRef, { goal: newGoal }, { merge: true });
        } else {
          throw err;
        }
      }
      set({ goal: newGoal });
    } catch (e) {
      set({ error: e.message });
    }
  }
}));

export default useProfileStore;
