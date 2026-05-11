import { ScheduledPost, InfinityPaginationResponse } from '@/types/api';
import { useApi } from '@/hooks/use-api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useScheduledPosts() {
  const { get, post, remove } = useApi();
  const queryClient = useQueryClient();

  const useGetScheduled = (page = 1, limit = 10) => {
    return useQuery({
      queryKey: ['scheduled-posts', 'pending', page, limit],
      queryFn: () =>
        get<InfinityPaginationResponse<ScheduledPost>>('/v1/scheduled-posts', {
          page,
          limit
        })
    });
  };

  const useGetPublished = (page = 1, limit = 10) => {
    return useQuery({
      queryKey: ['scheduled-posts', 'published', page, limit],
      queryFn: () =>
        get<InfinityPaginationResponse<ScheduledPost>>(
          '/v1/scheduled-posts/published',
          { page, limit }
        )
    });
  };

  const scheduleMutation = useMutation({
    mutationFn: (data: any) => post<ScheduledPost>('/v1/scheduled-posts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] });
    },
    meta: {
      errorMessage: 'Failed to schedule post'
    }
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => post(`/v1/scheduled-posts/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] });
    },
    meta: {
      errorMessage: 'Failed to cancel post'
    }
  });

  const publishNowMutation = useMutation({
    mutationFn: (id: string) => post(`/v1/scheduled-posts/${id}/publish-now`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] });
    },
    meta: {
      errorMessage: 'Failed to publish post'
    }
  });

  return {
    useGetScheduled,
    useGetPublished,
    scheduleMutation,
    cancelMutation,
    publishNowMutation
  };
}
