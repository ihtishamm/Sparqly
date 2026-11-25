import { useCallback, useRef, useState } from 'react';
import type { SaveTimelineBody } from '@/lib/api/hooks/editor';
import type { EditorComposition, TrackType } from '@/lib/api/types';

/** Editor-side element: a stable client key replaces the server id. */
export type El = {
  key: string;
  type: TrackType;
  startTimeMs: number;
  endTimeMs: number;
  layer: number;
  properties: Record<string, any>;
  assetId: string | null;
};

export type Track = {
  key: string;
  type: TrackType;
  metadata: Record<string, any> | null;
  elements: El[];
};

export type Doc = { tracks: Track[] };

export const MIN_ELEMENT_MS = 200;
const TRACK_ORDER: TrackType[] = ['video', 'image', 'text', 'audio'];

let counter = 0;
export const newKey = () =>
  `k${Date.now().toString(36)}${(counter++).toString(36)}`;

export function fromComposition(c: EditorComposition): Doc {
  return {
    tracks: [...c.tracks]
      .sort((a, b) => a.trackOrder - b.trackOrder)
      .map((t) => ({
        key: newKey(),
        type: t.type,
        metadata: t.metadata,
        elements: t.elements.map((e) => ({
          key: newKey(),
          type: e.type,
          startTimeMs: e.startTimeMs,
          endTimeMs: e.endTimeMs,
          layer: e.layer,
          properties: e.properties ?? {},
          assetId: e.assetId
        }))
      }))
  };
}

export function toSaveBody(doc: Doc): SaveTimelineBody {
  return {
    tracks: doc.tracks.map((t) => ({
      type: t.type,
      metadata: t.metadata ?? undefined,
      elements: [...t.elements]
        .sort((a, b) => a.startTimeMs - b.startTimeMs)
        .map((e) => ({
          type: e.type,
          startTimeMs: Math.round(e.startTimeMs),
          endTimeMs: Math.round(e.endTimeMs),
          layer: e.layer,
          properties: e.properties,
          assetId: e.assetId
        }))
    }))
  };
}

/** The base clip: first element of the first video track. */
export function mainElement(doc: Doc): El | null {
  return doc.tracks.find((t) => t.type === 'video')?.elements[0] ?? null;
}

/**
 * Length of the export: the base clip's end, since the renderer has no
 * frames past it. Without a clip, the furthest element.
 */
export function docDuration(doc: Doc) {
  const main = mainElement(doc);
  if (main) return main.endTimeMs;
  let max = 0;
  for (const t of doc.tracks)
    for (const e of t.elements) max = Math.max(max, e.endTimeMs);
  return max;
}

export function findElement(doc: Doc, key: string | null) {
  if (!key) return null;
  for (const t of doc.tracks) {
    const el = t.elements.find((e) => e.key === key);
    if (el) return { track: t, el };
  }
  return null;
}

export function updateElement(
  doc: Doc,
  key: string,
  patch: (el: El) => El
): Doc {
  return {
    tracks: doc.tracks.map((t) =>
      t.elements.some((e) => e.key === key)
        ? {
            ...t,
            elements: t.elements.map((e) => (e.key === key ? patch(e) : e))
          }
        : t
    )
  };
}

export function removeElement(doc: Doc, key: string): Doc {
  return {
    tracks: doc.tracks
      .map((t) => ({ ...t, elements: t.elements.filter((e) => e.key !== key) }))
      // Keep the main video track even if empty so the error is clear.
      .filter(
        (t, i) => t.elements.length > 0 || (t.type === 'video' && i === 0)
      )
  };
}

/** Adds an element to the first track of its type, creating one if needed. */
export function addElement(doc: Doc, el: El): Doc {
  const index = doc.tracks.findIndex((t) => t.type === el.type);
  if (index >= 0) {
    return {
      tracks: doc.tracks.map((t, i) =>
        i === index ? { ...t, elements: [...t.elements, el] } : t
      )
    };
  }
  const tracks = [
    ...doc.tracks,
    { key: newKey(), type: el.type, metadata: null, elements: [el] }
  ];
  tracks.sort(
    (a, b) => TRACK_ORDER.indexOf(a.type) - TRACK_ORDER.indexOf(b.type)
  );
  return { tracks };
}

/** Moves an element in time. Word timings in captions move with it. */
export function shiftElement(el: El, deltaMs: number): El {
  const words = Array.isArray(el.properties.words)
    ? el.properties.words.map((w: any) => ({
        ...w,
        startMs: Math.round((w.startMs ?? 0) + deltaMs),
        endMs: Math.round((w.endMs ?? 0) + deltaMs)
      }))
    : undefined;
  return {
    ...el,
    startTimeMs: el.startTimeMs + deltaMs,
    endTimeMs: el.endTimeMs + deltaMs,
    properties: words ? { ...el.properties, words } : el.properties
  };
}

/**
 * Trims the start of the base clip by `deltaMs` (positive = cut more). The
 * clip stays at 0, so everything after it moves with the source audio.
 */
export function trimMainStart(doc: Doc, deltaMs: number): Doc {
  const main = mainElement(doc);
  if (!main || !deltaMs) return doc;
  return {
    tracks: doc.tracks.map((t) => ({
      ...t,
      elements: t.elements
        .map((e) => {
          if (e.key === main.key) {
            return {
              ...e,
              endTimeMs: e.endTimeMs - deltaMs,
              properties: {
                ...e.properties,
                sourceStartMs: Math.max(
                  0,
                  (e.properties.sourceStartMs ?? 0) + deltaMs
                )
              }
            };
          }
          return shiftElement(e, -deltaMs);
        })
        .filter((e) => e.endTimeMs > 0)
        .map((e) =>
          e.startTimeMs < 0 && e.key !== main.key ? { ...e, startTimeMs: 0 } : e
        )
    }))
  };
}

/* -------------------------------- History -------------------------------- */

const LIMIT = 100;

/**
 * Undo/redo around an immutable document. Drags call `begin()` once, then
 * `set(doc, false)` per frame, then `end()` to record a single step.
 */
export function useHistory(initial: Doc) {
  const [state, setState] = useState({
    past: [] as Doc[],
    present: initial,
    future: [] as Doc[]
  });
  const dragStart = useRef<Doc | null>(null);

  const set = useCallback((next: Doc | ((d: Doc) => Doc), record = true) => {
    setState((s) => {
      const doc = typeof next === 'function' ? next(s.present) : next;
      if (doc === s.present) return s;
      if (!record) return { ...s, present: doc };
      return {
        past: [...s.past, s.present].slice(-LIMIT),
        present: doc,
        future: []
      };
    });
  }, []);

  const begin = useCallback(() => {
    setState((s) => {
      dragStart.current = s.present;
      return s;
    });
  }, []);

  const end = useCallback(() => {
    setState((s) => {
      const start = dragStart.current;
      dragStart.current = null;
      if (!start || start === s.present) return s;
      return {
        past: [...s.past, start].slice(-LIMIT),
        present: s.present,
        future: []
      };
    });
  }, []);

  const undo = useCallback(() => {
    setState((s) =>
      s.past.length
        ? {
            past: s.past.slice(0, -1),
            present: s.past[s.past.length - 1],
            future: [s.present, ...s.future]
          }
        : s
    );
  }, []);

  const redo = useCallback(() => {
    setState((s) =>
      s.future.length
        ? {
            past: [...s.past, s.present],
            present: s.future[0],
            future: s.future.slice(1)
          }
        : s
    );
  }, []);

  return {
    doc: state.present,
    set,
    begin,
    end,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0
  };
}
