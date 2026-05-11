'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface BlogPreviewProps {
  content: string;
  className?: string;
}

export function BlogPreview({ content, className }: BlogPreviewProps) {
  return (
    <div
      className={cn(
        'bg-background overflow-hidden rounded-2xl border shadow-sm',
        className
      )}
    >
      <div className='bg-muted/30 flex items-center justify-between border-b px-6 py-4'>
        <div className='flex gap-1.5'>
          <div className='bg-destructive/50 h-3 w-3 rounded-full' />
          <div className='h-3 w-3 rounded-full bg-yellow-500/50' />
          <div className='h-3 w-3 rounded-full bg-green-500/50' />
        </div>
        <span className='text-muted-foreground text-xs font-medium tracking-widest uppercase'>
          Preview
        </span>
      </div>
      <div className='prose prose-stone dark:prose-invert max-w-none p-8 md:p-12'>
        <div
          dangerouslySetInnerHTML={{ __html: content }}
          className='[&>p]:text-muted-foreground space-y-6 [&>h1]:text-4xl [&>h1]:font-extrabold [&>h1]:tracking-tight [&>h2]:text-2xl [&>h2]:font-bold [&>p]:leading-relaxed'
        />
      </div>
    </div>
  );
}
