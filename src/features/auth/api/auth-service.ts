import { useApi } from '@/hooks/use-api';
import { useAuthStore } from '@/store/auth-store';
import { LoginResponse, User } from '@/types/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';

export function useAuthService() {
  const { post, get } = useApi();
  const { setAuth, logout, updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  const loginMutation = useMutation({
    mutationFn: (data: any) =>
      post<LoginResponse>('/v1/auth/email/login', data),
    onSuccess: (data) => {
      setAuth(data.user, data.token, data.refreshToken);
      toast.success('Logged in successfully');
      router.push('/dashboard/overview');
    },
    meta: {
      errorMessage: 'Login failed. Please check your credentials.'
    }
  });

  const registerMutation = useMutation({
    mutationFn: (data: any) => post('/v1/auth/email/register', data),
    onSuccess: () => {
      toast.success(
        'Registration successful! Please check your email for verification.'
      );
      router.push('/auth/sign-in');
    },
    meta: {
      errorMessage: 'Registration failed'
    }
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: (email: string) => post('/v1/auth/forgot/password', { email }),
    onSuccess: () => {
      toast.success('Password reset link sent to your email');
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (data: any) => post('/v1/auth/reset/password', data),
    onSuccess: () => {
      toast.success('Password reset successfully');
      router.push('/auth/sign-in');
    }
  });

  const confirmEmailMutation = useMutation({
    mutationFn: (hash: string) => post('/v1/auth/email/confirm', { hash }),
    onSuccess: () => {
      toast.success('Email confirmed successfully');
      router.push('/auth/sign-in');
    }
  });

  const useMe = () => {
    const { isAuthenticated } = useAuthStore();
    const query = useQuery({
      queryKey: ['me'],
      queryFn: () => get<User>('/v1/auth/me'),
      enabled: isAuthenticated
    });

    useEffect(() => {
      if (query.data) {
        updateUser(query.data);
      }
    }, [query.data]);

    return query;
  };

  const googleLoginMutation = useMutation({
    mutationFn: () => get<{ url: string }>('/v1/auth-google/login'),
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    }
  });

  const handleLogout = () => {
    logout();
    queryClient.clear();
    router.push('/auth/sign-in');
    toast.success('Logged out');
  };

  return {
    loginMutation,
    registerMutation,
    forgotPasswordMutation,
    resetPasswordMutation,
    confirmEmailMutation,
    googleLoginMutation,
    useMe,
    handleLogout
  };
}
