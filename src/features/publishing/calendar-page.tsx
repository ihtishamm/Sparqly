'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  parse,
  startOfMonth,
  startOfWeek
} from 'date-fns';
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { PageBody, PageHeader } from '@/components/common/page-header';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { ErrorState } from '@/components/common/states';
import { PlatformMark } from '@/components/common/platform-mark';
import { StatusBadge } from '@/components/common/status-badge';
import {
  useDeletePost,
  usePostAction,
  usePostsInRange,
  useReschedulePost
} from '@/lib/api/hooks/publishing';
import type { ScheduledPost } from '@/lib/api/types';
import { dateTime } from '@/lib/format';
import { platformMeta } from '@/lib/platforms';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const STATUS_DOT: Record<string, string> = {
  scheduled: 'bg-info',
  processing: 'bg-primary',
  published: 'bg-success',
  failed: 'bg-destructive',
  cancelled: 'bg-subtle-foreground'
};

function postTitle(post: ScheduledPost) {
  return (
    post.metadata?.title ||
    post.contentVariant?.title ||
    post.content?.title ||
    post.contentVariant?.content?.title ||
    post.metadata?.caption ||
    'Untitled post'
  );
}

/** Month in the URL (`?month=2026-11`) so refresh and back keep the view. */
function useMonth(): [Date, (d: Date) => void] {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const raw = params.get('month');
  const parsed = raw ? parse(raw, 'yyyy-MM', new Date()) : null;
  const month =
    parsed && !Number.isNaN(parsed.getTime())
      ? parsed
      : startOfMonth(new Date());
  return [
    month,
    (d) =>
      router.replace(`${pathname}?month=${format(d, 'yyyy-MM')}`, {
        scroll: false
      })
  ];
}

function PostChip({
  post,
  onOpen
}: {
  post: ScheduledPost;
  onOpen: () => void;
}) {
  return (
    <button
      type='button'
      onClick={onOpen}
      className={cn(
        'hover:bg-accent flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-left text-[11px]',
        post.status === 'cancelled' && 'text-subtle-foreground line-through'
      )}
    >
      <span
        className={cn(
          'size-1.5 shrink-0 rounded-full',
          STATUS_DOT[post.status]
        )}
        aria-hidden
      />
      <span className='text-muted-foreground tnum shrink-0'>
        {format(new Date(post.scheduledAt), 'h:mma').toLowerCase()}
      </span>
      <span className='truncate'>{postTitle(post)}</span>
    </button>
  );
}

function PostSheet({
  post,
  onClose
}: {
  post: ScheduledPost | null;
  onClose: () => void;
}) {
  const action = usePostAction();
  const reschedule = useReschedulePost();
  const remove = useDeletePost();
  const [when, setWhen] = useState('');
  const [confirm, setConfirm] = useState<'cancel' | 'delete' | null>(null);

  const editable =
    post && (post.status === 'scheduled' || post.status === 'failed');
  const contentId = post?.content?.id ?? post?.contentVariant?.content?.id;

  async function run(kind: 'publish-now' | 'retry' | 'cancel') {
    if (!post) return;
    await action.mutateAsync({ id: post.id, action: kind });
    toast.success(
      kind === 'cancel'
        ? 'Post cancelled'
        : kind === 'retry'
          ? 'Retrying'
          : 'Publishing now'
    );
    if (kind === 'cancel') onClose();
  }

  return (
    <Sheet open={!!post} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className='w-full gap-0 sm:max-w-md'>
        {post && (
          <>
            <SheetHeader className='border-b'>
              <div className='flex items-center gap-2'>
                <PlatformMark
                  platform={post.platformAccount.platform}
                  size='sm'
                />
                <span className='text-muted-foreground text-xs'>
                  {post.platformAccount.accountName ||
                    platformMeta(post.platformAccount.platform).label}
                </span>
                <span className='mr-6 ml-auto'>
                  <StatusBadge status={post.status} />
                </span>
              </div>
              <SheetTitle className='line-clamp-2'>
                {postTitle(post)}
              </SheetTitle>
              <SheetDescription>{dateTime(post.scheduledAt)}</SheetDescription>
            </SheetHeader>

            <div className='flex-1 space-y-5 overflow-y-auto p-4'>
              {post.status === 'failed' && post.metadata?.lastError && (
                <div
                  role='alert'
                  className='border-destructive/30 bg-destructive/5 rounded-lg border px-3 py-2 text-[13px]'
                >
                  <p className='text-destructive font-medium'>
                    Publishing failed
                  </p>
                  <p className='text-muted-foreground'>
                    {post.metadata.lastError}
                  </p>
                </div>
              )}
              {post.status === 'published' && post.metadata?.postUrl && (
                <Button asChild variant='outline' className='w-full'>
                  <a
                    href={post.metadata.postUrl}
                    target='_blank'
                    rel='noreferrer'
                  >
                    View on {platformMeta(post.platformAccount.platform).label}{' '}
                    <ExternalLink />
                  </a>
                </Button>
              )}
              {post.metadata?.caption && (
                <div className='space-y-1'>
                  <p className='text-muted-foreground text-xs'>Caption</p>
                  <p className='text-[13px] whitespace-pre-wrap'>
                    {post.metadata.caption}
                  </p>
                </div>
              )}
              {!!post.metadata?.hashtags?.length && (
                <p className='text-info text-[13px]'>
                  {post.metadata.hashtags.map((t) => `#${t}`).join(' ')}
                </p>
              )}
              {contentId && (
                <Link
                  href={`/dashboard/projects/${contentId}`}
                  className='text-muted-foreground hover:text-foreground block text-[13px] underline-offset-4 hover:underline'
                >
                  Open project
                </Link>
              )}

              {editable && (
                <form
                  className='space-y-2 border-t pt-5'
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const date = new Date(when);
                    if (!when || Number.isNaN(date.getTime())) return;
                    try {
                      await reschedule.mutateAsync({
                        id: post.id,
                        scheduledAt: date
                      });
                      toast.success('Rescheduled', {
                        description: dateTime(date)
                      });
                      setWhen('');
                    } catch {
                      // Shown by the mutation's error toast.
                    }
                  }}
                >
                  <Label htmlFor='reschedule'>Reschedule</Label>
                  <div className='flex gap-2'>
                    <Input
                      id='reschedule'
                      type='datetime-local'
                      className='dark:[color-scheme:dark]'
                      min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                      value={
                        when ||
                        format(new Date(post.scheduledAt), "yyyy-MM-dd'T'HH:mm")
                      }
                      onChange={(e) => setWhen(e.target.value)}
                    />
                    <Button
                      type='submit'
                      variant='outline'
                      loading={reschedule.isPending}
                      disabled={!when}
                    >
                      Save
                    </Button>
                  </div>
                </form>
              )}
            </div>

            <div className='flex flex-wrap gap-2 border-t p-4'>
              {post.status === 'scheduled' && (
                <Button
                  onClick={() => run('publish-now').catch(() => undefined)}
                  loading={action.isPending}
                >
                  Publish now
                </Button>
              )}
              {post.status === 'failed' && (
                <Button
                  onClick={() => run('retry').catch(() => undefined)}
                  loading={action.isPending}
                >
                  Retry
                </Button>
              )}
              {editable && (
                <Button variant='outline' onClick={() => setConfirm('cancel')}>
                  Cancel post
                </Button>
              )}
              {post.status !== 'processing' && (
                <Button
                  variant='ghost'
                  className='text-destructive ml-auto'
                  onClick={() => setConfirm('delete')}
                >
                  Delete
                </Button>
              )}
            </div>

            <ConfirmDialog
              open={confirm === 'cancel'}
              onOpenChange={(open) => !open && setConfirm(null)}
              title='Cancel this post?'
              description='It won’t be published. Your credit isn’t refunded.'
              confirmLabel='Cancel post'
              destructive
              onConfirm={() => run('cancel')}
            />
            <ConfirmDialog
              open={confirm === 'delete'}
              onOpenChange={(open) => !open && setConfirm(null)}
              title='Delete this post?'
              description={
                post.status === 'published'
                  ? 'It’s removed from Sparqly only. The post stays on the platform.'
                  : 'It’s removed from your calendar and won’t be published.'
              }
              confirmLabel='Delete'
              destructive
              onConfirm={async () => {
                await remove.mutateAsync(post.id);
                toast.success('Post deleted');
                onClose();
              }}
            />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function CalendarPage() {
  const [month, setMonth] = useMonth();
  const [openId, setOpenId] = useState<string | null>(null);
  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const gridEnd = addDays(endOfWeek(endOfMonth(month), { weekStartsOn: 1 }), 1);
  const posts = usePostsInRange(gridStart, gridEnd);

  const days = useMemo(() => {
    const list: Date[] = [];
    for (let d = gridStart; d < gridEnd; d = addDays(d, 1)) list.push(d);
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridStart.getTime(), gridEnd.getTime()]);

  const byDay = useMemo(() => {
    const map = new Map<string, ScheduledPost[]>();
    for (const post of posts.data?.data ?? []) {
      const key = format(new Date(post.scheduledAt), 'yyyy-MM-dd');
      map.set(key, [...(map.get(key) ?? []), post]);
    }
    map.forEach((list) =>
      list.sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt))
    );
    return map;
  }, [posts.data]);

  const open = posts.data?.data.find((p) => p.id === openId) ?? null;
  const total =
    posts.data?.data.filter((p) => isSameMonth(new Date(p.scheduledAt), month))
      .length ?? 0;

  return (
    <PageBody wide>
      <PageHeader
        title='Calendar'
        description={
          posts.isPending
            ? 'Your scheduled and published posts.'
            : `${total} post${total === 1 ? '' : 's'} in ${format(month, 'MMMM')}. Schedule more from a project.`
        }
        actions={
          <div className='flex items-center gap-1'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setMonth(startOfMonth(new Date()))}
            >
              Today
            </Button>
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label='Previous month'
              onClick={() => setMonth(addMonths(month, -1))}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label='Next month'
              onClick={() => setMonth(addMonths(month, 1))}
            >
              <ChevronRight />
            </Button>
            <span className='ml-1 w-32 text-[15px] font-medium'>
              {format(month, 'MMMM yyyy')}
            </span>
          </div>
        }
      />

      {posts.isError ? (
        <ErrorState error={posts.error} onRetry={() => posts.refetch()} />
      ) : (
        <div
          className='overflow-hidden rounded-xl border'
          aria-busy={posts.isPending}
        >
          <div className='bg-sidebar grid grid-cols-7 border-b'>
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className='text-muted-foreground px-2 py-1.5 text-[11px] font-medium'
              >
                {d}
              </div>
            ))}
          </div>
          <div className='grid grid-cols-7'>
            {days.map((day, i) => {
              const list = byDay.get(format(day, 'yyyy-MM-dd')) ?? [];
              const outside = !isSameMonth(day, month);
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'min-h-28 space-y-0.5 border-b p-1',
                    i % 7 !== 6 && 'border-r',
                    outside && 'bg-sidebar/50'
                  )}
                >
                  <div className='flex justify-end px-1 pb-0.5'>
                    <span
                      className={cn(
                        'tnum flex size-5 items-center justify-center rounded-full text-[11px]',
                        outside
                          ? 'text-subtle-foreground'
                          : 'text-muted-foreground',
                        isToday(day) &&
                          'bg-primary text-primary-foreground font-medium'
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                  </div>
                  {list.slice(0, 3).map((post) => (
                    <PostChip
                      key={post.id}
                      post={post}
                      onOpen={() => setOpenId(post.id)}
                    />
                  ))}
                  {list.length > 3 && (
                    <DayOverflow
                      posts={list.slice(3)}
                      day={day}
                      onOpen={setOpenId}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!posts.isPending && total === 0 && !posts.isError && (
        <p className='text-muted-foreground flex items-center justify-center gap-2 text-[13px]'>
          <CalendarClock className='size-4' aria-hidden />
          Nothing this month.{' '}
          <Link
            href='/dashboard/projects'
            className='text-foreground underline-offset-4 hover:underline'
          >
            Schedule from a project
          </Link>
        </p>
      )}

      <PostSheet post={open} onClose={() => setOpenId(null)} />
    </PageBody>
  );
}

function DayOverflow({
  posts,
  day,
  onOpen
}: {
  posts: ScheduledPost[];
  day: Date;
  onOpen: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  if (expanded) {
    return (
      <>
        {posts.map((post) => (
          <PostChip key={post.id} post={post} onOpen={() => onOpen(post.id)} />
        ))}
      </>
    );
  }
  return (
    <button
      type='button'
      className='text-muted-foreground hover:text-foreground px-1 text-[11px]'
      onClick={() => setExpanded(true)}
      aria-label={`Show ${posts.length} more on ${format(day, 'MMMM d')}`}
    >
      +{posts.length} more
    </button>
  );
}
