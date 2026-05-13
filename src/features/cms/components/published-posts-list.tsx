'use client';

import * as React from 'react';
import { useScheduledPosts } from '@/features/repurpose/api/scheduled-posts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import {
  IconExternalLink,
  IconBrandYoutube,
  IconBrandLinkedin,
  IconBrandTwitter,
  IconBrandInstagram,
  IconBrandTiktok
} from '@tabler/icons-react';
import { Skeleton } from '@/components/ui/skeleton';

const PLATFORM_ICONS: Record<string, any> = {
  youtube: IconBrandYoutube,
  linkedin: IconBrandLinkedin,
  instagram: IconBrandInstagram,
  twitter: IconBrandTwitter,
  tiktok: IconBrandTiktok
};

export function PublishedPostsList() {
  const { useGetScheduled } = useScheduledPosts();
  // Fetch all scheduled posts to filter published ones
  // In a real app, we would have a dedicated /published endpoint
  const { data, isLoading } = useGetScheduled(1, 100);
  const posts = data?.data || [];

  // Filter for posts that are either published or failed
  const activityPosts = posts.filter((p) =>
    ['published', 'failed'].includes(p.status)
  );

  if (isLoading) {
    return <Skeleton className='h-[400px] w-full rounded-3xl' />;
  }

  if (activityPosts.length === 0) {
    return (
      <div className='bg-muted/10 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed py-12 text-center'>
        <p className='text-muted-foreground'>
          No recent social activity found.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <h3 className='px-2 text-lg font-bold'>Recent Activity</h3>
      <div className='bg-background overflow-hidden rounded-3xl border shadow-sm'>
        <Table>
          <TableHeader>
            <TableRow className='bg-muted/30 border-b hover:bg-transparent'>
              <TableHead className='px-6 py-4'>Post</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Time</TableHead>
              <TableHead className='px-6 text-right'>Link</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activityPosts.map((post) => {
              const Icon = PLATFORM_ICONS[post.platformAccount?.platform || ''];
              const postUrl: string | null = null;

              return (
                <TableRow
                  key={post.id}
                  className='hover:bg-muted/10 group transition-colors'
                >
                  <TableCell className='px-6 py-4'>
                    <span className='block max-w-[200px] truncate font-medium'>
                      {post.content?.title || 'Untitled'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      {Icon && <Icon className='text-primary size-4' />}
                      <span className='text-sm capitalize'>
                        {post.platformAccount?.platform}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        post.status === 'published'
                          ? 'default'
                          : post.status === 'failed'
                            ? 'destructive'
                            : 'secondary'
                      }
                      className='rounded-full capitalize'
                    >
                      {post.status}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-muted-foreground text-sm'>
                    {format(new Date(post.scheduledAt), 'MMM dd, HH:mm')}
                  </TableCell>
                  <TableCell className='px-6 text-right'>
                    {post.status === 'published' && postUrl && (
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-8 w-8 rounded-full'
                        asChild
                      >
                        <a
                          href={postUrl}
                          target='_blank'
                          rel='noopener noreferrer'
                        >
                          <IconExternalLink className='size-4' />
                        </a>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
