'use client';

import * as React from 'react';
import { useAudit, ActivityLog } from '../api/audit';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconVideo,
  IconCalendar,
  IconUser,
  IconDeviceFloppy,
  IconShare
} from '@tabler/icons-react';

const ACTION_ICONS: Record<string, any> = {
  create: IconPlus,
  update: IconEdit,
  delete: IconTrash,
  render: IconVideo,
  schedule: IconCalendar,
  login: IconUser,
  save: IconDeviceFloppy,
  export: IconShare
};

const ACTION_COLORS: Record<string, string> = {
  create: 'text-green-500 bg-green-500/10',
  update: 'text-blue-500 bg-blue-500/10',
  delete: 'text-red-500 bg-red-500/10',
  render: 'text-purple-500 bg-purple-500/10',
  schedule: 'text-orange-500 bg-orange-500/10',
  login: 'text-primary bg-primary/10'
};

export function RecentActivityList() {
  const { useGetActivityLogs } = useAudit();
  const { data, isLoading } = useGetActivityLogs(1, 5);

  if (isLoading) {
    return (
      <div className='space-y-4'>
        {[1, 2, 3].map((i) => (
          <div key={i} className='flex items-center gap-4'>
            <Skeleton className='h-10 w-10 rounded-full' />
            <div className='flex-1 space-y-2'>
              <Skeleton className='h-4 w-[60%]' />
              <Skeleton className='h-3 w-[40%]' />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const logs = data?.data || [];

  if (logs.length === 0) {
    return (
      <div className='text-muted-foreground py-8 text-center text-sm italic'>
        No recent activity found.
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {logs.map((log: ActivityLog) => {
        const actionType = log.action.split('.')[0].toLowerCase();
        const Icon = ACTION_ICONS[actionType] || IconPlus;
        const colorClass =
          ACTION_COLORS[actionType] || 'text-muted-foreground bg-muted';

        return (
          <div key={log.id} className='group relative flex items-start gap-4'>
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform group-hover:scale-110',
                colorClass
              )}
            >
              <Icon size={18} />
            </div>

            <div className='flex flex-1 flex-col gap-0.5'>
              <p className='text-sm leading-none font-medium'>
                <span className='capitalize'>
                  {log.action.replace(/\./g, ' ')}
                </span>
                {log.entityType && (
                  <span className='text-muted-foreground'>
                    {' '}
                    on {log.entityType.toLowerCase()}
                  </span>
                )}
              </p>
              <div className='text-muted-foreground flex items-center gap-2 text-xs'>
                <span>
                  {formatDistanceToNow(new Date(log.createdAt), {
                    addSuffix: true
                  })}
                </span>
                <span>•</span>
                <span className='font-mono text-[10px] uppercase'>
                  {log.id.slice(0, 8)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
