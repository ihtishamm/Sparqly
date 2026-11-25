'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';
import { keys } from '../keys';
import type {
  Paginated,
  Platform,
  PlatformAccount,
  ScheduledPost
} from '../types';

/* ------------------------------- Accounts ------------------------------- */

export function useAccounts() {
  return useQuery({
    queryKey: keys.accounts,
    queryFn: ({ signal }) =>
      api.get<Paginated<PlatformAccount>>(
        '/v1/platform-accounts',
        { page: 1, limit: 50 },
        signal
      )
  });
}

export function useConnectAccount() {
  return useMutation({
    meta: { errorTitle: 'Couldn’t start the connection' },
    mutationFn: (platform: Platform) =>
      api.get<{ url: string }>(`/v1/platform-accounts/connect/${platform}`),
    onSuccess: ({ url }) => {
      window.location.assign(url);
    }
  });
}

export function useDisconnectAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { errorTitle: 'Couldn’t disconnect the account' },
    mutationFn: (id: string) => api.delete(`/v1/platform-accounts/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.accounts })
  });
}

/* ----------------------------- Scheduled posts -------------------------- */

export function usePostsInRange(from: Date, to: Date) {
  const fromIso = from.toISOString();
  const toIso = to.toISOString();
  return useQuery({
    queryKey: keys.posts.range(fromIso, toIso),
    queryFn: ({ signal }) =>
      api.get<Paginated<ScheduledPost>>(
        '/v1/scheduled-posts',
        { from: fromIso, to: toIso, page: 1, limit: 200 },
        signal
      ),
    refetchInterval: (query) =>
      query.state.data?.data.some((p) => p.status === 'processing')
        ? 5000
        : false
  });
}

export function useUpcomingPosts(limit = 5) {
  return useQuery({
    queryKey: [...keys.posts.upcoming, limit],
    queryFn: ({ signal }) =>
      api.get<Paginated<ScheduledPost>>(
        '/v1/scheduled-posts',
        {
          from: new Date().toISOString(),
          status: 'scheduled',
          page: 1,
          limit
        },
        signal
      ),
    // The API sorts newest first; show the soonest first.
    select: (page) => ({
      ...page,
      data: [...page.data].sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      )
    })
  });
}

export type NewPost = {
  platformAccountId: string;
  variantId: string;
  versionId: string;
  contentId: string;
  scheduledAt: Date;
  metadata: { caption?: string; title?: string; hashtags?: string[] };
};

/** Creates one post. Costs one credit. */
export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { errorTitle: false },
    mutationFn: (post: NewPost) =>
      api.post<ScheduledPost>('/v1/scheduled-posts', {
        platformAccount: { id: post.platformAccountId },
        contentVariant: { id: post.variantId },
        contentVersion: { id: post.versionId },
        content: { id: post.contentId },
        scheduledAt: post.scheduledAt.toISOString(),
        metadata: post.metadata
      }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: keys.posts.all });
      queryClient.invalidateQueries({ queryKey: keys.projects.all });
      queryClient.invalidateQueries({ queryKey: keys.billing.wallet });
    }
  });
}

type PostAction = 'publish-now' | 'retry' | 'cancel';

export function usePostAction() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { errorTitle: 'That didn’t work' },
    mutationFn: ({ id, action }: { id: string; action: PostAction }) =>
      api.post<ScheduledPost>(`/v1/scheduled-posts/${id}/${action}`),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: keys.posts.all });
      queryClient.invalidateQueries({ queryKey: keys.billing.wallet });
    }
  });
}

export function useReschedulePost() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { errorTitle: 'Couldn’t reschedule' },
    mutationFn: ({ id, scheduledAt }: { id: string; scheduledAt: Date }) =>
      api.patch<ScheduledPost>(`/v1/scheduled-posts/${id}`, {
        scheduledAt: scheduledAt.toISOString()
      }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: keys.posts.all })
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { errorTitle: 'Couldn’t delete the post' },
    mutationFn: (id: string) => api.delete(`/v1/scheduled-posts/${id}`),
    onSettled: () => queryClient.invalidateQueries({ queryKey: keys.posts.all })
  });
}
