'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  CalendarPlus,
  Check,
  ChevronRight,
  CircleAlert,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Film,
  FolderOpen,
  MoreHorizontal,
  Pencil,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { PageBody, PageHeader } from '@/components/common/page-header';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { EmptyState, ErrorState } from '@/components/common/states';
import { StatusBadge, STAGE_LABELS } from '@/components/common/status-badge';
import { ApiError } from '@/lib/api/errors';
import {
  isJobActive,
  useDeleteProject,
  useProject,
  useSaveDocument
} from '@/lib/api/hooks/projects';
import type {
  ProjectClip,
  ProjectDetail,
  ProjectDocument,
  ProjectJob
} from '@/lib/api/types';
import {
  bytes,
  dateTime,
  duration,
  hostname,
  pluralize,
  relativeTime
} from '@/lib/format';
import { cn } from '@/lib/utils';
import {
  ScheduleDialog,
  type ScheduleTarget
} from '@/features/publishing/schedule-dialog';
import { projectTitle } from './project-card';

const DOC_LABELS: Record<string, string> = {
  'blog-post': 'Blog post',
  'linkedin-post': 'LinkedIn post',
  'twitter-thread': 'Thread',
  script: 'Script',
  summary: 'Summary',
  transcript: 'Transcript'
};
/** Documents that make sense as a social post. */
const POSTABLE = new Set([
  'linkedin-post',
  'twitter-thread',
  'blog-post',
  'summary'
]);

const PIPELINE = [
  'downloading',
  'transcribing',
  'detecting',
  'cutting',
  'writing'
] as const;

/* -------------------------------- Progress ------------------------------- */

function Progress({ job }: { job: ProjectJob }) {
  if (job.status === 'failed') {
    return (
      <div
        role='alert'
        className='border-destructive/30 bg-destructive/5 flex items-start gap-3 rounded-xl border p-4'
      >
        <CircleAlert
          className='text-destructive mt-0.5 size-4 shrink-0'
          aria-hidden
        />
        <div className='space-y-1'>
          <p className='font-medium'>This run failed</p>
          <p className='text-muted-foreground text-[13px]'>
            {job.errorMessage || 'Something went wrong while processing.'} Your
            credit was refunded.
          </p>
        </div>
      </div>
    );
  }
  if (!isJobActive(job.status)) return null;

  const isPipeline = job.jobType === 'repurpose';
  const current = job.stage
    ? PIPELINE.indexOf(job.stage as (typeof PIPELINE)[number])
    : -1;

  return (
    <div className='bg-card space-y-4 rounded-xl border p-4' aria-live='polite'>
      <div className='flex items-center justify-between gap-3'>
        <div>
          <p className='font-medium'>
            {job.status === 'pending'
              ? 'Waiting to start'
              : (STAGE_LABELS[job.stage ?? ''] ?? 'Working')}
            …
          </p>
          <p className='text-muted-foreground text-[13px]'>
            Usually a few minutes. You can leave this page — we’ll keep going.
          </p>
        </div>
        <StatusBadge status={job.status} />
      </div>
      {isPipeline && (
        <ol className='grid grid-cols-5 gap-1.5'>
          {PIPELINE.map((stage, i) => {
            const done = i < current;
            const active = i === current;
            return (
              <li key={stage} className='space-y-1.5'>
                <div
                  className={cn(
                    'h-1 rounded-full',
                    done
                      ? 'bg-primary'
                      : active
                        ? 'bg-primary/60 animate-pulse'
                        : 'bg-secondary'
                  )}
                />
                <p
                  className={cn(
                    'truncate text-[11px]',
                    done || active
                      ? 'text-foreground'
                      : 'text-subtle-foreground'
                  )}
                >
                  {STAGE_LABELS[stage]}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

/* ---------------------------------- Clips -------------------------------- */

function ClipCard({
  clip,
  onSchedule
}: {
  clip: ProjectClip;
  onSchedule: () => void;
}) {
  const rendered =
    clip.render?.status === 'completed' ? clip.render.outputUrl : null;
  const src = rendered ?? clip.clipUrl;
  const rendering = isJobActive(clip.render?.status);
  return (
    <div className='bg-card flex flex-col overflow-hidden rounded-xl border'>
      <div className='bg-canvas relative flex aspect-[9/16] max-h-[420px] items-center justify-center'>
        {src ? (
          <video
            src={src}
            controls
            preload='metadata'
            playsInline
            className='size-full object-contain'
          />
        ) : (
          <Film className='text-subtle-foreground size-6' aria-hidden />
        )}
        {(rendering || clip.render?.status === 'failed') && (
          <div className='absolute top-2 left-2'>
            <StatusBadge
              status={clip.render!.status}
              label={rendering ? 'Exporting' : 'Export failed'}
            />
          </div>
        )}
      </div>
      <div className='flex flex-1 flex-col gap-3 p-3'>
        <div className='min-w-0'>
          <p className='line-clamp-2 text-[13px] font-medium'>
            {clip.title || 'Untitled clip'}
          </p>
          <p className='text-muted-foreground text-xs'>
            {duration(clip.durationMs)}
            {rendered ? ' · Edited version' : ''}
          </p>
        </div>
        <div className='mt-auto flex items-center gap-1.5'>
          {clip.compositionId ? (
            <Button asChild size='sm' variant='outline' className='flex-1'>
              <Link href={`/dashboard/editor/${clip.compositionId}`}>
                <Pencil /> Edit
              </Link>
            </Button>
          ) : null}
          <Button
            size='sm'
            className='flex-1'
            onClick={onSchedule}
            disabled={!clip.versionId}
          >
            <CalendarPlus /> Schedule
          </Button>
          {src && (
            <Button
              asChild
              size='icon-sm'
              variant='ghost'
              aria-label='Download clip'
            >
              <a href={src} download target='_blank' rel='noreferrer'>
                <Download />
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- Documents ------------------------------ */

function DocumentEditor({
  projectId,
  doc,
  onSchedule
}: {
  projectId: string;
  doc: ProjectDocument;
  onSchedule?: () => void;
}) {
  const save = useSaveDocument(projectId);
  const [draft, setDraft] = useState(doc.text);
  const [copied, setCopied] = useState(false);
  const dirty = draft !== doc.text;

  // Pick up a newer server version unless the user is mid-edit.
  useEffect(() => {
    if (!dirty) setDraft(doc.text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.text]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  async function onSave() {
    try {
      await save.mutateAsync({ variantId: doc.variantId, text: draft });
      toast.success('Saved', { description: 'A new version was created.' });
    } catch {
      // The mutation's error toast has already explained what went wrong.
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const words = draft.trim() ? draft.trim().split(/\s+/).length : 0;

  return (
    <article className='bg-card overflow-hidden rounded-xl border'>
      <header className='flex flex-wrap items-center gap-2 border-b px-4 py-2.5'>
        <div className='min-w-0 flex-1'>
          <p className='truncate text-[13px] font-medium'>
            {DOC_LABELS[doc.type] ?? doc.type}
            {doc.title && doc.title !== DOC_LABELS[doc.type] && (
              <span className='text-muted-foreground font-normal'>
                {' '}
                · {doc.title}
              </span>
            )}
          </p>
          <p className='text-muted-foreground text-xs'>
            {pluralize(words, 'word')}
            {doc.versionNumber ? ` · v${doc.versionNumber}` : ''} · Updated{' '}
            {relativeTime(doc.updatedAt)}
            {dirty && <span className='text-warning'> · Unsaved changes</span>}
          </p>
        </div>
        <Button size='sm' variant='ghost' onClick={copy}>
          {copied ? <Check /> : <Copy />} {copied ? 'Copied' : 'Copy'}
        </Button>
        {onSchedule && (
          <Button
            size='sm'
            variant='outline'
            onClick={onSchedule}
            disabled={dirty || !doc.versionId}
          >
            <CalendarPlus /> Schedule
          </Button>
        )}
        {doc.editable && dirty && (
          <>
            <Button
              size='sm'
              variant='ghost'
              onClick={() => setDraft(doc.text)}
              disabled={save.isPending}
            >
              Revert
            </Button>
            <Button size='sm' onClick={onSave} loading={save.isPending}>
              Save
            </Button>
          </>
        )}
      </header>
      {doc.editable ? (
        <Textarea
          aria-label={`${DOC_LABELS[doc.type] ?? 'Document'} text`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              if (dirty) void onSave();
            }
          }}
          className='min-h-[240px] resize-y rounded-none border-0 bg-transparent px-4 py-3 text-[14px] leading-6 shadow-none focus-visible:ring-0 dark:bg-transparent'
        />
      ) : (
        <div className='scrollbar-thin max-h-[60vh] overflow-y-auto px-4 py-3 text-[14px] leading-6 whitespace-pre-wrap'>
          {doc.text || <span className='text-muted-foreground'>Empty</span>}
        </div>
      )}
    </article>
  );
}

/* ---------------------------------- Page --------------------------------- */

const TABS = ['clips', 'posts', 'transcript', 'files', 'history'] as const;
type Tab = (typeof TABS)[number];

function useTab(fallback: Tab): [Tab, (tab: string) => void] {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const raw = params.get('tab');
  const tab = TABS.includes(raw as Tab) ? (raw as Tab) : fallback;
  return [
    tab,
    (next) => {
      const sp = new URLSearchParams(params);
      sp.set('tab', next);
      router.replace(`${pathname}?${sp}`, { scroll: false });
    }
  ];
}

function DetailSkeleton() {
  return (
    <PageBody wide aria-busy='true'>
      <div className='space-y-2'>
        <Skeleton className='h-3 w-24' />
        <Skeleton className='h-6 w-80' />
      </div>
      <Skeleton className='h-8 w-96' />
      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton
            key={i}
            className='aspect-[9/16] max-h-[420px] rounded-xl'
          />
        ))}
      </div>
    </PageBody>
  );
}

export function ProjectDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const project = useProject(id);
  const remove = useDeleteProject();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [scheduling, setScheduling] = useState<ScheduleTarget | null>(null);

  const data = project.data;
  const posts = data?.documents.filter((d) => d.type !== 'transcript') ?? [];
  const transcript = data?.documents.find((d) => d.type === 'transcript');
  const fallback: Tab =
    data && !data.clips.length && posts.length ? 'posts' : 'clips';
  const [tab, setTab] = useTab(fallback);

  if (project.isPending) return <DetailSkeleton />;
  if (project.isError) {
    const notFound =
      project.error instanceof ApiError &&
      [403, 404, 422].includes(project.error.status);
    return (
      <PageBody>
        {notFound ? (
          <EmptyState
            icon={FolderOpen}
            title='Project not found'
            description='It may have been deleted, or it belongs to another account.'
            action={
              <Button asChild variant='outline'>
                <Link href='/dashboard/projects'>Back to projects</Link>
              </Button>
            }
          />
        ) : (
          <ErrorState error={project.error} onRetry={() => project.refetch()} />
        )}
      </PageBody>
    );
  }

  const p = data as ProjectDetail;
  const title = projectTitle(p);
  const running = isJobActive(p.latestJob?.status);

  function scheduleClip(clip: ProjectClip) {
    setScheduling({
      contentId: p.id,
      variantId: clip.variantId,
      versionId: clip.versionId!,
      title: clip.title || title,
      kind: 'video'
    });
  }

  function scheduleDoc(doc: ProjectDocument) {
    setScheduling({
      contentId: p.id,
      variantId: doc.variantId,
      versionId: doc.versionId!,
      title: doc.title || DOC_LABELS[doc.type] || title,
      kind: 'text',
      text: doc.text
    });
  }

  return (
    <PageBody wide>
      <PageHeader
        eyebrow={
          <>
            <Link href='/dashboard/projects' className='hover:text-foreground'>
              Projects
            </Link>
            <ChevronRight className='size-3' aria-hidden />
            <span className='truncate'>{title}</span>
          </>
        }
        title={title}
        description={
          <span className='flex flex-wrap items-center gap-x-3 gap-y-1'>
            <span>Created {dateTime(p.createdAt)}</span>
            {p.sourceUrl && (
              <a
                href={p.sourceUrl}
                target='_blank'
                rel='noreferrer'
                className='hover:text-foreground inline-flex items-center gap-1'
              >
                {hostname(p.sourceUrl)}{' '}
                <ExternalLink className='size-3' aria-hidden />
              </a>
            )}
            {p.scheduledCount > 0 && (
              <Link
                href='/dashboard/calendar'
                className='hover:text-foreground'
              >
                {pluralize(p.scheduledCount, 'scheduled post')}
              </Link>
            )}
          </span>
        }
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='outline'
                size='icon'
                aria-label='Project actions'
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              {p.sourceUrl && (
                <DropdownMenuItem asChild>
                  <a href={p.sourceUrl} target='_blank' rel='noreferrer'>
                    <ExternalLink /> Open source video
                  </a>
                </DropdownMenuItem>
              )}
              {p.sourceUrl && <DropdownMenuSeparator />}
              <DropdownMenuItem
                variant='destructive'
                disabled={running}
                onSelect={() => setConfirmDelete(true)}
              >
                <Trash2 /> Delete project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      {p.latestJob && <Progress job={p.latestJob} />}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value='clips'>
            Clips <Counter n={p.clips.length} />
          </TabsTrigger>
          <TabsTrigger value='posts'>
            Posts <Counter n={posts.length} />
          </TabsTrigger>
          <TabsTrigger value='transcript' disabled={!transcript}>
            Transcript
          </TabsTrigger>
          <TabsTrigger value='files'>
            Files <Counter n={p.assets.length} />
          </TabsTrigger>
          <TabsTrigger value='history'>History</TabsTrigger>
        </TabsList>

        <TabsContent value='clips' className='pt-5'>
          {p.clips.length === 0 ? (
            <EmptyState
              icon={Film}
              title={running ? 'Clips are on the way' : 'No clips'}
              description={
                running
                  ? 'They appear here as soon as they’re cut.'
                  : 'This project has no video clips. Start a new run with “Short clips” selected.'
              }
            />
          ) : (
            <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
              {p.clips.map((clip) => (
                <ClipCard
                  key={clip.variantId}
                  clip={clip}
                  onSchedule={() => scheduleClip(clip)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value='posts' className='space-y-4 pt-5'>
          {posts.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={running ? 'Posts are being written' : 'No posts'}
              description={
                running ? 'They appear here when the run finishes.' : undefined
              }
            />
          ) : (
            <div className='mx-auto max-w-3xl space-y-4'>
              {posts.map((doc) => (
                <DocumentEditor
                  key={doc.variantId}
                  projectId={p.id}
                  doc={doc}
                  onSchedule={
                    POSTABLE.has(doc.type) ? () => scheduleDoc(doc) : undefined
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value='transcript' className='pt-5'>
          {transcript && (
            <div className='mx-auto max-w-3xl'>
              <DocumentEditor projectId={p.id} doc={transcript} />
            </div>
          )}
        </TabsContent>

        <TabsContent value='files' className='pt-5'>
          {p.assets.length === 0 ? (
            <EmptyState icon={FolderOpen} title='No files' />
          ) : (
            <ul className='divide-y rounded-xl border'>
              {p.assets.map((asset) => (
                <li
                  key={asset.id}
                  className='flex items-center gap-3 px-4 py-2.5'
                >
                  <span className='bg-secondary text-muted-foreground rounded-md px-1.5 py-0.5 font-mono text-[11px] uppercase'>
                    {asset.type}
                  </span>
                  <span className='min-w-0 flex-1 truncate text-[13px]'>
                    {asset.metadata?.title ||
                      asset.metadata?.originalName ||
                      decodeURIComponent(
                        asset.fileUrl.split('/').pop()?.split('?')[0] ?? 'file'
                      )}
                  </span>
                  <span className='text-muted-foreground tnum text-xs'>
                    {bytes(asset.sizeBytes)}
                  </span>
                  <Button
                    asChild
                    size='icon-sm'
                    variant='ghost'
                    aria-label='Open file'
                  >
                    <a href={asset.fileUrl} target='_blank' rel='noreferrer'>
                      <ExternalLink />
                    </a>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value='history' className='pt-5'>
          {p.jobs.length === 0 ? (
            <EmptyState icon={FileText} title='No runs yet' />
          ) : (
            <ul className='divide-y rounded-xl border'>
              {p.jobs.map((job) => (
                <li
                  key={job.id}
                  className='flex items-center gap-3 px-4 py-2.5'
                >
                  <div className='min-w-0 flex-1'>
                    <p className='text-[13px] font-medium capitalize'>
                      {job.jobType.replace(/[_-]/g, ' ')}
                    </p>
                    <p className='text-muted-foreground truncate text-xs'>
                      {dateTime(job.createdAt)}
                      {job.errorMessage ? ` · ${job.errorMessage}` : ''}
                    </p>
                  </div>
                  <StatusBadge status={job.status} />
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>

      <ScheduleDialog
        target={scheduling}
        onOpenChange={(open) => !open && setScheduling(null)}
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        destructive
        title='Delete this project?'
        description='Its clips, posts and files are deleted. Its scheduled posts are cancelled. This can’t be undone.'
        confirmLabel='Delete project'
        onConfirm={async () => {
          await remove.mutateAsync(p.id);
          toast.success('Project deleted');
          router.replace('/dashboard/projects');
        }}
      />
    </PageBody>
  );
}

function Counter({ n }: { n: number }) {
  if (!n) return null;
  return <span className='text-muted-foreground tnum ml-1 text-xs'>{n}</span>;
}
