'use client';

import * as React from 'react';
import { PlayerCanvas } from './player-canvas';
import { Timeline } from './timeline';
import { PropertiesPanel } from './properties-panel';
import { useEditorStore } from '../store/editor-store';
import { Button } from '@/components/ui/button';
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconDeviceFloppy,
  IconShare,
  IconPlus,
  IconArrowLeft
} from '@tabler/icons-react';
import Link from 'next/link';

export default function EditorViewPage() {
  const { isPlaying, togglePlay, setComposition, tracks } = useEditorStore();

  // Mock initial composition for demo
  React.useEffect(() => {
    setComposition('demo-comp', 30000, [
      {
        id: 'video-track',
        type: 'video',
        order: 0,
        elements: [
          {
            id: 'main-video',
            type: 'video',
            startTimeMs: 0,
            endTimeMs: 30000,
            layer: 0,
            properties: {
              url: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
              sourceStartMs: 0,
              sourceEndMs: 30000
            }
          }
        ]
      },
      {
        id: 'text-track',
        type: 'text',
        order: 1,
        elements: [
          {
            id: 'caption-1',
            type: 'text',
            startTimeMs: 1000,
            endTimeMs: 5000,
            layer: 10,
            properties: {
              text: 'Welcome to the Future of Content',
              fontSize: 80,
              position: { x: 50, y: 80 }
            }
          },
          {
            id: 'caption-2',
            type: 'text',
            startTimeMs: 6000,
            endTimeMs: 12000,
            layer: 10,
            properties: {
              text: 'Automate your Social Media presence',
              fontSize: 60,
              position: { x: 50, y: 80 }
            }
          }
        ]
      }
    ]);
  }, []);

  return (
    <div className='bg-background flex h-screen flex-col overflow-hidden'>
      {/* Editor Header */}
      <header className='bg-background/80 z-50 flex h-14 items-center justify-between border-b px-6 backdrop-blur-md'>
        <div className='flex items-center gap-4'>
          <Link href='/dashboard/content'>
            <Button variant='ghost' size='icon' className='rounded-full'>
              <IconArrowLeft className='h-5 w-5' />
            </Button>
          </Link>
          <div>
            <h1 className='text-sm font-bold tracking-tight'>
              AI Generated Short #1
            </h1>
            <p className='text-muted-foreground text-[10px] tracking-widest uppercase'>
              Draft • 1080x1920 • 30fps
            </p>
          </div>
        </div>

        <div className='absolute left-1/2 flex -translate-x-1/2 items-center gap-4'>
          <Button
            variant='secondary'
            size='icon'
            onClick={togglePlay}
            className='border-primary/10 h-10 w-10 rounded-full shadow-lg'
          >
            {isPlaying ? (
              <IconPlayerPause className='h-5 w-5 fill-current' />
            ) : (
              <IconPlayerPlay className='ml-0.5 h-5 w-5 fill-current' />
            )}
          </Button>
        </div>

        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            className='gap-2 rounded-full px-4'
          >
            <IconDeviceFloppy className='h-4 w-4' /> Save
          </Button>
          <Button
            size='sm'
            className='shadow-primary/20 gap-2 rounded-full px-6 shadow-lg'
          >
            <IconShare className='h-4 w-4' /> Export
          </Button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className='flex min-h-0 flex-1'>
        {/* Left Toolbar */}
        <aside className='bg-muted/5 flex w-16 flex-col items-center gap-6 border-r py-6'>
          <Button
            variant='ghost'
            size='icon'
            className='rounded-xl'
            title='Add Text'
          >
            <IconPlus className='h-6 w-6' />
          </Button>
        </aside>

        {/* Center: Canvas & Timeline */}
        <div className='flex min-w-0 flex-1 flex-col'>
          <PlayerCanvas />
          <Timeline />
        </div>

        {/* Right: Properties */}
        <PropertiesPanel />
      </main>
    </div>
  );
}
