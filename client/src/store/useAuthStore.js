import { create } from 'zustand';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { auth } from '../firebase.js';
import { API_BASE_URL } from '../utils/api.js';

const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  login: (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  },
  register: (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  },
  logout: () => {
    return firebaseSignOut(auth);
  }
}));

// Setup listener outside React and ensure backend user record exists
onAuthStateChanged(auth, async (currentUser) => {
  useAuthStore.setState({ user: currentUser, loading: false });
  if (currentUser) {
    try {
      await fetch(`${API_BASE_URL}/api/auth/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebase_uid: currentUser.uid,
          email: currentUser.email,
          display_name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Trader'
        })
      });
    } catch (err) {
      console.warn('Background auth sync warning:', err);
    }
  }
});

export default useAuthStore;
