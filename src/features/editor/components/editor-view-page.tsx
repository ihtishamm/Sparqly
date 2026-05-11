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

import { useParams } from 'next/navigation';
import { useEditorApi } from '../api/editor-api';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

import { useOnboardingStore } from '@/store/onboarding-store';

export default function EditorViewPage() {
  const { id } = useParams();
  const { useGetComposition, useSaveComposition, useCreateRenderingJob } =
    useEditorApi();
  const { data: composition, isLoading } = useGetComposition(id as string);
  const saveMutation = useSaveComposition();
  const exportMutation = useCreateRenderingJob();

  const {
    isPlaying,
    togglePlay,
    setComposition,
    tracks,
    durationMs,
    addElement,
    currentTimeMs
  } = useEditorStore();

  const { startTour, completedTours } = useOnboardingStore();

  // Onboarding Tour for Editor
  React.useEffect(() => {
    if (
      !isLoading &&
      composition &&
      !completedTours.includes('editor-overview')
    ) {
      startTour(
        [
          {
            target: '[data-tour="editor-canvas"]',
            title: 'The Production Canvas',
            content:
              'This is where your video comes to life. You can preview your edits, text overlays, and transitions in real-time.',
            placement: 'bottom'
          },
          {
            target: '[data-tour="editor-timeline"]',
            title: 'The Interactive Timeline',
            content:
              'Drag and drop clips to change their timing. You can precisely control when every element appears and disappears.',
            placement: 'top'
          },
          {
            target: '[data-tour="editor-properties"]',
            title: 'Styling & Properties',
            content:
              'Select any element on the timeline to customize its properties like font size, color, and position.',
            placement: 'left'
          },
          {
            target: '[data-tour="editor-save"]',
            title: 'Always Save Your Work',
            content:
              "Don't forget to save your project frequently to sync all your creative changes to the cloud.",
            placement: 'bottom'
          },
          {
            target: '[data-tour="editor-export"]',
            title: 'Produce High-Quality Video',
            content:
              "Once you're happy with your masterpiece, click Export to start the rendering process. This will consume 100 AI credits.",
            placement: 'bottom'
          }
        ],
        'editor-overview'
      );
    }
  }, [isLoading, composition, completedTours, startTour]);

  const handleAddText = () => {
    const textTrack = tracks.find((t) => t.type === 'text');
    if (!textTrack) {
      toast.error('No text track found to add text to.');
      return;
    }

    const newElement = {
      id: `text-${Math.random().toString(36).substring(7)}`,
      type: 'text' as const,
      startTimeMs: currentTimeMs,
      endTimeMs: Math.min(currentTimeMs + 3000, durationMs),
      layer: 10,
      properties: {
        text: 'Double click to edit',
        fontSize: 60,
        position: { x: 50, y: 50 },
        fontColor: '#FFFFFF'
      }
    };

    addElement(textTrack.id, newElement);
    toast.success('Text added to timeline');
  };

  // Hydrate store from backend data
  React.useEffect(() => {
    if (composition) {
      setComposition(
        composition.id,
        composition.durationMs,
        composition.tracks
      );
    }
  }, [composition, setComposition]);

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync({
        id: id as string,
        data: { tracks }
      });
      toast.success('Project saved successfully');
    } catch (error) {
      toast.error('Failed to save project');
    }
  };

  const handleExport = async () => {
    try {
      const job = await exportMutation.mutateAsync(id as string);
      toast.success('Export started!', {
        description: 'You can track the progress in the export dashboard.'
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to start export');
    }
  };

  if (isLoading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='flex flex-col items-center gap-4'>
          <Skeleton className='h-32 w-32 rounded-full' />
          <p className='text-muted-foreground animate-pulse font-medium'>
            Loading your project...
          </p>
        </div>
      </div>
    );
  }

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
              {composition?.name || 'Untitled Project'}
            </h1>
            <p className='text-muted-foreground text-[10px] tracking-widest uppercase'>
              {composition?.width}x{composition?.height} • {composition?.fps}fps
              • {(durationMs / 1000).toFixed(1)}s
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
            onClick={handleSave}
            disabled={saveMutation.isPending}
            data-tour='editor-save'
            className='gap-2 rounded-full px-4'
          >
            {saveMutation.isPending ? (
              <div className='border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent' />
            ) : (
              <IconDeviceFloppy className='h-4 w-4' />
            )}
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
          <Button
            size='sm'
            onClick={handleExport}
            disabled={exportMutation.isPending}
            data-tour='editor-export'
            className='shadow-primary/20 gap-2 rounded-full px-6 shadow-lg'
          >
            {exportMutation.isPending ? (
              <div className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
            ) : (
              <IconShare className='h-4 w-4' />
            )}
            {exportMutation.isPending ? 'Queuing...' : 'Export'}
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
            onClick={handleAddText}
            className='rounded-xl'
            title='Add Text'
          >
            <IconPlus className='h-6 w-6' />
          </Button>
        </aside>

        {/* Center: Canvas & Timeline */}
        <div className='flex min-w-0 flex-1 flex-col'>
          <div data-tour='editor-canvas'>
            <PlayerCanvas />
          </div>
          <div data-tour='editor-timeline'>
            <Timeline />
          </div>
        </div>

        {/* Right: Properties Panel */}
        <div data-tour='editor-properties'>
          <PropertiesPanel />
        </div>
      </main>
    </div>
  );
}
