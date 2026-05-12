import { Content, InfinityPaginationResponse } from '@/types/api';
import { useApi } from '@/hooks/use-api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useContents() {
  const { get, post, remove } = useApi();
  const queryClient = useQueryClient();

  const useGetContents = (page = 1, limit = 10) => {
    return useQuery({
      queryKey: ['contents', page, limit],
      queryFn: () =>
        get<InfinityPaginationResponse<Content>>('/v1/contents', {
          page,
          limit
        })
    });
  };

  const createContentMutation = useMutation({
    mutationFn: (data: {
      title: string;
      status: string;
      sourceType: string;
      description?: string;
      metadata?: any;
      user: { id: number | string };
    }) => post<Content>('/v1/contents', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contents'] });
    },
    meta: {
      errorMessage: 'Failed to create content'
    }
  });

  const deleteContentMutation = useMutation({
    mutationFn: (id: string) => remove(`/v1/contents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contents'] });
    }
  });

  const createAssetMutation = useMutation({
    mutationFn: (data: {
      content: { id: string };
      type: string;
      storageProvider: string;
      fileUrl: string;
      mimeType?: string;
    }) => post<any>('/v1/content-assets', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contents'] });
    },
    meta: {
      errorMessage: 'Failed to save asset'
    }
  });

  return {
    useGetContents,
    createContentMutation,
    deleteContentMutation,
    createAssetMutation
  };
}
