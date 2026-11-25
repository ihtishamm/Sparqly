'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  CircleAlert,
  Download,
  Film,
  Image as ImageIcon,
  LoaderCircle,
  Maximize2,
  Music,
  Pause,
  Play,
  Plus,
  Redo2,
  SkipBack,
  Type,
  Undo2,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { ErrorState, EmptyState } from '@/components/common/states';
import { StatusBadge } from '@/components/common/status-badge';
import { CreditCost } from '@/components/common/credits-notice';
import { ApiError, errorMessage } from '@/lib/api/errors';
import { isJobActive } from '@/lib/api/hooks/projects';
import {
  useComposition,
  useRenders,
  useSaveTimeline,
  useStartRender
} from '@/lib/api/hooks/editor';
import type { Asset, EditorComposition } from '@/lib/api/types';
import { bytes, relativeTime, timecode } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Inspector } from './inspector';
import {
  addElement,
  docDuration,
  findElement,
  fromComposition,
  mainElement,
  newKey,
  removeElement,
  toSaveBody,
  updateElement,
  useHistory,
  type Doc,
  type El
} from './model';
import { Preview } from './preview';
import { Timeline } from './timeline';

const AUTOSAVE_MS = 1500;

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return (
    !!el &&
    (el.isContentEditable ||
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))
  );
}

function Shortcut({ label, keys }: { label: string; keys: string }) {
  return (
    <span className='flex items-center gap-2'>
      {label}
      <kbd className='text-muted-foreground font-sans text-[11px]'>{keys}</kbd>
    </span>
  );
}

/* ------------------------------- Saving ---------------------------------- */

type SaveState = 'saved' | 'dirty' | 'saving' | 'error';

function useAutosave(compositionId: string, doc: Doc) {
  const save = useSaveTimeline(compositionId);
  const [savedDoc, setSavedDoc] = useState(doc);
  const [state, setState] = useState<SaveState>('saved');
  const [error, setError] = useState<string | null>(null);
  const inflight = useRef<Promise<void> | null>(null);
  const savedDocRef = useRef(doc);
  const latest = useRef(doc);
  latest.current = doc;

  const flush = useCallback(async () => {
    if (inflight.current) await inflight.current;
    const snapshot = latest.current;
    if (snapshot === savedDocRef.current) return;
    setState('saving');
    const run = save
      .mutateAsync(toSaveBody(snapshot))
      .then(() => {
        savedDocRef.current = snapshot;
        setSavedDoc(snapshot);
        setError(null);
        setState(latest.current === snapshot ? 'saved' : 'dirty');
      })
      .catch((e: unknown) => {
        setError(errorMessage(e));
        setState('error');
        throw e;
      })
      .finally(() => {
        inflight.current = null;
      });
    inflight.current = run;
    await run;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [save.mutateAsync]);

  useEffect(() => {
    if (doc === savedDocRef.current) return;
    setState((s) => (s === 'saving' ? s : 'dirty'));
    const id = setTimeout(
      () => void flush().catch(() => undefined),
      AUTOSAVE_MS
    );
    return () => clearTimeout(id);
  }, [doc, flush]);

  const dirty = doc !== savedDoc;
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  return { state, error, flush, dirty };
}

function SaveIndicator({
  state,
  error
}: {
  state: SaveState;
  error: string | null;
}) {
  const map = {
    saved: { icon: Check, text: 'Saved', className: 'text-muted-foreground' },
    dirty: { icon: null, text: 'Unsaved', className: 'text-muted-foreground' },
    saving: {
      icon: LoaderCircle,
      text: 'Saving…',
      className: 'text-muted-foreground'
    },
    error: {
      icon: CircleAlert,
      text: 'Not saved',
      className: 'text-destructive'
    }
  }[state];
  const Icon = map.icon;
  return (
    <span
      className={cn('flex items-center gap-1 text-xs', map.className)}
      title={error ?? undefined}
      aria-live='polite'
    >
      {Icon && (
        <Icon
          className={cn('size-3.5', state === 'saving' && 'animate-spin')}
          aria-hidden
        />
      )}
      {map.text}
    </span>
  );
}

/* ------------------------------- Exports --------------------------------- */

function ExportMenu({
  compositionId,
  beforeExport
}: {
  compositionId: string;
  beforeExport: () => Promise<void>;
}) {
  const renders = useRenders(compositionId);
  const start = useStartRender(compositionId);
  const [preparing, setPreparing] = useState(false);
  const list = renders.data?.data ?? [];
  const running = list.some((r) => isJobActive(r.status));

  async function exportNow() {
    setPreparing(true);
    try {
      await beforeExport();
      await start.mutateAsync();
    } catch {
      // Save and export errors are already shown as toasts.
    } finally {
      setPreparing(false);
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size='sm'>
          {running ? <LoaderCircle className='animate-spin' /> : <Upload />}
          {running ? 'Exporting' : 'Export'}
        </Button>
      </PopoverTrigger>
      <PopoverContent align='end' className='w-80 p-0'>
        <div className='space-y-3 border-b p-3'>
          <div>
            <p className='font-medium'>Export video</p>
            <p className='text-muted-foreground text-xs'>
              Renders a 1080×1920 MP4 with your edits. Scheduled posts use the
              latest export.
            </p>
          </div>
          <div className='flex items-center justify-between'>
            <CreditCost />
            <Button
              size='sm'
              onClick={exportNow}
              loading={preparing}
              disabled={running}
            >
              {running ? 'Export running' : 'Start export'}
            </Button>
          </div>
        </div>
        <div className='max-h-64 overflow-y-auto p-1'>
          {renders.isPending ? (
            <Skeleton className='m-2 h-8' />
          ) : list.length === 0 ? (
            <p className='text-muted-foreground p-3 text-center text-xs'>
              No exports yet.
            </p>
          ) : (
            list.map((r) => (
              <div
                key={r.id}
                className='flex items-center gap-2 rounded-md px-2 py-1.5'
              >
                <div className='min-w-0 flex-1'>
                  <p className='text-xs'>{relativeTime(r.createdAt)}</p>
                  {r.status === 'failed' && r.errorMessage ? (
                    <p
                      className='text-destructive truncate text-[11px]'
                      title={r.errorMessage}
                    >
                      {r.errorMessage}
                    </p>
                  ) : r.sizeBytes ? (
                    <p className='text-muted-foreground text-[11px]'>
                      {bytes(r.sizeBytes)}
                    </p>
                  ) : null}
                </div>
                <StatusBadge status={r.status} />
                {r.status === 'completed' && r.outputUrl && (
                  <Button
                    asChild
                    size='icon-xs'
                    variant='ghost'
                    aria-label='Download export'
                  >
                    <a
                      href={r.outputUrl}
                      target='_blank'
                      rel='noreferrer'
                      download
                    >
                      <Download />
                    </a>
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ------------------------------- Editor ---------------------------------- */

function sourceFor(c: EditorComposition, doc: Doc): string | null {
  const main = mainElement(doc);
  const byId = main?.assetId
    ? c.assets.find((a) => a.id === main.assetId)
    : null;
  const original = c.assets.find((a) => a.type === 'original');
  const anyVideo = c.assets.find((a) => a.mimeType?.startsWith('video/'));
  return (byId ?? original ?? anyVideo)?.fileUrl ?? null;
}

function Editor({ composition }: { composition: EditorComposition }) {
  const router = useRouter();
  const history = useHistory(
    useMemo(() => fromComposition(composition), [composition])
  );
  const { doc } = history;
  const {
    state: saveState,
    error: saveError,
    flush,
    dirty
  } = useAutosave(composition.id, doc);

  const [selected, setSelected] = useState<string | null>(null);
  const [timeMs, setTimeMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [pxPerMs, setPxPerMs] = useState(0.08);
  const [sourceDurationMs, setSourceDurationMs] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timelineBox = useRef<HTMLDivElement>(null);

  const W = composition.resolutionWidth;
  const H = composition.resolutionHeight;
  const durationMs = docDuration(doc);
  const main = mainElement(doc);
  const sourceUrl = sourceFor(composition, doc);
  const selection = findElement(doc, selected);
  const images = composition.assets.filter(
    (a) => a.type === 'image' || a.mimeType?.startsWith('image/')
  );
  const audio = composition.assets.filter(
    (a) => a.type === 'audio' || a.mimeType?.startsWith('audio/')
  );

  /* Playback: the base clip's video drives the clock while playing. */
  const sourceTime = useCallback(
    (t: number) =>
      ((main?.properties.sourceStartMs ?? 0) + t - (main?.startTimeMs ?? 0)) /
      1000,
    [main]
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!playing) {
      video?.pause();
      return;
    }
    let raf = 0;
    const startedAt = performance.now();
    const startMs = timeMs >= durationMs ? 0 : timeMs;
    if (video) {
      video.currentTime = sourceTime(startMs);
      void video.play().catch(() => setPlaying(false));
    }
    const tick = () => {
      const t =
        video && main
          ? video.currentTime * 1000 -
            (main.properties.sourceStartMs ?? 0) +
            main.startTimeMs
          : startMs + (performance.now() - startedAt);
      if (t >= durationMs) {
        setTimeMs(durationMs);
        setPlaying(false);
        return;
      }
      setTimeMs(Math.max(0, t));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // Restart only when play state toggles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  const seek = useCallback(
    (ms: number) => {
      const t = Math.max(0, Math.min(ms, durationMs));
      setTimeMs(t);
      const video = videoRef.current;
      if (video && main) {
        const clipT = Math.min(t, main.endTimeMs - 1);
        video.currentTime = sourceTime(clipT);
      }
    },
    [durationMs, main, sourceTime]
  );

  // Keep the paused frame in step with edits (e.g. trimming the start).
  useEffect(() => {
    if (!playing && videoRef.current && main) {
      videoRef.current.currentTime = sourceTime(
        Math.min(timeMs, main.endTimeMs - 1)
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [main?.properties.sourceStartMs]);

  /* Editing */
  const patchSelected = (patch: (el: El) => El, record = true) => {
    if (!selected) return;
    history.set((d) => updateElement(d, selected, patch), record);
  };

  const deleteSelected = useCallback(() => {
    if (!selected || selected === main?.key) return;
    history.set((d) => removeElement(d, selected));
    setSelected(null);
  }, [history, main?.key, selected]);

  function add(
    el: Omit<El, 'key' | 'startTimeMs' | 'endTimeMs'>,
    lengthMs: number
  ) {
    const start = Math.min(timeMs, Math.max(0, durationMs - 500));
    const key = newKey();
    history.set((d) =>
      addElement(d, {
        ...el,
        key,
        startTimeMs: start,
        endTimeMs: start + lengthMs
      })
    );
    setSelected(key);
  }

  const addText = () =>
    add(
      {
        type: 'text',
        layer: 10,
        assetId: null,
        properties: {
          text: 'Your text',
          fontSize: 80,
          fontColor: '#ffffff',
          position: { x: W / 2, y: H / 2 }
        }
      },
      2000
    );

  const addImage = (asset: Asset) =>
    add(
      {
        type: 'image',
        layer: 5,
        assetId: asset.id,
        properties: {
          position: { x: Math.round(W * 0.1), y: Math.round(H * 0.1) },
          scale: { x: Math.round(W * 0.35), y: -1 }
        }
      },
      3000
    );

  const addAudio = (asset: Asset) =>
    add(
      {
        type: 'audio',
        layer: 0,
        assetId: asset.id,
        properties: { volume: 0.5, sourceStartMs: 0 }
      },
      Math.max(1000, durationMs - timeMs)
    );

  const fit = useCallback(() => {
    const width = (timelineBox.current?.clientWidth ?? 800) - 120;
    setPxPerMs(
      Math.min(0.5, Math.max(0.01, width / Math.max(durationMs, 1000)))
    );
  }, [durationMs]);

  // Fit the clip to the timeline width on first load.
  useEffect(() => {
    fit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Keyboard shortcuts */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void flush().catch(() => undefined);
        return;
      }
      if (isTyping(e.target)) return;
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) history.redo();
        else history.undo();
      } else if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        history.redo();
      } else if (e.key === ' ') {
        e.preventDefault();
        setPlaying((p) => !p);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelected();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const step =
          (e.shiftKey ? 1000 : 100) * (e.key === 'ArrowLeft' ? -1 : 1);
        setPlaying(false);
        seek(timeMs + step);
      } else if (e.key === 'Escape') {
        setSelected(null);
      } else if (e.key === 'Home') {
        seek(0);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [deleteSelected, flush, history, seek, timeMs]);

  async function back() {
    const href = composition.contentId
      ? `/dashboard/projects/${composition.contentId}`
      : '/dashboard/projects';
    if (dirty) {
      try {
        await flush();
      } catch {
        return; // Stay so the user doesn't lose edits; the error is shown.
      }
    }
    router.push(href);
  }

  const mainMissing = !main;

  return (
    <div className='bg-canvas flex h-full min-h-[600px] flex-col'>
      {/* Top bar */}
      <header className='bg-background flex h-12 shrink-0 items-center gap-2 border-b px-3'>
        <Button
          variant='ghost'
          size='icon-sm'
          aria-label='Back to project'
          onClick={back}
        >
          <ArrowLeft />
        </Button>
        <div className='min-w-0 flex-1'>
          <p className='truncate text-[13px] font-medium'>
            {composition.title}
          </p>
        </div>
        <SaveIndicator state={saveState} error={saveError} />
        <div className='mx-1 flex items-center'>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='icon-sm'
                aria-label='Undo'
                disabled={!history.canUndo}
                onClick={history.undo}
              >
                <Undo2 />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <Shortcut label='Undo' keys='⌘Z' />
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='icon-sm'
                aria-label='Redo'
                disabled={!history.canRedo}
                onClick={history.redo}
              >
                <Redo2 />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <Shortcut label='Redo' keys='⇧⌘Z' />
            </TooltipContent>
          </Tooltip>
        </div>
        <ExportMenu compositionId={composition.id} beforeExport={flush} />
      </header>

      {saveState === 'error' && saveError && (
        <div
          role='alert'
          className='bg-destructive/10 text-destructive flex items-center gap-2 border-b px-4 py-1.5 text-xs'
        >
          <CircleAlert className='size-3.5' aria-hidden /> {saveError}
          <Button
            size='xs'
            variant='outline'
            className='ml-auto'
            onClick={() => void flush().catch(() => undefined)}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Stage + inspector */}
      <div className='flex min-h-0 flex-1'>
        <div className='flex min-w-0 flex-1 items-center justify-center p-4 md:p-6'>
          {mainMissing ? (
            <EmptyState
              icon={Film}
              title='This clip has no video'
              description='The timeline needs a video to export.'
            />
          ) : (
            <Preview
              doc={doc}
              assets={composition.assets}
              width={W}
              height={H}
              background={composition.backgroundColor}
              timeMs={timeMs}
              selected={selected}
              sourceUrl={sourceUrl}
              videoRef={videoRef}
              onSelect={setSelected}
              onDragStart={history.begin}
              onMove={(key, position) =>
                history.set(
                  (d) =>
                    updateElement(d, key, (x) => ({
                      ...x,
                      properties: { ...x.properties, position }
                    })),
                  false
                )
              }
              onDragEnd={history.end}
              onLoadedDuration={(ms) =>
                Number.isFinite(ms) && setSourceDurationMs(ms)
              }
            />
          )}
        </div>
        <aside
          className='bg-background scrollbar-thin hidden w-72 shrink-0 overflow-y-auto border-l lg:block'
          aria-label='Inspector'
        >
          <Inspector
            el={selection?.el ?? null}
            isMain={selection?.el.key === main?.key}
            width={W}
            height={H}
            onChange={(p) => patchSelected(p)}
            onBegin={history.begin}
            onPreview={(p) => patchSelected(p, false)}
            onEnd={history.end}
            onDelete={deleteSelected}
          />
        </aside>
      </div>

      {/* Transport */}
      <div className='bg-background flex h-11 shrink-0 items-center gap-2 border-t px-3'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' size='sm'>
              <Plus /> Add
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='start' className='w-56'>
            <DropdownMenuItem onSelect={addText}>
              <Type /> Text
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className='text-muted-foreground text-xs font-normal'>
              Images
            </DropdownMenuLabel>
            {images.length ? (
              images.map((a) => (
                <DropdownMenuItem key={a.id} onSelect={() => addImage(a)}>
                  <ImageIcon />{' '}
                  <span className='truncate'>
                    {a.metadata?.title || 'Image'}
                  </span>
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled>
                No images in this project
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuLabel className='text-muted-foreground text-xs font-normal'>
              Audio
            </DropdownMenuLabel>
            {audio.length ? (
              audio.map((a) => (
                <DropdownMenuItem key={a.id} onSelect={() => addAudio(a)}>
                  <Music />{' '}
                  <span className='truncate'>
                    {a.metadata?.title || 'Audio'}
                  </span>
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled>
                No audio in this project
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className='mx-auto flex items-center gap-1'>
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label='Go to start'
            onClick={() => seek(0)}
          >
            <SkipBack />
          </Button>
          <Button
            variant='secondary'
            size='icon-sm'
            aria-label={playing ? 'Pause' : 'Play'}
            onClick={() => setPlaying((p) => !p)}
            disabled={mainMissing}
          >
            {playing ? <Pause /> : <Play />}
          </Button>
          <span className='tnum text-muted-foreground ml-2 text-xs'>
            <span className='text-foreground'>{timecode(timeMs)}</span> /{' '}
            {timecode(durationMs)}
          </span>
        </div>

        <div className='flex w-48 items-center gap-2'>
          <Slider
            aria-label='Zoom'
            min={0.01}
            max={0.5}
            step={0.005}
            value={[pxPerMs]}
            onValueChange={([v]) => setPxPerMs(v)}
          />
          <Button
            variant='ghost'
            size='icon-xs'
            aria-label='Fit timeline'
            onClick={fit}
          >
            <Maximize2 />
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <div
        ref={timelineBox}
        className='bg-background flex h-[30vh] min-h-44 shrink-0 flex-col border-t'
      >
        <Timeline
          doc={doc}
          timeMs={timeMs}
          durationMs={durationMs}
          pxPerMs={pxPerMs}
          selected={selected}
          sourceDurationMs={sourceDurationMs}
          onSeek={(ms) => {
            setPlaying(false);
            seek(ms);
          }}
          onSelect={setSelected}
          onBegin={history.begin}
          onChange={(d) => history.set(d, false)}
          onEnd={history.end}
        />
      </div>
    </div>
  );
}

export function EditorPage({ id }: { id: string }) {
  const composition = useComposition(id);

  if (composition.isPending) {
    return (
      <div className='flex h-full flex-col' aria-busy='true'>
        <div className='h-12 border-b' />
        <div className='flex flex-1 items-center justify-center'>
          <Skeleton className='aspect-[9/16] h-[60%] rounded-lg' />
        </div>
        <Skeleton className='h-[30vh] rounded-none' />
      </div>
    );
  }

  if (composition.isError) {
    const missing =
      composition.error instanceof ApiError &&
      [403, 404, 422].includes(composition.error.status);
    return (
      <div className='flex h-full items-center justify-center p-6'>
        {missing ? (
          <EmptyState
            icon={Film}
            title='Clip not found'
            description='It may have been deleted, or it belongs to another account.'
            action={
              <Button asChild variant='outline'>
                <Link href='/dashboard/projects'>Back to projects</Link>
              </Button>
            }
          />
        ) : (
          <ErrorState
            error={composition.error}
            onRetry={() => composition.refetch()}
          />
        )}
      </div>
    );
  }

  return <Editor composition={composition.data} />;
}
