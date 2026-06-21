import { create } from 'zustand';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,
  
  initAuthListener: () => {
    return onAuthStateChanged(auth, (user) => {
      set({
        user: user ? {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified,
        } : null,
        isAuthenticated: !!user,
        loading: false,
      });
    });
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (loading) => set({ loading }),
}));

export default useAuthStore;
