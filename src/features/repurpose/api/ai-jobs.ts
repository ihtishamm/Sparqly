import { AiJob } from '@/types/api';
import { useApi } from '@/hooks/use-api';
import { useQuery, useMutation } from '@tanstack/react-query';

export function useAiJobs() {
  const { get, post } = useApi();

  const useGetJob = (id: string | null) => {
    return useQuery({
      queryKey: ['ai-jobs', id],
      queryFn: () => get<AiJob>(`/v1/ai-jobs/${id}`),
      enabled: !!id,
      refetchInterval: (query) => {
        // Poll every 2 seconds if job is not completed/failed
        const status = query.state.data?.status;
        return status === 'queued' || status === 'processing' ? 2000 : false;
      }
    });
  };

  const createJobMutation = useMutation({
    mutationFn: (data: {
      jobType: string;
      input: any;
      user: { id: string };
      status: string;
    }) => post<AiJob>('/v1/ai-jobs', data),
    meta: {
      errorMessage: 'Failed to start AI job'
    }
  });

  return { useGetJob, createJobMutation };
}
