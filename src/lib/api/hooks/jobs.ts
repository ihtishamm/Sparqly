'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';
import { keys } from '../keys';
import type { AiJob, Paginated } from '../types';
import { useAuthStore } from '@/store/auth-store';
import { isJobActive } from './projects';

export function useJobs(limit = 10) {
  return useQuery({
    queryKey: keys.jobs.list(limit),
    queryFn: ({ signal }) =>
      api.get<Paginated<AiJob>>('/v1/ai-jobs', { page: 1, limit }, signal),
    refetchInterval: (query) =>
      query.state.data?.data.some((j) => isJobActive(j.status)) ? 4000 : false
  });
}

export function useJob(id: string | null) {
  return useQuery({
    queryKey: keys.jobs.detail(id ?? ''),
    enabled: !!id,
    queryFn: ({ signal }) =>
      api.get<AiJob>(`/v1/ai-jobs/${id}`, undefined, signal),
    refetchInterval: (query) =>
      isJobActive(query.state.data?.status) || !query.state.data ? 2500 : false
  });
}

export type StudioJobType =
  | 'video_generation'
  | 'image_generation'
  | 'blog_generation';

/** Starts a generation job from a prompt. Costs one credit. */
export function useStartGeneration() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    meta: { errorTitle: false },
    mutationFn: (input: {
      jobType: StudioJobType;
      prompt: string;
      title?: string;
    }) =>
      api.post<AiJob>('/v1/ai-jobs', {
        jobType: input.jobType,
        status: 'pending',
        user: { id: user?.id },
        input: { prompt: input.prompt, title: input.title }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.jobs.all });
      queryClient.invalidateQueries({ queryKey: keys.billing.wallet });
    }
  });
}
