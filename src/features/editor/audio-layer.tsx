'use client';

import { useEffect, useRef } from 'react';
import type { Asset } from '@/lib/api/types';
import type { Doc, El } from './model';

/** Resync when the element drifts this far from the playhead. */
const DRIFT_S = 0.25;

type Props = {
  doc: Doc;
  assets: Asset[];
  timeMs: number;
  playing: boolean;
};

export function audioElements(doc: Doc): El[] {
  return doc.tracks
    .filter((t) => t.type === 'audio')
    .flatMap((t) => t.elements);
}

/**
 * Where an audio element should be at timeline time `t`: seconds into its
 * source, or null when it isn't playing then.
 */
export function audioPosition(el: El, t: number): number | null {
  if (t < el.startTimeMs || t >= el.endTimeMs) return null;
  return ((el.properties.sourceStartMs ?? 0) + t - el.startTimeMs) / 1000;
}

/**
 * Plays audio overlays (music, voiceover) in the preview, kept in step with
 * the playhead. The base clip's own sound comes from the preview video.
 */
export function AudioLayer({ doc, assets, timeMs, playing }: Props) {
  const players = useRef(new Map<string, HTMLAudioElement>());
  const elements = audioElements(doc);

  useEffect(() => {
    for (const el of elements) {
      const audio = players.current.get(el.key);
      if (!audio) continue;
      // The export allows up to 200%; the browser stops at 100%.
      audio.volume = Math.min(Math.max(el.properties.volume ?? 1, 0), 1);
      const position = playing ? audioPosition(el, timeMs) : null;
      if (position === null) {
        if (!audio.paused) audio.pause();
        continue;
      }
      if (Math.abs(audio.currentTime - position) > DRIFT_S) {
        audio.currentTime = position;
      }
      if (audio.paused) void audio.play().catch(() => undefined);
    }
  });

  // Stop everything when the editor closes.
  useEffect(() => {
    const map = players.current;
    return () => map.forEach((audio) => audio.pause());
  }, []);

  return (
    <div hidden>
      {elements.map((el) => {
        const src = assets.find((a) => a.id === el.assetId)?.fileUrl;
        if (!src) return null;
        return (
          <audio
            key={el.key}
            src={src}
            preload='auto'
            ref={(node) => {
              if (node) players.current.set(el.key, node);
              else players.current.delete(el.key);
            }}
          />
        );
      })}
    </div>
  );
}
