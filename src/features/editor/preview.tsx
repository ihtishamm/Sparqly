'use client';

import { useRef } from 'react';
import { Film } from 'lucide-react';
import type { Asset } from '@/lib/api/types';
import { cn } from '@/lib/utils';
import type { Doc, El } from './model';

type Props = {
  doc: Doc;
  assets: Asset[];
  width: number;
  height: number;
  background: string;
  timeMs: number;
  selected: string | null;
  sourceUrl: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onSelect: (key: string | null) => void;
  onDragStart: () => void;
  onMove: (key: string, position: { x: number; y: number }) => void;
  onDragEnd: () => void;
  onLoadedDuration: (ms: number) => void;
};

const active = (el: El, t: number) => t >= el.startTimeMs && t < el.endTimeMs;

/** The 9:16 frame with live text and image overlays on the base clip. */
export function Preview(props: Props) {
  const { doc, width, height, timeMs, selected } = props;
  const frame = useRef<HTMLDivElement>(null);

  const overlays = doc.tracks
    .filter((t) => t.type === 'text' || t.type === 'image')
    .flatMap((t) => t.elements)
    .filter((el) => active(el, timeMs))
    .sort((a, b) => a.layer - b.layer);

  /** Drag an overlay around the frame; positions are composition pixels. */
  function startDrag(e: React.PointerEvent, el: El) {
    e.stopPropagation();
    props.onSelect(el.key);
    const rect = frame.current?.getBoundingClientRect();
    if (!rect) return;
    const scale = width / rect.width;
    const origin = el.properties.position ?? {
      x: el.type === 'text' ? width / 2 : 0,
      y: el.type === 'text' ? height - 200 : 0
    };
    const startX = e.clientX;
    const startY = e.clientY;
    let moved = false;

    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) * scale;
      const dy = (ev.clientY - startY) * scale;
      if (!moved && Math.hypot(dx, dy) < 3) return;
      if (!moved) props.onDragStart();
      moved = true;
      props.onMove(el.key, {
        x: Math.round(Math.min(width, Math.max(0, origin.x + dx))),
        y: Math.round(Math.min(height, Math.max(0, origin.y + dy)))
      });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (moved) props.onDragEnd();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  return (
    <div
      ref={frame}
      className='relative h-full max-h-full overflow-hidden rounded-lg shadow-[0_0_0_1px_var(--border)] select-none'
      style={{
        aspectRatio: `${width} / ${height}`,
        background: props.background,
        containerType: 'size'
      }}
      onPointerDown={() => props.onSelect(null)}
    >
      {props.sourceUrl ? (
        <video
          ref={props.videoRef}
          src={props.sourceUrl}
          playsInline
          preload='auto'
          className='absolute inset-0 size-full object-cover'
          onLoadedMetadata={(e) =>
            props.onLoadedDuration(e.currentTarget.duration * 1000)
          }
        />
      ) : (
        <div className='text-subtle-foreground absolute inset-0 flex items-center justify-center'>
          <Film className='size-6' aria-hidden />
        </div>
      )}

      {overlays.map((el) => {
        const isSelected = el.key === selected;
        if (el.type === 'image') {
          const asset = props.assets.find((a) => a.id === el.assetId);
          if (!asset) return null;
          const pos = el.properties.position ?? { x: 0, y: 0 };
          const w = el.properties.scale?.x > 0 ? el.properties.scale.x : width;
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={el.key}
              src={asset.fileUrl}
              alt=''
              draggable={false}
              onPointerDown={(e) => startDrag(e, el)}
              className={cn(
                'absolute cursor-move',
                isSelected && 'outline-primary outline-2 outline-offset-2'
              )}
              style={{
                left: `${(pos.x / width) * 100}%`,
                top: `${(pos.y / height) * 100}%`,
                width: `${(w / width) * 100}%`,
                zIndex: el.layer
              }}
            />
          );
        }

        const pos = el.properties.position;
        const size =
          Number(el.properties.fontSize) > 0
            ? Number(el.properties.fontSize)
            : 80;
        const words: Array<{ text: string; startMs: number; endMs: number }> =
          Array.isArray(el.properties.words) ? el.properties.words : [];
        return (
          <div
            key={el.key}
            onPointerDown={(e) => startDrag(e, el)}
            className={cn(
              'absolute max-w-[90%] cursor-move rounded px-1 text-center leading-tight font-bold',
              isSelected && 'outline-primary outline-2 outline-offset-2'
            )}
            style={{
              ...(pos
                ? {
                    left: `${(pos.x / width) * 100}%`,
                    top: `${(pos.y / height) * 100}%`,
                    transform: 'translate(-50%, -50%)'
                  }
                : {
                    left: '50%',
                    bottom: `${(200 / height) * 100}%`,
                    transform: 'translateX(-50%)'
                  }),
              fontFamily: 'Arial, Helvetica, sans-serif',
              fontSize: `${(size / height) * 100}cqh`,
              color: el.properties.fontColor || '#ffffff',
              WebkitTextStroke: `${(3 / height) * 100}cqh #000`,
              paintOrder: 'stroke fill',
              zIndex: el.layer,
              width: 'max-content'
            }}
          >
            {words.length
              ? words.map((w, i) => (
                  // Matches the export's karaoke: words are yellow until spoken.
                  <span
                    key={i}
                    style={
                      timeMs < w.startMs ? { color: '#ffff00' } : undefined
                    }
                  >
                    {w.text}{' '}
                  </span>
                ))
              : el.properties.text}
          </div>
        );
      })}
    </div>
  );
}
