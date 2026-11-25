import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import Cookies from 'js-cookie';
import type { User } from '@/lib/api/types';

/**
 * Presence-only cookie read by middleware to route signed-in users. It never
 * holds a token.
 */
export const SESSION_COOKIE = 'sparqly_session';
/** Matches the backend's refresh token lifetime (AUTH_REFRESH_TOKEN_EXPIRES_IN). */
const SESSION_DAYS = 30;

/**
 * The access token lives in memory only. The refresh token is an HttpOnly
 * cookie set by the API, so script on the page can never read it; a reload
 * gets a fresh access token from that cookie (see `restoreSession`).
 */
export type Session = {
  token: string;
  /** Access token expiry, epoch ms. */
  tokenExpires: number;
};

interface AuthState {
  /** Cached profile for instant render; not a credential. */
  user: User | null;
  token: string | null;
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
      tokenExpires: null,

      signIn: ({ user, token, tokenExpires }) => {
        Cookies.set(SESSION_COOKIE, '1', {
          expires: SESSION_DAYS,
          sameSite: 'lax',
          secure: window.location.protocol === 'https:'
        });
        set({ user, token, tokenExpires });
      },

      setSession: ({ token, tokenExpires }) => set({ token, tokenExpires }),

      setUser: (user) => set({ user }),

      clear: () => {
        Cookies.remove(SESSION_COOKIE);
        set({ user: null, token: null, tokenExpires: null });
      }
    }),
    {
      name: 'sparqly-auth',
      version: 3,
      storage: createJSONStorage(() => localStorage),
      // Only the profile is stored; tokens never touch localStorage.
      partialize: (state) => ({ user: state.user }),
      // Older versions stored tokens in localStorage; drop everything.
      migrate: () => ({ user: null })
    }
  )
);
