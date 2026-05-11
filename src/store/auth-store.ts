import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '@/types/api';
import Cookies from 'js-cookie';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  setAuth: (user: User, token: string, refreshToken: string) => void;
  updateUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, token, refreshToken) => {
        Cookies.set('token', token, { expires: 7 }); // Set cookie for middleware
        set({ user, token, refreshToken, isAuthenticated: true });
      },

      updateUser: (user) => set({ user }),

      logout: () => {
        Cookies.remove('token');
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false
        });
      }
    }),
    {
      name: 'sparqly-auth',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
