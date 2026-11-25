'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';
import { keys } from '../keys';
import type {
  EditorComposition,
  Paginated,
  RenderJob,
  TrackType
} from '../types';
import { isJobActive } from './projects';

export function useComposition(id: string) {
  return useQuery({
    queryKey: keys.editor.timeline(id),
    queryFn: ({ signal }) =>
      api.get<EditorComposition>(
        `/v1/content-compositions/${id}/timeline`,
        undefined,
        signal
      ),
    // The editor owns this state once loaded; don't refetch under it.
    staleTime: Infinity,
    refetchOnWindowFocus: false
  });
}

export type SaveTimelineBody = {
  tracks: Array<{
    type: TrackType;
    metadata?: Record<string, any>;
    elements: Array<{
      type: TrackType;
      startTimeMs: number;
      endTimeMs: number;
      layer?: number;
      properties?: Record<string, any>;
      assetId?: string | null;
    }>;
  }>;
};

export function useSaveTimeline(id: string) {
  return useMutation({
    meta: { errorTitle: 'Couldn’t save the timeline' },
    mutationFn: (body: SaveTimelineBody) =>
      api.put<EditorComposition>(
        `/v1/content-compositions/${id}/timeline`,
        body
      )
  });
}

export function useRenders(compositionId: string) {
  return useQuery({
    queryKey: keys.editor.renders(compositionId),
    queryFn: ({ signal }) =>
      api.get<Paginated<RenderJob>>(
        '/v1/rendering-jobs',
        { compositionId, page: 1, limit: 10 },
        signal
      ),
    refetchInterval: (query) =>
      query.state.data?.data.some((r) => isJobActive(r.status)) ? 2500 : false
  });
}

/** Queues an export of the composition. Costs one credit. */
export function useStartRender(compositionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { errorTitle: 'Export didn’t start' },
    mutationFn: () =>
      api.post<RenderJob>('/v1/rendering-jobs', { compositionId }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: keys.editor.renders(compositionId)
      });
      queryClient.invalidateQueries({ queryKey: keys.billing.wallet });
      queryClient.invalidateQueries({ queryKey: keys.projects.all });
    }
  });
}
