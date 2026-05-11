import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface CompositionElement {
  id: string;
  type: 'video' | 'image' | 'text' | 'audio';
  startTimeMs: number;
  endTimeMs: number;
  layer: number;
  properties: any;
}

export interface CompositionTrack {
  id: string;
  type: 'video' | 'audio' | 'text' | 'image';
  order: number;
  elements: CompositionElement[];
}

export interface ContentComposition {
  id: string;
  contentId: string;
  name: string;
  width: number;
  height: number;
  durationMs: number;
  fps: number;
  tracks: CompositionTrack[];
  createdAt: string;
  updatedAt: string;
}

export interface RenderingJob {
  id: string;
  compositionId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  outputUrl?: string;
  errorMessage?: string;
  createdAt: string;
}

export const useEditorApi = () => {
  const queryClient = useQueryClient();

  const useGetComposition = (id: string) => {
    return useQuery({
      queryKey: ['composition', id],
      queryFn: async () => {
        return apiClient.get<ContentComposition>(
          `/v1/content-compositions/${id}`
        );
      },
      enabled: !!id
    });
  };

  const useSaveComposition = () => {
    return useMutation({
      mutationFn: async ({
        id,
        data
      }: {
        id: string;
        data: Partial<ContentComposition>;
      }) => {
        return apiClient.patch<ContentComposition>(
          `/v1/content-compositions/${id}`,
          data
        );
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['composition', data.id] });
      }
    });
  };

  const useCreateRenderingJob = () => {
    return useMutation({
      mutationFn: async (compositionId: string) => {
        return apiClient.post<RenderingJob>('/v1/rendering-jobs', {
          compositionId
        });
      }
    });
  };

  const useGetRenderingJob = (id: string) => {
    return useQuery({
      queryKey: ['rendering-job', id],
      queryFn: async () => {
        return apiClient.get<RenderingJob>(`/v1/rendering-jobs/${id}`);
      },
      enabled: !!id,
      refetchInterval: (data) =>
        data?.state?.data?.status === 'processing' ||
        data?.state?.data?.status === 'queued'
          ? 2000
          : false
    });
  };

  return {
    useGetComposition,
    useSaveComposition,
    useCreateRenderingJob,
    useGetRenderingJob
  };
};
