'use client';

import * as React from 'react';
import { useEditorStore } from '../store/editor-store';
import { cn } from '@/lib/utils';

export function PlayerCanvas() {
  const { tracks, currentTimeMs, isPlaying, durationMs, setCurrentTime } =
    useEditorStore();
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Sync video time with editor time
  React.useEffect(() => {
    if (
      videoRef.current &&
      Math.abs(videoRef.current.currentTime * 1000 - currentTimeMs) > 100
    ) {
      videoRef.current.currentTime = currentTimeMs / 1000;
    }
  }, [currentTimeMs]);

  // Handle video playback
  React.useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Update editor time when video plays
  const onTimeUpdate = () => {
    if (videoRef.current && isPlaying) {
      setCurrentTime(videoRef.current.currentTime * 1000);
    }
  };

  // Find active elements for current time
  const activeElements = tracks
    .flatMap((track) =>
      track.elements.filter(
        (el) => currentTimeMs >= el.startTimeMs && currentTimeMs <= el.endTimeMs
      )
    )
    .sort((a, b) => a.layer - b.layer);

  const mainVideo = tracks.find((t) => t.type === 'video')?.elements[0];

  return (
    <div className='relative flex flex-1 items-center justify-center overflow-hidden bg-stone-950 p-8'>
      <div
        ref={containerRef}
        className='relative overflow-hidden bg-black shadow-2xl'
        style={{
          aspectRatio: '9/16',
          height: '100%',
          maxHeight: 'calc(100vh - 400px)'
        }}
      >
        {/* Main Video Layer */}
        {mainVideo && (
          <video
            ref={videoRef}
            src={mainVideo.properties.url}
            onTimeUpdate={onTimeUpdate}
            className='h-full w-full object-cover'
            muted
            playsInline
          />
        )}

        {/* Overlay Elements */}
        {activeElements
          .filter((el) => el.type !== 'video')
          .map((el) => (
            <div
              key={el.id}
              className='pointer-events-none absolute'
              style={{
                left: `${el.properties.position?.x || 50}%`,
                top: `${el.properties.position?.y || 50}%`,
                transform: 'translate(-50%, -50%)',
                color: el.properties.fontColor || '#FFFFFF',
                fontSize: `${(el.properties.fontSize || 40) / 10}%`,
                fontWeight: 'bold',
                textAlign: 'center',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                width: '80%'
              }}
            >
              {el.type === 'text' && (
                <span className='rounded bg-black/20 px-4 py-1 backdrop-blur-sm'>
                  {el.properties.text}
                </span>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
