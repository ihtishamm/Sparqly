'use client';

import * as React from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths
} from 'date-fns';
import { useScheduledPosts } from '@/features/repurpose/api/scheduled-posts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  IconChevronLeft,
  IconChevronRight,
  IconBrandLinkedin,
  IconBrandTwitter,
  IconBrandInstagram,
  IconBrandYoutube,
  IconBrandTiktok,
  IconCalendar
} from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

const PLATFORM_ICONS: Record<string, any> = {
  youtube: IconBrandYoutube,
  linkedin: IconBrandLinkedin,
  instagram: IconBrandInstagram,
  twitter: IconBrandTwitter,
  tiktok: IconBrandTiktok
};

export function CalendarView() {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const { useGetScheduled } = useScheduledPosts();
  const { data: scheduledData } = useGetScheduled(1, 100);
  const scheduledPosts = scheduledData?.data || [];

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  return (
    <div className='space-y-6'>
      <div className='bg-muted/30 flex items-center justify-between rounded-2xl p-4'>
        <div className='flex items-center gap-4'>
          <div className='bg-primary/10 rounded-2xl p-3'>
            <IconCalendar className='text-primary h-6 w-6' />
          </div>
          <div>
            <h2 className='text-xl font-bold'>
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <p className='text-muted-foreground text-xs'>
              {scheduledPosts.length} posts scheduled this month
            </p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='icon'
            onClick={prevMonth}
            className='rounded-xl'
          >
            <IconChevronLeft className='h-4 w-4' />
          </Button>
          <Button
            variant='outline'
            size='icon'
            onClick={nextMonth}
            className='rounded-xl'
          >
            <IconChevronRight className='h-4 w-4' />
          </Button>
        </div>
      </div>

      <div className='bg-border grid grid-cols-7 gap-px overflow-hidden rounded-3xl border shadow-sm'>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className='bg-muted/50 text-muted-foreground py-3 text-center text-xs font-bold tracking-widest uppercase'
          >
            {day}
          </div>
        ))}
        {calendarDays.map((day, i) => {
          const dayPosts = scheduledPosts.filter((post) =>
            isSameDay(new Date(post.scheduledAt), day)
          );
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={i}
              className={`bg-background hover:bg-muted/5 min-h-[120px] p-2 transition-colors ${
                !isCurrentMonth ? 'opacity-40' : ''
              }`}
            >
              <div className='mb-2 flex items-center justify-between'>
                <span
                  className={`flex size-6 items-center justify-center rounded-full text-xs font-bold ${
                    isToday
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'text-muted-foreground'
                  }`}
                >
                  {format(day, 'd')}
                </span>
              </div>
              <div className='space-y-1'>
                <AnimatePresence>
                  {dayPosts.map((post) => {
                    const Icon =
                      PLATFORM_ICONS[post.platformAccount.platform] ||
                      IconCalendar;
                    return (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        className='bg-primary/5 border-primary/10 group hover:bg-primary/10 flex cursor-pointer items-center gap-2 rounded-lg border p-1.5 transition-colors'
                      >
                        <Icon className='text-primary h-3 w-3 shrink-0' />
                        <span className='flex-1 truncate text-[10px] font-medium'>
                          {post.content.title || 'Untitled'}
                        </span>
                        <span className='text-muted-foreground text-[8px] opacity-0 transition-opacity group-hover:opacity-100'>
                          {format(new Date(post.scheduledAt), 'HH:mm')}
                        </span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
