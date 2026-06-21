import { create } from 'zustand';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,
  
  initAuthListener: () => {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Prepare Firebase user data
        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified,
        };

        try {
          // Sync with our PostgreSQL backend
          // We use localhost:5000 by default (change in production)
          const response = await fetch('https://goalign-mrkd.onrender.com/api/auth/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              firebase_uid: user.uid,
              email: user.email,
              display_name: user.displayName
            })
          });

          if (response.ok) {
            const data = await response.json();
            // Merge PostgreSQL database fields (like vip_level, internal id) with firebase data
            userData.dbId = data.user.id;
            userData.vipLevel = data.user.vip_level;
          }
        } catch (err) {
          console.error("Backend sync failed. Is the server running?", err);
        }

        set({
          user: userData,
          isAuthenticated: true,
          loading: false,
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          loading: false,
        });
      }
    });
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (loading) => set({ loading }),
}));

export default useAuthStore;
