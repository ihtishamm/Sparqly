'use client';

import * as React from 'react';
import Image from 'next/image';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { ScheduleModal } from './schedule-modal';
import {
  MOCK_CONTENT,
  type ContentItem,
  type ContentStatus
} from '../constants/mock-content';
import {
  IconDotsVertical,
  IconLayoutGrid,
  IconList,
  IconSearch
} from '@tabler/icons-react';
import { Icons } from '@/components/icons';

const PLATFORM_ICONS: Record<string, keyof typeof Icons> = {
  instagram: 'media',
  twitter: 'twitter',
  linkedin: 'user',
  tiktok: 'media'
};

function statusVariant(s: ContentStatus): 'secondary' | 'outline' | 'default' {
  if (s === 'published') return 'default';
  if (s === 'scheduled') return 'secondary';
  return 'outline';
}

export default function CmsViewPage() {
  const [view, setView] = React.useState<'grid' | 'table'>('grid');
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<ContentStatus | 'all'>(
    'all'
  );
  const [scheduleModalOpen, setScheduleModalOpen] = React.useState(false);
  const [scheduleItem, setScheduleItem] = React.useState<ContentItem | null>(
    null
  );

  const filtered = React.useMemo(() => {
    return MOCK_CONTENT.filter((item) => {
      const matchSearch =
        !search || item.title.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        statusFilter === 'all' || item.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter]);

  const openSchedule = (item: ContentItem) => {
    setScheduleItem(item);
    setScheduleModalOpen(true);
  };

  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col gap-6'>
        <header className='space-y-2'>
          <h1 className='text-3xl font-bold tracking-tight md:text-4xl'>
            Content Management
          </h1>
          <p className='text-muted-foreground'>
            Manage your content across platforms. Search, filter, and schedule
            posts.
          </p>
        </header>

        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='relative flex-1'>
            <IconSearch className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
            <Input
              placeholder='Search content...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='rounded-xl pl-9'
            />
          </div>
          <div className='flex items-center gap-2'>
            <ToggleGroup
              type='single'
              value={statusFilter}
              onValueChange={(v) =>
                v && setStatusFilter(v as ContentStatus | 'all')
              }
              variant='outline'
            >
              <ToggleGroupItem value='all' className='px-4'>
                All
              </ToggleGroupItem>
              <ToggleGroupItem value='draft' className='px-4'>
                Draft
              </ToggleGroupItem>
              <ToggleGroupItem value='scheduled' className='px-4'>
                Scheduled
              </ToggleGroupItem>
              <ToggleGroupItem value='published' className='px-4'>
                Published
              </ToggleGroupItem>
            </ToggleGroup>
            <ToggleGroup
              type='single'
              value={view}
              onValueChange={(v) => v && setView(v as 'grid' | 'table')}
              variant='outline'
            >
              <ToggleGroupItem value='grid' aria-label='Grid'>
                <IconLayoutGrid className='size-4' />
              </ToggleGroupItem>
              <ToggleGroupItem value='table' aria-label='Table'>
                <IconList className='size-4' />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {view === 'grid' && (
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {filtered.map((item) => (
              <Card key={item.id} className='overflow-hidden rounded-2xl'>
                <div className='bg-muted relative aspect-video w-full'>
                  <Image
                    src={item.thumbnail}
                    alt=''
                    fill
                    className='object-cover'
                    sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
                  />
                </div>
                <CardHeader className='flex flex-row items-start justify-between gap-2 p-4'>
                  <p className='line-clamp-2 font-medium'>{item.title}</p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='size-8 shrink-0'
                      >
                        <IconDotsVertical className='size-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openSchedule(item)}>
                        Schedule
                      </DropdownMenuItem>
                      <DropdownMenuItem className='text-destructive'>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className='space-y-2 p-4 pt-0'>
                  <div className='flex flex-wrap gap-1'>
                    {item.platforms.map((p) => {
                      const Icon = Icons[PLATFORM_ICONS[p] ?? 'media'];
                      return (
                        <Icon
                          key={p}
                          className='text-muted-foreground size-4'
                        />
                      );
                    })}
                  </div>
                  <Badge
                    variant={statusVariant(item.status)}
                    className='capitalize'
                  >
                    {item.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {view === 'table' && (
          <div className='border-border rounded-2xl border'>
            <Table>
              <TableHeader>
                <TableRow className='bg-muted/50'>
                  <TableHead className='w-20'>Thumbnail</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Platforms</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='w-12' />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className='bg-muted relative size-12 overflow-hidden rounded-lg'>
                        <Image
                          src={item.thumbnail}
                          alt=''
                          fill
                          className='object-cover'
                          sizes='48px'
                        />
                      </div>
                    </TableCell>
                    <TableCell className='font-medium'>{item.title}</TableCell>
                    <TableCell>
                      <div className='flex gap-1'>
                        {item.platforms.map((p) => {
                          const Icon = Icons[PLATFORM_ICONS[p] ?? 'media'];
                          return (
                            <Icon
                              key={p}
                              className='text-muted-foreground size-4'
                            />
                          );
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={statusVariant(item.status)}
                        className='capitalize'
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='size-8'
                          >
                            <IconDotsVertical className='size-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openSchedule(item)}>
                            Schedule
                          </DropdownMenuItem>
                          <DropdownMenuItem className='text-destructive'>
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {filtered.length === 0 && (
          <div className='text-muted-foreground border-border flex flex-1 items-center justify-center rounded-2xl border border-dashed py-16 text-sm'>
            No content found.
          </div>
        )}
      </div>

      <ScheduleModal
        open={scheduleModalOpen}
        onOpenChange={setScheduleModalOpen}
        title={
          scheduleItem ? `Schedule: ${scheduleItem.title}` : 'Schedule post'
        }
        onConfirm={() => setScheduleItem(null)}
      />
    </PageContainer>
  );
}
