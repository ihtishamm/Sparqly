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

/**
 * The base clips: the first video track. They play back to back from 0 and
 * the renderer joins them in order, so a split clip is several of these.
 */
export function baseClips(doc: Doc): El[] {
  const track = doc.tracks.find((t) => t.type === 'video');
  return track
    ? [...track.elements].sort((a, b) => a.startTimeMs - b.startTimeMs)
    : [];
}

/** The first base clip. */
export function mainElement(doc: Doc): El | null {
  return baseClips(doc)[0] ?? null;
}

export function isBaseClip(doc: Doc, key: string | null) {
  return !!key && baseClips(doc).some((e) => e.key === key);
}

/** The base clip playing at `t` (the last one at or past the end). */
export function clipAt(doc: Doc, t: number): El | null {
  const clips = baseClips(doc);
  return (
    clips.find((c) => t >= c.startTimeMs && t < c.endTimeMs) ??
    clips[clips.length - 1] ??
    null
  );
}

/** Seconds into the source file shown at timeline time `t`. */
export function sourceSecondsAt(clip: El, t: number) {
  const within = Math.min(Math.max(t, clip.startTimeMs), clip.endTimeMs - 1);
  return (
    ((clip.properties.sourceStartMs ?? 0) + within - clip.startTimeMs) / 1000
  );
}

/**
 * Length of the export: the end of the last base clip, since the renderer
 * has no frames past it. Without a clip, the furthest element.
 */
export function docDuration(doc: Doc) {
  const clips = baseClips(doc);
  if (clips.length) return clips[clips.length - 1].endTimeMs;
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

/* ------------------------- Ripple edits on clips -------------------------- */

const withSource = (el: El, sourceStartMs: number, lengthMs: number): El => ({
  ...el,
  properties: {
    ...el.properties,
    sourceStartMs,
    sourceEndMs: sourceStartMs + lengthMs
  }
});

/**
 * Applies an edit to one base clip and ripples the rest of the timeline:
 * everything starting at or after `at` moves by `delta`, and items that lay
 * entirely inside the removed span `cut` go with the footage they belonged
 * to (captions of cut speech, for example). Items pushed before `floor` are
 * clamped to it, or dropped if nothing is left.
 */
function ripple(
  doc: Doc,
  clip: El,
  edited: El | null,
  at: number,
  delta: number,
  cut: [number, number] | null,
  floor: number
): Doc {
  const inside = (e: El) =>
    !!cut && e.startTimeMs >= cut[0] && e.endTimeMs <= cut[1];
  return {
    tracks: doc.tracks.map((t) => ({
      ...t,
      elements: t.elements.flatMap((e) => {
        if (e.key === clip.key) return edited ? [edited] : [];
        if (inside(e)) return [];
        if (e.startTimeMs < at || !delta) return [e];
        const moved = shiftElement(e, delta);
        if (moved.startTimeMs >= floor) return [moved];
        if (moved.endTimeMs <= floor) return [];
        return [{ ...moved, startTimeMs: floor }];
      })
    }))
  };
}

/**
 * Trims the start of a base clip by `deltaMs` (positive = cut more). The clip
 * keeps its place, so what follows moves with the source audio.
 */
export function trimBaseStart(doc: Doc, key: string, deltaMs: number): Doc {
  const clip = baseClips(doc).find((c) => c.key === key);
  if (!clip || !deltaMs) return doc;
  const sourceStart = Math.max(
    0,
    (clip.properties.sourceStartMs ?? 0) + deltaMs
  );
  const edited = withSource(
    { ...clip, endTimeMs: clip.endTimeMs - deltaMs },
    sourceStart,
    clip.endTimeMs - deltaMs - clip.startTimeMs
  );
  return ripple(
    doc,
    clip,
    edited,
    clip.startTimeMs,
    -deltaMs,
    deltaMs > 0 ? [clip.startTimeMs, clip.startTimeMs + deltaMs] : null,
    clip.startTimeMs
  );
}

/** Trims or extends the end of a base clip; later clips follow it. */
export function trimBaseEnd(doc: Doc, key: string, endMs: number): Doc {
  const clip = baseClips(doc).find((c) => c.key === key);
  if (!clip) return doc;
  const end = Math.max(endMs, clip.startTimeMs + MIN_ELEMENT_MS);
  const delta = end - clip.endTimeMs;
  if (!delta) return doc;
  const edited = withSource(
    { ...clip, endTimeMs: end },
    clip.properties.sourceStartMs ?? 0,
    end - clip.startTimeMs
  );
  return ripple(
    doc,
    clip,
    edited,
    clip.endTimeMs,
    delta,
    delta < 0 ? [end, clip.endTimeMs] : null,
    0
  );
}

/** Removes a base clip and closes the gap. The last clip can't be removed. */
export function removeBaseClip(doc: Doc, key: string): Doc {
  const clips = baseClips(doc);
  const clip = clips.find((c) => c.key === key);
  if (!clip || clips.length < 2) return doc;
  return ripple(
    doc,
    clip,
    null,
    clip.endTimeMs,
    clip.startTimeMs - clip.endTimeMs,
    [clip.startTimeMs, clip.endTimeMs],
    0
  );
}

/** Whether `t` falls far enough inside the element to split it there. */
export function canSplit(el: El, t: number) {
  return (
    t - el.startTimeMs >= MIN_ELEMENT_MS && el.endTimeMs - t >= MIN_ELEMENT_MS
  );
}

/**
 * Splits an element in two at `t`. Media halves keep their place in the
 * source; captions divide their word timings between the halves.
 */
export function splitElement(doc: Doc, key: string, t: number): Doc {
  const found = findElement(doc, key);
  if (!found || !canSplit(found.el, t)) return doc;
  const el = found.el;
  const at = Math.round(t);
  const offset = at - el.startTimeMs;
  let first: El = { ...el, endTimeMs: at };
  let second: El = { ...el, key: newKey(), startTimeMs: at };

  if (el.type === 'video' || el.type === 'audio') {
    const sourceStart = el.properties.sourceStartMs ?? 0;
    first = withSource(first, sourceStart, offset);
    second = withSource(second, sourceStart + offset, el.endTimeMs - at);
  } else if (el.type === 'text' && Array.isArray(el.properties.words)) {
    const words = el.properties.words as Array<{
      word?: string;
      text?: string;
      startMs?: number;
    }>;
    const before = words.filter((w) => (w.startMs ?? 0) < at);
    const after = words.filter((w) => (w.startMs ?? 0) >= at);
    const join = (list: typeof words) =>
      list
        .map((w) => w.word ?? w.text ?? '')
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
    first = {
      ...first,
      properties: {
        ...el.properties,
        words: before,
        text: join(before) || el.properties.text
      }
    };
    second = {
      ...second,
      properties: {
        ...el.properties,
        words: after,
        text: join(after) || el.properties.text
      }
    };
  }

  return {
    tracks: doc.tracks.map((tr) =>
      tr.key === found.track.key
        ? {
            ...tr,
            elements: tr.elements.flatMap((e) =>
              e.key === key ? [first, second] : [e]
            )
          }
        : tr
    )
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
