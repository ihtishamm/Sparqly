'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';
import { keys } from '../keys';
import type {
  Activity,
  AccountPerformance,
  AnalyticsOverview,
  PostPerformance,
  CreditTransaction,
  Paginated,
  Plan,
  Wallet
} from '../types';

/* ------------------------------- Billing -------------------------------- */

export function useWallet() {
  return useQuery({
    queryKey: keys.billing.wallet,
    queryFn: ({ signal }) =>
      api.get<Wallet>('/v1/billing/wallet', undefined, signal)
  });
}

export function usePlans() {
  return useQuery({
    queryKey: keys.billing.plans,
    queryFn: ({ signal }) =>
      api.get<Plan[]>('/v1/billing/plans', undefined, signal),
    staleTime: 10 * 60_000
  });
}

export function useTransactions() {
  return useQuery({
    queryKey: keys.billing.transactions,
    queryFn: ({ signal }) =>
      api.get<Paginated<CreditTransaction>>(
        '/v1/billing/transactions',
        { page: 1, limit: 20 },
        signal
      )
  });
}

export function useCheckout() {
  return useMutation({
    meta: { errorTitle: 'Checkout didn’t open' },
    mutationFn: (plan: Pick<Plan, 'priceId' | 'mode'>) =>
      api.post<{ url: string }>('/v1/billing/checkout', plan),
    onSuccess: ({ url }) => window.location.assign(url)
  });
}

export function useBillingPortal() {
  return useMutation({
    meta: { errorTitle: 'Billing portal didn’t open' },
    mutationFn: () => api.post<{ url: string }>('/v1/billing/portal'),
    onSuccess: ({ url }) => window.location.assign(url)
  });
}

/* ------------------------------ Analytics ------------------------------- */

export function useAnalytics(startDate: string, endDate: string) {
  return useQuery({
    queryKey: keys.analytics(startDate, endDate),
    queryFn: ({ signal }) =>
      api.get<AnalyticsOverview>(
        '/v1/analytics/overview',
        { startDate, endDate },
        signal
      )
  });
}

export function usePostPerformance(startDate: string, endDate: string) {
  return useQuery({
    queryKey: keys.analyticsPosts(startDate, endDate),
    queryFn: ({ signal }) =>
      api.get<PostPerformance[]>(
        '/v1/analytics/posts',
        { startDate, endDate },
        signal
      )
  });
}

export function useAccountPerformance(startDate: string, endDate: string) {
  return useQuery({
    queryKey: keys.analyticsAccounts(startDate, endDate),
    queryFn: ({ signal }) =>
      api.get<AccountPerformance[]>(
        '/v1/analytics/accounts',
        { startDate, endDate },
        signal
      )
  });
}

export function useSyncAnalytics() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { errorTitle: 'Sync failed' },
    mutationFn: () => api.post('/v1/analytics/sync/all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['analytics'] })
  });
}

/* ------------------------------- Activity ------------------------------- */

export function useActivity(limit = 10) {
  return useQuery({
    queryKey: keys.activity(limit),
    queryFn: ({ signal }) =>
      api.get<Paginated<Activity>>(
        '/v1/audit-activity/activity',
        { page: 1, limit },
        signal
      ),
    refetchInterval: 60_000
  });
}
