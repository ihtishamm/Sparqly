'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { FolderOpen, Plus, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageBody, PageHeader } from '@/components/common/page-header';
import {
  EmptyState,
  ErrorState,
  GridSkeleton
} from '@/components/common/states';
import { useProjects } from '@/lib/api/hooks/projects';
import { ProjectCard } from './project-card';

function useDebounced<T>(value: T, ms = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

export function ProjectsPage() {
  const [query, setQuery] = useState('');
  const search = useDebounced(query.trim());
  const projects = useProjects(search);
  const items = projects.data?.pages.flatMap((p) => p.data) ?? [];
  const sentinel = useRef<HTMLDivElement>(null);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = projects;

  // Load the next page when the end of the grid scrolls into view.
  useEffect(() => {
    const node = sentinel.current;
    if (!node || !hasNextPage) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) void fetchNextPage();
      },
      { rootMargin: '400px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <PageBody wide>
      <PageHeader
        title='Projects'
        description='Every video you repurpose or generate, with its clips, posts and schedule.'
        actions={
          <Button asChild>
            <Link href='/dashboard/repurpose'>
              <Plus /> New project
            </Link>
          </Button>
        }
      />

      <div className='relative max-w-sm'>
        <Search
          className='text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2'
          aria-hidden
        />
        <Input
          type='search'
          aria-label='Search projects'
          placeholder='Search projects'
          className='pr-8 pl-8'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && setQuery('')}
        />
        {query && (
          <Button
            variant='ghost'
            size='icon-xs'
            className='absolute top-1/2 right-1 -translate-y-1/2'
            aria-label='Clear search'
            onClick={() => setQuery('')}
          >
            <X />
          </Button>
        )}
      </div>

      {projects.isPending ? (
        <GridSkeleton count={8} className='xl:grid-cols-4' />
      ) : projects.isError ? (
        <ErrorState error={projects.error} onRetry={() => projects.refetch()} />
      ) : items.length === 0 ? (
        search ? (
          <EmptyState
            icon={Search}
            title='No matching projects'
            description={`Nothing matches “${search}”.`}
            action={
              <Button variant='outline' onClick={() => setQuery('')}>
                Clear search
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={FolderOpen}
            title='No projects yet'
            description='Paste a video link and Sparqly cuts clips and writes posts from it.'
            action={
              <Button asChild>
                <Link href='/dashboard/repurpose'>Repurpose a video</Link>
              </Button>
            }
          />
        )
      ) : (
        <>
          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            {items.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
          <div ref={sentinel} />
          {isFetchingNextPage && (
            <GridSkeleton count={4} className='xl:grid-cols-4' />
          )}
        </>
      )}
    </PageBody>
  );
}
