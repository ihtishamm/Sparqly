import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import Cookies from 'js-cookie';
import type { User } from '@/lib/api/types';

/**
 * Presence-only cookie read by middleware to route signed-in users. It never
 * holds a token; the tokens stay in this store.
 */
export const SESSION_COOKIE = 'sparqly_session';
/** Matches the backend's refresh token lifetime (AUTH_REFRESH_TOKEN_EXPIRES_IN). */
const SESSION_DAYS = 30;

export type Session = {
  token: string;
  refreshToken: string;
  /** Access token expiry, epoch ms. */
  tokenExpires: number;
};

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  tokenExpires: number | null;

  signIn: (session: Session & { user: User }) => void;
  setSession: (session: Session) => void;
  setUser: (user: User) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      tokenExpires: null,

      signIn: ({ user, token, refreshToken, tokenExpires }) => {
        Cookies.set(SESSION_COOKIE, '1', {
          expires: SESSION_DAYS,
          sameSite: 'lax',
          secure: window.location.protocol === 'https:'
        });
        set({ user, token, refreshToken, tokenExpires });
      },

      setSession: ({ token, refreshToken, tokenExpires }) =>
        set({ token, refreshToken, tokenExpires }),

      setUser: (user) => set({ user }),

      clear: () => {
        Cookies.remove(SESSION_COOKIE);
        set({
          user: null,
          token: null,
          refreshToken: null,
          tokenExpires: null
        });
      }
    }),
    {
      name: 'sparqly-auth',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      // Sessions from the previous app version had no expiry; drop them.
      migrate: () => ({
        user: null,
        token: null,
        refreshToken: null,
        tokenExpires: null
      })
    }
  )
);
