'use client';

import * as React from 'react';
import {
  useEditorStore,
  TimelineElement,
  TimelineTrack
} from '../store/editor-store';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function Timeline() {
  const {
    durationMs,
    currentTimeMs,
    zoom,
    tracks,
    setCurrentTime,
    selectedElementId,
    setSelectedElement
  } = useEditorStore();

  const timelineRef = React.useRef<HTMLDivElement>(null);

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + timelineRef.current.scrollLeft;
    const time = x * zoom;
    setCurrentTime(time);
  };

  return (
    <div className='bg-muted/30 flex h-[300px] flex-col overflow-hidden border-t select-none'>
      {/* Toolbar */}
      <div className='bg-background flex items-center justify-between border-b px-4 py-2'>
        <div className='flex items-center gap-4'>
          <span className='font-mono text-xs tabular-nums'>
            {formatTime(currentTimeMs)} / {formatTime(durationMs)}
          </span>
        </div>
        <div className='flex items-center gap-2'>
          <button className='hover:bg-muted rounded p-1' title='Zoom Out'>
            -
          </button>
          <span className='text-xs'>Zoom</span>
          <button className='hover:bg-muted rounded p-1' title='Zoom In'>
            +
          </button>
        </div>
      </div>

      {/* Main Timeline Area */}
      <div
        className='relative flex-1 overflow-auto'
        ref={timelineRef}
        onClick={handleTimelineClick}
      >
        {/* Time Ruler */}
        <div className='bg-background sticky top-0 z-20 flex h-8 w-max min-w-full items-end border-b px-4'>
          {Array.from({ length: Math.ceil(durationMs / 1000) + 1 }).map(
            (_, i) => (
              <div
                key={i}
                className='flex flex-col items-start'
                style={{ width: 1000 / zoom }}
              >
                <div className='bg-muted-foreground/30 h-3 w-px' />
                <span className='text-muted-foreground mb-1 ml-1 text-[10px]'>
                  {i}s
                </span>
              </div>
            )
          )}
        </div>

        {/* Tracks Area */}
        <div className='relative w-max min-w-full space-y-1 pt-2 pb-20'>
          {tracks.map((track) => (
            <div
              key={track.id}
              className='bg-muted/10 group hover:border-primary/20 relative h-12 border-y border-transparent'
            >
              <div className='bg-background/80 absolute top-0 bottom-0 left-0 z-10 flex w-32 items-center border-r px-3'>
                <span className='text-muted-foreground text-[10px] font-bold tracking-wider uppercase'>
                  {track.type}
                </span>
              </div>

              <div className='relative ml-32 h-full'>
                {track.elements.map((el) => (
                  <TimelineElementItem key={el.id} element={el} zoom={zoom} />
                ))}
              </div>
            </div>
          ))}

          {/* Playhead */}
          <div
            className='bg-primary pointer-events-none absolute top-0 bottom-0 z-30 w-px'
            style={{ left: currentTimeMs / zoom + 128 }} // 128 is the sidebar width
          >
            <div className='bg-primary -mt-1.5 -ml-1.5 h-3 w-3 rounded-full shadow-lg' />
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineElementItem({
  element,
  zoom
}: {
  element: TimelineElement;
  zoom: number;
}) {
  const { selectedElementId, setSelectedElement } = useEditorStore();
  const isSelected = selectedElementId === element.id;

  const left = element.startTimeMs / zoom;
  const width = (element.endTimeMs - element.startTimeMs) / zoom;

  return (
    <motion.div
      layout
      onClick={(e) => {
        e.stopPropagation();
        setSelectedElement(element.id);
      }}
      className={cn(
        'absolute top-1 bottom-1 flex cursor-pointer items-center overflow-hidden rounded-md border px-2 text-[10px] transition-shadow',
        isSelected
          ? 'bg-primary text-primary-foreground border-primary z-10 shadow-lg'
          : 'bg-background border-border hover:border-primary/50'
      )}
      style={{ left, width }}
    >
      <span className='truncate font-medium'>
        {element.type === 'text' ? element.properties.text : element.type}
      </span>

      {/* Resizers */}
      <div className='absolute top-0 bottom-0 left-0 w-1 cursor-ew-resize hover:bg-white/30' />
      <div className='absolute top-0 right-0 bottom-0 w-1 cursor-ew-resize hover:bg-white/30' />
    </motion.div>
  );
}

function formatTime(ms: number) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const remainingMs = Math.floor((ms % 1000) / 10);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}.${remainingMs.toString().padStart(2, '0')}`;
}
