import { Content, InfinityPaginationResponse } from '@/types/api';
import { useApi } from '@/hooks/use-api';
import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery
} from '@tanstack/react-query';

export interface CreateContentData {
  title: string;
  status?: string;
  sourceType?: string;
  sourceUrl?: string;
  type?: string;
  description?: string;
  metadata?: any;
  user?: { id: number | string };
}

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

  const useGetInfiniteContents = (limit = 10) => {
    return useInfiniteQuery({
      queryKey: ['contents', 'infinite', limit],
      queryFn: ({ pageParam = 1 }) =>
        get<InfinityPaginationResponse<Content>>('/v1/contents', {
          page: pageParam,
          limit
        }),
      getNextPageParam: (lastPage, allPages) =>
        lastPage.hasNextPage ? allPages.length + 1 : undefined,
      initialPageParam: 1
    });
  };

  const createContentMutation = useMutation<Content, Error, CreateContentData>({
    mutationFn: (data: CreateContentData) =>
      post<Content>('/v1/contents', data),
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

  const useGetContentAssets = (page = 1, limit = 10) => {
    return useQuery({
      queryKey: ['content-assets', page, limit],
      queryFn: () =>
        get<InfinityPaginationResponse<any>>('/v1/content-assets', {
          page,
          limit
        })
    });
  };

  const useGetInfiniteContentAssets = (limit = 10) => {
    return useInfiniteQuery({
      queryKey: ['content-assets', 'infinite', limit],
      queryFn: ({ pageParam = 1 }) =>
        get<InfinityPaginationResponse<any>>('/v1/content-assets', {
          page: pageParam,
          limit
        }),
      getNextPageParam: (lastPage, allPages) =>
        lastPage.hasNextPage ? allPages.length + 1 : undefined,
      initialPageParam: 1
    });
  };

  const createAssetMutation = useMutation({
    mutationFn: (data: {
      content: { id: string };
      type: string;
      storageProvider: string;
      fileUrl: string;
      mimeType?: string;
      metadata?: any;
    }) => post<any>('/v1/content-assets', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-assets'] });
      queryClient.invalidateQueries({ queryKey: ['contents'] });
    },
    meta: {
      errorMessage: 'Failed to save asset'
    }
  });

  const deleteAssetMutation = useMutation({
    mutationFn: (id: string) => remove(`/v1/content-assets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-assets'] });
    }
  });

  return {
    useGetContents,
    useGetInfiniteContents,
    useGetContentAssets,
    useGetInfiniteContentAssets,
    createContentMutation,
    deleteContentMutation,
    createAssetMutation,
    deleteAssetMutation
  };
}
