import { Wallet, InfinityPaginationResponse } from '@/types/api';
import { useApi } from '@/hooks/use-api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useSubscription() {
  const { get, post } = useApi();
  const queryClient = useQueryClient();

  const useGetWallet = () => {
    return useQuery({
      queryKey: ['wallet'],
      queryFn: () =>
        get<
          Wallet & {
            planCredits: number;
            extraCredits: number;
            rolledOverCredits: number;
            proratedCredits: number;
            usageCount: number;
            currentPeriodEnd: string;
            status: string;
          }
        >('/v1/billing/wallet'),
      refetchInterval: 30000 // Refetch every 30s
    });
  };

  const useGetPlans = () => {
    return useQuery({
      queryKey: ['billing-plans'],
      queryFn: () =>
        get<
          Array<{
            priceId: string;
            credits: number;
            name: string;
            price: number;
          }>
        >('/v1/billing/plans')
    });
  };

  const createCheckoutSessionMutation = useMutation({
    mutationFn: (data: { priceId: string; mode: 'subscription' | 'payment' }) =>
      post<{ url: string }>('/v1/billing/checkout', data),
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    meta: {
      errorMessage: 'Failed to initiate checkout'
    }
  });

  return {
    useGetWallet,
    useGetPlans,
    createCheckoutSessionMutation
  };
}
