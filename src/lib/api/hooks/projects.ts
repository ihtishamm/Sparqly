'use client';

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query';
import { api } from '../client';
import { keys } from '../keys';
import type {
  AiJob,
  Paginated,
  ProjectDetail,
  ProjectDocument,
  ProjectSummary
} from '../types';
import { useAuthStore } from '@/store/auth-store';

const PAGE_SIZE = 24;

export function isJobActive(status?: string | null) {
  return status === 'pending' || status === 'processing';
}

export function useProjects(search = '') {
  return useInfiniteQuery({
    queryKey: keys.projects.list(search),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      api.get<Paginated<ProjectSummary>>(
        '/v1/projects',
        { page: pageParam, limit: PAGE_SIZE, search },
        signal
      ),
    getNextPageParam: (last, pages) =>
      last.hasNextPage ? pages.length + 1 : undefined,
    // Keep polling while any visible project is still being generated.
    refetchInterval: (query) =>
      query.state.data?.pages.some((p) =>
        p.data.some((project) => isJobActive(project.latestJob?.status))
      )
        ? 5000
        : false
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: keys.projects.detail(id),
    queryFn: ({ signal }) =>
      api.get<ProjectDetail>(`/v1/projects/${id}`, undefined, signal),
    refetchInterval: (query) => {
      const project = query.state.data;
      if (!project) return false;
      const busy =
        isJobActive(project.latestJob?.status) ||
        project.clips.some((c) => isJobActive(c.render?.status));
      return busy ? 3000 : false;
    }
  });
}

export function useSaveDocument(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { errorTitle: 'Couldn’t save' },
    mutationFn: ({ variantId, text }: { variantId: string; text: string }) =>
      api.put<ProjectDocument>(
        `/v1/projects/${projectId}/documents/${variantId}`,
        { text }
      ),
    onSuccess: (doc) => {
      queryClient.setQueryData<ProjectDetail>(
        keys.projects.detail(projectId),
        (project) =>
          project && {
            ...project,
            documents: project.documents.map((d) =>
              d.variantId === doc.variantId ? doc : d
            )
          }
      );
    }
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { errorTitle: 'Couldn’t delete the project' },
    mutationFn: (id: string) => api.delete(`/v1/contents/${id}`),
    onSuccess: (_data, id) => {
      // Drop the deleted project rather than refetching it (that would 422).
      queryClient.removeQueries({ queryKey: keys.projects.detail(id) });
      queryClient.invalidateQueries({
        queryKey: keys.projects.all,
        predicate: (q) => q.queryKey[1] !== 'detail'
      });
      queryClient.invalidateQueries({ queryKey: keys.posts.all });
    }
  });
}

export type OutputType = 'short-clips' | 'blog-post' | 'linkedin' | 'threads';

/**
 * Starts a repurpose run: creates the project (content) for the source URL,
 * then queues the AI job on it. Costs one credit.
 */
export function useStartRepurpose() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    meta: { errorTitle: false },
    mutationFn: async (input: {
      sourceUrl: string;
      title?: string;
      outputs: OutputType[];
      tone: string;
    }) => {
      const content = await api.post<{ id: string }>('/v1/contents', {
        title: input.title,
        sourceUrl: input.sourceUrl,
        sourceType: 'url',
        type: 'video'
      });
      try {
        await api.post<AiJob>('/v1/ai-jobs', {
          jobType: 'repurpose',
          status: 'pending',
          content: { id: content.id },
          user: { id: user?.id },
          input: { targetTypes: input.outputs, tone: input.tone }
        });
      } catch (error) {
        // Don't leave an empty project behind when the job can't start.
        await api.delete(`/v1/contents/${content.id}`).catch(() => undefined);
        throw error;
      }
      return content;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.projects.all });
      queryClient.invalidateQueries({ queryKey: keys.billing.wallet });
    }
  });
}
