'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, request, signOut } from '../client';
import { keys } from '../keys';
import type { LoginResponse, User } from '../types';
import { useAuthStore } from '@/store/auth-store';

export function useMe() {
  const setUser = useAuthStore((s) => s.setUser);
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: keys.me,
    enabled: !!token,
    queryFn: async ({ signal }) => {
      const user = await api.get<User>('/v1/auth/me', undefined, signal);
      setUser(user);
      return user;
    }
  });
}

export function useSignIn() {
  const signIn = useAuthStore((s) => s.signIn);
  return useMutation({
    meta: { errorTitle: false },
    mutationFn: (body: { email: string; password: string }) =>
      request<LoginResponse>('/v1/auth/email/login', {
        method: 'POST',
        body,
        anonymous: true
      }),
    onSuccess: (session) => signIn(session)
  });
}

export function useGoogleSignIn() {
  const signIn = useAuthStore((s) => s.signIn);
  return useMutation({
    meta: { errorTitle: false },
    mutationFn: (body: { code: string; state: string }) =>
      request<LoginResponse>('/v1/auth-google/callback', {
        method: 'POST',
        body,
        anonymous: true
      }),
    onSuccess: (session) => signIn(session)
  });
}

export function useSignUp() {
  return useMutation({
    meta: { errorTitle: false },
    mutationFn: (body: {
      email: string;
      password: string;
      fullName: string;
      username: string;
    }) =>
      request<void>('/v1/auth/email/register', {
        method: 'POST',
        body,
        anonymous: true
      })
  });
}

export function useResendConfirmation() {
  return useMutation({
    meta: { errorTitle: 'Couldn’t send the email' },
    mutationFn: (email: string) =>
      request<void>('/v1/auth/email/confirm/resend', {
        method: 'POST',
        body: { email },
        anonymous: true
      })
  });
}

/** Confirms a new account's email, or with `newEmail` a changed address. */
export function useConfirmEmail(newEmail = false) {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { errorTitle: false },
    mutationFn: (hash: string) =>
      request<void>(
        newEmail ? '/v1/auth/email/confirm/new' : '/v1/auth/email/confirm',
        {
          method: 'POST',
          body: { hash },
          anonymous: true
        }
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.me })
  });
}

export function useForgotPassword() {
  return useMutation({
    meta: { errorTitle: false },
    mutationFn: (email: string) =>
      request<void>('/v1/auth/forgot/password', {
        method: 'POST',
        body: { email },
        anonymous: true
      })
  });
}

export function useResetPassword() {
  return useMutation({
    meta: { errorTitle: false },
    mutationFn: (body: { hash: string; password: string }) =>
      request<void>('/v1/auth/reset/password', {
        method: 'POST',
        body,
        anonymous: true
      })
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    meta: { errorTitle: false },
    mutationFn: (
      body: Partial<{
        fullName: string;
        username: string;
        email: string;
        password: string;
        oldPassword: string;
      }>
    ) => api.patch<User>('/v1/auth/me', body),
    onSuccess: (user) => {
      setUser(user);
      queryClient.setQueryData(keys.me, user);
    }
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { errorTitle: 'Couldn’t delete your account' },
    mutationFn: () => api.delete('/v1/auth/me'),
    onSuccess: async () => {
      await signOut();
      queryClient.clear();
    }
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();
  return async () => {
    await signOut();
    queryClient.clear();
    window.location.assign('/auth/sign-in');
  };
}
