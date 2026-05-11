'use client';

import * as React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { IconBell, IconCheck, IconTrash } from '@tabler/icons-react';
import { useNotificationStore, Notification } from '@/store/notification-store';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } =
    useNotificationStore();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='hover:bg-primary/10 relative rounded-full transition-colors'
        >
          <IconBell className='h-5 w-5' />
          {unreadCount > 0 && (
            <span className='bg-primary text-primary-foreground animate-in zoom-in absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold'>
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className='border-primary/10 w-80 overflow-hidden rounded-3xl p-0 shadow-2xl'
        align='end'
      >
        <div className='bg-primary/5 flex items-center justify-between border-b p-4'>
          <div className='space-y-0.5'>
            <h4 className='text-sm font-bold'>Notifications</h4>
            <p className='text-muted-foreground text-[10px] font-semibold tracking-widest uppercase'>
              {unreadCount} Unread
            </p>
          </div>
          <div className='flex gap-1'>
            <Button
              variant='ghost'
              size='icon'
              onClick={markAllAsRead}
              className='h-8 w-8 rounded-full'
              title='Mark all as read'
            >
              <IconCheck size={16} />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              onClick={clearAll}
              className='text-destructive h-8 w-8 rounded-full'
              title='Clear all'
            >
              <IconTrash size={16} />
            </Button>
          </div>
        </div>

        <ScrollArea className='h-80'>
          {notifications.length === 0 ? (
            <div className='flex h-full flex-col items-center justify-center py-12 text-center'>
              <div className='bg-muted mb-3 flex h-12 w-12 items-center justify-center rounded-full'>
                <IconBell className='text-muted-foreground' size={20} />
              </div>
              <p className='text-muted-foreground text-xs font-medium'>
                All caught up!
              </p>
            </div>
          ) : (
            <div className='divide-border/50 divide-y'>
              {notifications.map((n: Notification) => (
                <div
                  key={n.id}
                  className={cn(
                    'hover:bg-muted/50 group relative flex cursor-pointer flex-col gap-1 p-4 transition-colors',
                    !n.isRead && 'bg-primary/5'
                  )}
                  onClick={() => markAsRead(n.id)}
                >
                  {!n.isRead && (
                    <div className='bg-primary absolute top-4 left-1.5 h-1 w-1 rounded-full' />
                  )}
                  <div className='flex items-start justify-between gap-2'>
                    <h5 className='text-xs leading-none font-bold'>
                      {n.title}
                    </h5>
                    <span className='text-muted-foreground text-[10px] whitespace-nowrap'>
                      {formatDistanceToNow(new Date(n.createdAt), {
                        addSuffix: true
                      })}
                    </span>
                  </div>
                  <p className='text-muted-foreground line-clamp-2 text-xs leading-relaxed'>
                    {n.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className='bg-muted/20 border-t p-3'>
          <Button
            variant='ghost'
            className='h-8 w-full rounded-xl text-[10px] font-bold tracking-widest uppercase'
          >
            View All Activity
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
