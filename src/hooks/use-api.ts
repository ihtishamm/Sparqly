import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import { useCallback } from 'react';

export function useApi() {
  const { token } = useAuthStore();

  const get = useCallback(
    async <T>(endpoint: string, params?: Record<string, any>) => {
      return apiClient.get<T>(endpoint, { params }, token || undefined);
    },
    [token]
  );

  const post = useCallback(
    async <T>(endpoint: string, data?: any) => {
      return apiClient.post<T>(endpoint, data, {}, token || undefined);
    },
    [token]
  );

  const patch = useCallback(
    async <T>(endpoint: string, data?: any) => {
      return apiClient.patch<T>(endpoint, data, {}, token || undefined);
    },
    [token]
  );

  const remove = useCallback(
    async <T>(endpoint: string) => {
      return apiClient.delete<T>(endpoint, {}, token || undefined);
    },
    [token]
  );

  return { get, post, patch, remove };
}
