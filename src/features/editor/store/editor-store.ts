'use client';

import { create } from 'zustand';

export interface TimelineElement {
  id: string;
  type: 'video' | 'audio' | 'text' | 'image';
  startTimeMs: number;
  endTimeMs: number;
  layer: number;
  properties: any;
}

export interface TimelineTrack {
  id: string;
  type: 'video' | 'audio' | 'text' | 'image';
  elements: TimelineElement[];
  order: number;
}

interface EditorState {
  compositionId: string | null;
  durationMs: number;
  currentTimeMs: number;
  zoom: number; // 1 pixel = X ms
  tracks: TimelineTrack[];
  selectedElementId: string | null;
  isPlaying: boolean;

  // Actions
  setComposition: (
    id: string,
    duration: number,
    tracks: TimelineTrack[]
  ) => void;
  setCurrentTime: (time: number) => void;
  setZoom: (zoom: number) => void;
  setSelectedElement: (id: string | null) => void;
  togglePlay: () => void;
  updateElement: (elementId: string, updates: Partial<TimelineElement>) => void;
  addElement: (trackId: string, element: TimelineElement) => void;
  removeElement: (elementId: string) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  compositionId: null,
  durationMs: 0,
  currentTimeMs: 0,
  zoom: 10, // Default 1px = 10ms
  tracks: [],
  selectedElementId: null,
  isPlaying: false,

  setComposition: (id, duration, tracks) =>
    set({ compositionId: id, durationMs: duration, tracks }),
  setCurrentTime: (time) =>
    set((state) => ({
      currentTimeMs: Math.max(0, Math.min(time, state.durationMs))
    })),
  setZoom: (zoom) => set({ zoom }),
  setSelectedElement: (id) => set({ selectedElementId: id }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  updateElement: (elementId, updates) =>
    set((state) => ({
      tracks: state.tracks.map((track) => ({
        ...track,
        elements: track.elements.map((el) =>
          el.id === elementId ? { ...el, ...updates } : el
        )
      }))
    })),

  addElement: (trackId, element) =>
    set((state) => ({
      tracks: state.tracks.map((track) =>
        track.id === trackId
          ? { ...track, elements: [...track.elements, element] }
          : track
      )
    })),

  removeElement: (elementId) =>
    set((state) => ({
      tracks: state.tracks.map((track) => ({
        ...track,
        elements: track.elements.filter((el) => el.id !== elementId)
      }))
    }))
}));
