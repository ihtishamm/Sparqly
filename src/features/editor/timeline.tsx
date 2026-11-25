'use client';

import { useRef } from 'react';
import { Image as ImageIcon, Music, Type, Video } from 'lucide-react';
import { timecode } from '@/lib/format';
import { cn } from '@/lib/utils';
import {
  MIN_ELEMENT_MS,
  mainElement,
  shiftElement,
  trimMainStart,
  updateElement,
  type Doc,
  type El
} from './model';

const ICONS = { video: Video, image: ImageIcon, text: Type, audio: Music };
const LABELS = {
  video: 'Video',
  image: 'Images',
  text: 'Text',
  audio: 'Audio'
};
const TONES: Record<string, string> = {
  video: 'bg-primary/25 border-primary/50 text-foreground',
  image: 'bg-info/20 border-info/45 text-foreground',
  text: 'bg-warning/15 border-warning/45 text-foreground',
  audio: 'bg-success/15 border-success/45 text-foreground'
};
const SNAP_PX = 8;
const ROW_H = 40;

type Mode = 'move' | 'start' | 'end';

type Props = {
  doc: Doc;
  timeMs: number;
  durationMs: number;
  pxPerMs: number;
  selected: string | null;
  /** Length of the source video, which bounds trimming the base clip. */
  sourceDurationMs: number | null;
  onSeek: (ms: number) => void;
  onSelect: (key: string | null) => void;
  onBegin: () => void;
  onChange: (doc: Doc) => void;
  onEnd: () => void;
};

function tickStep(pxPerMs: number) {
  // Aim for a label roughly every 80px.
  const steps = [100, 250, 500, 1000, 2000, 5000, 10_000, 30_000, 60_000];
  return steps.find((s) => s * pxPerMs >= 80) ?? 60_000;
}

export function Timeline(props: Props) {
  const { doc, pxPerMs, timeMs, selected } = props;
  const lanes = useRef<HTMLDivElement>(null);
  const main = mainElement(doc);
  const furthest = doc.tracks.reduce(
    (max, t) => t.elements.reduce((m, e) => Math.max(m, e.endTimeMs), max),
    props.durationMs
  );
  const totalMs = Math.max(furthest, 1000) + 5000;
  const widthPx = totalMs * pxPerMs;
  const step = tickStep(pxPerMs);

  function msAt(clientX: number) {
    const rect = lanes.current!.getBoundingClientRect();
    return Math.max(0, (clientX - rect.left) / pxPerMs);
  }

  function seekDrag(e: React.PointerEvent) {
    props.onSeek(Math.min(msAt(e.clientX), props.durationMs));
    const move = (ev: PointerEvent) =>
      props.onSeek(Math.min(msAt(ev.clientX), props.durationMs));
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  function startDrag(e: React.PointerEvent, el: El, mode: Mode) {
    e.stopPropagation();
    props.onSelect(el.key);
    const isMain = el.key === main?.key;
    if (isMain && mode === 'move') return; // The base clip always starts at 0.

    const snapshot = doc;
    const startX = e.clientX;
    const edges = [0, timeMs];
    for (const t of snapshot.tracks)
      for (const other of t.elements)
        if (other.key !== el.key)
          edges.push(other.startTimeMs, other.endTimeMs);
    const snapMs = SNAP_PX / pxPerMs;
    const snap = (value: number) => {
      if (e.altKey) return value;
      const hit = edges.find((edge) => Math.abs(edge - value) <= snapMs);
      return hit ?? value;
    };
    let began = false;

    const move = (ev: PointerEvent) => {
      const raw = (ev.clientX - startX) / pxPerMs;
      if (!began && Math.abs(ev.clientX - startX) < 3) return;
      if (!began) props.onBegin();
      began = true;

      if (mode === 'move') {
        let delta = snap(el.startTimeMs + raw) - el.startTimeMs;
        // Snap the end edge too when the start didn't snap.
        if (delta === raw) delta = snap(el.endTimeMs + raw) - el.endTimeMs;
        delta = Math.max(-el.startTimeMs, delta);
        props.onChange(
          updateElement(snapshot, el.key, (x) => shiftElement(x, delta))
        );
        return;
      }

      if (mode === 'start') {
        if (isMain) {
          const sourceStart = el.properties.sourceStartMs ?? 0;
          const d = Math.min(
            Math.max(raw, -sourceStart),
            el.endTimeMs - el.startTimeMs - MIN_ELEMENT_MS
          );
          props.onChange(trimMainStart(snapshot, Math.round(d)));
          return;
        }
        const start = Math.min(
          Math.max(0, snap(el.startTimeMs + raw)),
          el.endTimeMs - MIN_ELEMENT_MS
        );
        const d = start - el.startTimeMs;
        props.onChange(
          updateElement(snapshot, el.key, (x) => ({
            ...x,
            startTimeMs: start,
            properties:
              x.type === 'audio' || x.type === 'video'
                ? {
                    ...x.properties,
                    sourceStartMs: Math.max(
                      0,
                      (x.properties.sourceStartMs ?? 0) + d
                    )
                  }
                : x.properties
          }))
        );
        return;
      }

      // mode === 'end'
      let end = Math.max(
        snap(el.endTimeMs + raw),
        el.startTimeMs + MIN_ELEMENT_MS
      );
      if (isMain && props.sourceDurationMs) {
        const sourceStart = el.properties.sourceStartMs ?? 0;
        end = Math.min(
          end,
          el.startTimeMs + props.sourceDurationMs - sourceStart
        );
      }
      props.onChange(
        updateElement(snapshot, el.key, (x) => ({
          ...x,
          endTimeMs: end,
          properties: isMain
            ? {
                ...x.properties,
                sourceEndMs:
                  (x.properties.sourceStartMs ?? 0) + (end - x.startTimeMs)
              }
            : x.properties
        }))
      );
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (began) props.onEnd();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  return (
    <div className='scrollbar-thin flex min-h-0 flex-1 overflow-y-auto text-xs'>
      {/* Track labels */}
      <div className='bg-sidebar h-max min-h-full w-24 shrink-0 border-r'>
        <div className='h-7 border-b' />
        {doc.tracks.map((t) => {
          const Icon = ICONS[t.type];
          return (
            <div
              key={t.key}
              className='text-muted-foreground flex items-center gap-1.5 border-b px-3'
              style={{ height: ROW_H }}
            >
              <Icon className='size-3.5' aria-hidden /> {LABELS[t.type]}
            </div>
          );
        })}
      </div>

      {/* Lanes */}
      <div className='scrollbar-thin relative h-max min-w-0 flex-1 overflow-x-auto'>
        <div ref={lanes} className='relative' style={{ width: widthPx }}>
          {/* Ruler */}
          <div
            className='bg-sidebar sticky top-0 z-10 h-7 cursor-pointer border-b'
            onPointerDown={seekDrag}
            aria-label='Timeline ruler'
          >
            {Array.from({ length: Math.ceil(totalMs / step) + 1 }).map(
              (_, i) => (
                <span
                  key={i}
                  className='text-subtle-foreground tnum absolute top-0 flex h-full items-end border-l pb-1 pl-1 text-[10px]'
                  style={{ left: i * step * pxPerMs }}
                >
                  {timecode(i * step).replace(/\.0$/, '')}
                </span>
              )
            )}
          </div>

          {doc.tracks.map((t) => (
            <div
              key={t.key}
              className='relative border-b'
              style={{ height: ROW_H }}
              onPointerDown={(e) => {
                props.onSelect(null);
                seekDrag(e);
              }}
            >
              {t.elements.map((el) => {
                const isMain = el.key === main?.key;
                const label =
                  el.type === 'text'
                    ? el.properties.text || 'Text'
                    : el.type === 'video'
                      ? isMain
                        ? 'Clip'
                        : 'Video'
                      : el.type === 'image'
                        ? 'Image'
                        : 'Audio';
                return (
                  <div
                    key={el.key}
                    role='button'
                    tabIndex={-1}
                    aria-label={`${label}, ${timecode(el.startTimeMs)} to ${timecode(el.endTimeMs)}`}
                    aria-pressed={el.key === selected}
                    onPointerDown={(e) => startDrag(e, el, 'move')}
                    className={cn(
                      'group absolute top-1 bottom-1 overflow-hidden rounded-md border px-2 leading-[30px] whitespace-nowrap',
                      TONES[el.type],
                      isMain
                        ? 'cursor-default'
                        : 'cursor-grab active:cursor-grabbing',
                      el.key === selected && 'ring-foreground ring-2'
                    )}
                    style={{
                      left: el.startTimeMs * pxPerMs,
                      width: Math.max(
                        4,
                        (el.endTimeMs - el.startTimeMs) * pxPerMs
                      )
                    }}
                  >
                    <span className='pointer-events-none truncate'>
                      {label}
                    </span>
                    <span
                      className='group-hover:bg-foreground/30 absolute inset-y-0 left-0 w-1.5 cursor-ew-resize opacity-0 group-hover:opacity-100'
                      onPointerDown={(e) => startDrag(e, el, 'start')}
                    />
                    <span
                      className='group-hover:bg-foreground/30 absolute inset-y-0 right-0 w-1.5 cursor-ew-resize opacity-0 group-hover:opacity-100'
                      onPointerDown={(e) => startDrag(e, el, 'end')}
                    />
                  </div>
                );
              })}
            </div>
          ))}

          {/* Past the end of the clip: not in the export. */}
          <div
            className='bg-canvas/60 pointer-events-none absolute top-7 right-0 bottom-0 border-l border-dashed'
            style={{ left: props.durationMs * pxPerMs }}
            title='Not included in the export'
          />

          {/* Playhead */}
          <div
            className='bg-destructive pointer-events-none absolute top-0 bottom-0 z-20 w-px'
            style={{ left: timeMs * pxPerMs }}
          >
            <div className='bg-destructive absolute -top-px -left-[5px] size-[11px] rounded-b-sm' />
          </div>
        </div>
      </div>
    </div>
  );
}
