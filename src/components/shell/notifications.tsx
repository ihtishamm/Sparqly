'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  CircleAlert,
  CircleCheck,
  Megaphone,
  Sparkles,
  type LucideIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { useActivity } from '@/lib/api/hooks/account';
import type { Activity } from '@/lib/api/types';
import { relativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';

const SEEN_KEY = 'sparqly:activity-seen';

const ICONS: Record<string, { icon: LucideIcon; className: string }> = {
  ai_job_completed: { icon: Sparkles, className: 'text-primary' },
  ai_job_failed: { icon: CircleAlert, className: 'text-destructive' },
  post_published: { icon: CircleCheck, className: 'text-success' },
  post_failed: { icon: CircleAlert, className: 'text-destructive' }
};

/** Where an activity entry leads, when it has a page of its own. */
function activityHref(activity: Activity) {
  if (activity.type.startsWith('post_')) return '/dashboard/calendar';
  const contentId = activity.metadata?.contentId;
  if (typeof contentId === 'string') return `/dashboard/projects/${contentId}`;
  return null;
}

export function ActivityItem({ activity }: { activity: Activity }) {
  const meta = ICONS[activity.type] ?? {
    icon: Megaphone,
    className: 'text-muted-foreground'
  };
  const Icon = meta.icon;
  const href = activityHref(activity);
  const body = (
    <>
      <Icon
        className={cn('mt-0.5 size-4 shrink-0', meta.className)}
        aria-hidden
      />
      <div className='min-w-0 flex-1'>
        <p className='truncate text-[13px] font-medium'>{activity.title}</p>
        {activity.description && (
          <p className='text-muted-foreground line-clamp-2 text-xs'>
            {activity.description}
          </p>
        )}
      </div>
      <time
        className='text-subtle-foreground shrink-0 text-[11px]'
        dateTime={activity.createdAt}
      >
        {relativeTime(activity.createdAt)}
      </time>
    </>
  );
  return href ? (
    <Link
      href={href}
      className='hover:bg-accent flex items-start gap-2.5 rounded-lg px-2 py-2'
    >
      {body}
    </Link>
  ) : (
    <div className='flex items-start gap-2.5 rounded-lg px-2 py-2'>{body}</div>
  );
}

export function Notifications() {
  const { data, isLoading } = useActivity(15);
  const [seenAt, setSeenAt] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setSeenAt(Number(localStorage.getItem(SEEN_KEY) ?? 0));
  }, []);

  const items = data?.data ?? [];
  const unread = items.filter(
    (a) => new Date(a.createdAt).getTime() > seenAt
  ).length;

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      const now = Date.now();
      localStorage.setItem(SEEN_KEY, String(now));
      // Keep the dots visible while the panel is open.
      setTimeout(() => setSeenAt(now), 1500);
    }
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant='ghost'
          size='icon-sm'
          className='relative'
          aria-label={unread ? `Notifications, ${unread} new` : 'Notifications'}
        >
          <Bell />
          {unread > 0 && (
            <span className='bg-primary ring-sidebar absolute top-1 right-1 size-2 rounded-full ring-2' />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align='start' className='w-80 p-1.5'>
        <p className='text-muted-foreground px-2 pt-1 pb-2 text-xs font-medium'>
          Activity
        </p>
        <div className='scrollbar-thin max-h-96 overflow-y-auto'>
          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className='flex gap-2.5 px-2 py-2'>
                <Skeleton className='size-4 rounded' />
                <div className='flex-1 space-y-1.5'>
                  <Skeleton className='h-3 w-2/3' />
                  <Skeleton className='h-3 w-1/2' />
                </div>
              </div>
            ))}
          {!isLoading && items.length === 0 && (
            <p className='text-muted-foreground px-2 py-6 text-center text-[13px]'>
              Finished jobs and published posts will show up here.
            </p>
          )}
          {items.map((activity) => (
            <div key={activity.id} className='relative'>
              {new Date(activity.createdAt).getTime() > seenAt && (
                <span className='bg-primary absolute top-3.5 -left-0.5 size-1.5 rounded-full' />
              )}
              <ActivityItem activity={activity} />
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
