import { PlatformAccount, InfinityPaginationResponse } from '@/types/api';
import { useApi } from '@/hooks/use-api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function usePlatformAccounts() {
  const { get, remove } = useApi();
  const queryClient = useQueryClient();

  const useGetAccounts = (page = 1, limit = 10) => {
    return useQuery({
      queryKey: ['platform-accounts', page, limit],
      queryFn: () =>
        get<InfinityPaginationResponse<PlatformAccount>>(
          '/v1/platform-accounts',
          { page, limit }
        )
    });
  };

  const connectMutation = useMutation({
    mutationFn: (platform: string) =>
      get<{ url: string }>(`/v1/platform-accounts/connect/${platform}`),
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    meta: {
      errorMessage: 'Failed to start connection process'
    }
  });

  const disconnectMutation = useMutation({
    mutationFn: (id: string) => remove(`/v1/platform-accounts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-accounts'] });
    },
    meta: {
      errorMessage: 'Failed to disconnect account'
    }
  });

  return {
    useGetAccounts,
    connectMutation,
    disconnectMutation
  };
}
