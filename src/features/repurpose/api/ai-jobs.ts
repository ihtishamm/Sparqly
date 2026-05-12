import { AiJob } from '@/types/api';
import { useApi } from '@/hooks/use-api';
import { useQuery, useMutation } from '@tanstack/react-query';

export interface CreateJobData {
  jobType: string;
  content?: { id: string };
  input: any;
  user: { id: string };
  status: string;
}

export function useAiJobs() {
  const { get, post } = useApi();

  const useGetJob = (id: string | null) => {
    return useQuery({
      queryKey: ['ai-jobs', id],
      queryFn: () => get<AiJob>(`/v1/ai-jobs/${id}`),
      enabled: !!id,
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        return status === 'completed' || status === 'failed' ? false : 2000;
      },
      refetchIntervalInBackground: true,
      staleTime: 0,
      gcTime: 0,
      refetchOnMount: 'always',
      refetchOnReconnect: 'always'
    });
  };

  const createJobMutation = useMutation<AiJob, Error, CreateJobData>({
    mutationFn: (data: CreateJobData) => post<AiJob>('/v1/ai-jobs', data),
    meta: {
      errorMessage: 'Failed to start AI job'
    }
  });

  const useGetJobs = (params?: any) => {
    return useQuery({
      queryKey: ['ai-jobs', params],
      queryFn: () => get<any>('/v1/ai-jobs', { params })
    });
  };

  return { useGetJob, useGetJobs, createJobMutation };
}
