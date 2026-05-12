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
import { CalendarView } from './calendar-view';
import { useContents } from '@/features/repurpose/api/contents';
import {
  IconDotsVertical,
  IconLayoutGrid,
  IconList,
  IconSearch,
  IconTrash,
  IconCalendar,
  IconEdit,
  IconExternalLink,
  IconPlus,
  IconCalendarEvent,
  IconPlayerPlay
} from '@tabler/icons-react';
import { Icons } from '@/components/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import Link from 'next/link';

const getYouTubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url?.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

const getYouTubeThumbnail = (url: string) => {
  const id = getYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : null;
};

export default function CmsViewPage() {
  const [view, setView] = React.useState<'grid' | 'table' | 'calendar'>('grid');
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string | 'all'>('all');
  const [scheduleModalOpen, setScheduleModalOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<any>(null);
  const [previewItem, setPreviewItem] = React.useState<any>(null);

  const { useGetContentAssets, deleteAssetMutation } = useContents();
  const { data: assetsData, isLoading } = useGetContentAssets();

  const contents = React.useMemo(() => {
    return (assetsData?.data || []).map((asset: any) => ({
      ...asset,
      id: asset.id,
      title: asset.metadata?.title || 'Untitled Clip',
      sourceType: asset.type,
      status: 'saved',
      sourceUrl: asset.fileUrl,
      originalSourceUrl:
        asset.content?.metadata?.sourceUrl || asset.content?.title,
      createdAt: asset.createdAt
    }));
  }, [assetsData]);

  const filtered = React.useMemo(() => {
    return contents.filter((item) => {
      const matchSearch =
        !search ||
        (item.title || '').toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        statusFilter === 'all' || item.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [contents, search, statusFilter]);

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this clip?')) {
      deleteAssetMutation.mutate(id);
    }
  };

  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col gap-8 pb-12'>
        <header className='flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
          <div className='space-y-1.5'>
            <h1 className='text-3xl font-bold tracking-tight md:text-5xl'>
              Content <span className='text-primary'>Library</span>
            </h1>
            <p className='text-muted-foreground max-w-2xl text-lg'>
              Manage your projects, monitor their status, and schedule them for
              publication.
            </p>
          </div>
          <Link href='/dashboard/repurpose'>
            <Button className='shadow-primary/20 rounded-full px-6 shadow-lg'>
              <IconPlus className='mr-2 h-4 w-4' /> New Project
            </Button>
          </Link>
        </header>

        <div className='bg-muted/30 flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='relative max-w-md flex-1'>
            <IconSearch className='text-muted-foreground absolute top-1/2 left-3.5 size-4 -translate-y-1/2' />
            <Input
              placeholder='Search your content...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='bg-background rounded-xl border-none pl-10 shadow-sm'
            />
          </div>
          <div className='flex items-center gap-3'>
            <ToggleGroup
              type='single'
              value={statusFilter}
              onValueChange={(v) => v && setStatusFilter(v)}
              className='bg-background rounded-xl p-1 shadow-sm'
            >
              <ToggleGroupItem
                value='all'
                className='data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4'
              >
                All
              </ToggleGroupItem>
              <ToggleGroupItem
                value='draft'
                className='data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4'
              >
                Draft
              </ToggleGroupItem>
              <ToggleGroupItem
                value='published'
                className='data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4'
              >
                Live
              </ToggleGroupItem>
            </ToggleGroup>

            <div className='bg-border h-8 w-px' />

            <ToggleGroup
              type='single'
              value={view}
              onValueChange={(v) =>
                v && setView(v as 'grid' | 'table' | 'calendar')
              }
              className='bg-background rounded-xl p-1 shadow-sm'
            >
              <ToggleGroupItem
                value='grid'
                className='rounded-lg'
                title='Grid View'
              >
                <IconLayoutGrid className='size-4' />
              </ToggleGroupItem>
              <ToggleGroupItem
                value='table'
                className='rounded-lg'
                title='Table View'
              >
                <IconList className='size-4' />
              </ToggleGroupItem>
              <ToggleGroupItem
                value='calendar'
                className='rounded-lg'
                title='Calendar View'
              >
                <IconCalendarEvent className='size-4' />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {isLoading ? (
          <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className='aspect-[4/3] rounded-3xl' />
            ))}
          </div>
        ) : view === 'grid' ? (
          <motion.div
            layout
            className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'
          >
            <AnimatePresence>
              {filtered.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Card className='group border-primary/5 hover:border-primary/20 relative overflow-hidden rounded-3xl border transition-all hover:shadow-2xl'>
                    <div
                      className='relative aspect-video w-full cursor-pointer overflow-hidden bg-stone-900'
                      onClick={() => setPreviewItem(item)}
                    >
                      {getYouTubeThumbnail(item.originalSourceUrl) ? (
                        <Image
                          src={getYouTubeThumbnail(item.originalSourceUrl)!}
                          alt={item.title || ''}
                          fill
                          className='object-cover opacity-60 transition-opacity group-hover:opacity-100'
                        />
                      ) : (
                        <div className='absolute inset-0 flex items-center justify-center'>
                          <Icons.media className='h-12 w-12 text-white/10' />
                        </div>
                      )}

                      <div className='absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100'>
                        <div className='bg-primary/90 flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-transform hover:scale-110'>
                          <IconPlayerPlay className='h-7 w-7 fill-current text-white' />
                        </div>
                      </div>

                      <div className='absolute top-3 left-3'>
                        <Badge className='border-white/10 bg-black/50 text-[10px] tracking-widest text-white uppercase backdrop-blur-md'>
                          {item.sourceType}
                        </Badge>
                      </div>

                      {item.assets && item.assets.length > 0 && (
                        <div className='absolute bottom-3 left-3'>
                          <Badge className='border-none bg-green-500/80 text-[10px] text-white backdrop-blur-md'>
                            {item.assets.length} Clips Generated
                          </Badge>
                        </div>
                      )}
                    </div>
                    <CardHeader className='flex flex-row items-start justify-between gap-2 p-5'>
                      <div className='space-y-1'>
                        <h3
                          className='hover:text-primary line-clamp-1 cursor-pointer text-lg font-bold transition-colors'
                          onClick={() => setPreviewItem(item)}
                        >
                          {item.title || 'Untitled Project'}
                        </h3>
                        <p className='text-muted-foreground text-xs'>
                          {format(new Date(item.createdAt), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='hover:bg-background size-9 rounded-full shadow-sm'
                          >
                            <IconDotsVertical className='size-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align='end'
                          className='min-w-[160px] rounded-xl'
                        >
                          <DropdownMenuItem className='gap-2'>
                            <IconEdit className='size-4' /> Edit Project
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className='gap-2'
                            onClick={() => {
                              setSelectedItem(item);
                              setScheduleModalOpen(true);
                            }}
                          >
                            <IconCalendar className='size-4' /> Schedule
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className='text-destructive gap-2'
                            onClick={() => handleDelete(item.id)}
                          >
                            <IconTrash className='size-4' /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardHeader>
                    <CardContent className='flex items-center justify-between px-5 pt-0 pb-5'>
                      <Badge
                        variant={
                          item.status === 'published' ? 'default' : 'outline'
                        }
                        className='rounded-full px-3 font-semibold capitalize'
                      >
                        {item.status}
                      </Badge>
                      <div className='flex -space-x-2'>
                        {/* Placeholder for platform icons */}
                        <div className='bg-background border-muted flex size-7 items-center justify-center rounded-full border-2'>
                          <Icons.twitter className='text-muted-foreground size-3' />
                        </div>
                        <div className='bg-background border-muted flex size-7 items-center justify-center rounded-full border-2'>
                          <Icons.user className='text-muted-foreground size-3' />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='bg-background overflow-hidden rounded-3xl border shadow-sm'
          >
            <Table>
              <TableHeader>
                <TableRow className='bg-muted/30 border-b hover:bg-transparent'>
                  <TableHead className='px-6 py-4'>Project Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='px-6 text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow
                    key={item.id}
                    className='hover:bg-muted/10 group transition-colors'
                  >
                    <TableCell className='px-6 py-4'>
                      <div className='flex items-center gap-3'>
                        <div className='bg-muted flex size-10 shrink-0 items-center justify-center rounded-xl'>
                          <Icons.media className='text-muted-foreground size-5' />
                        </div>
                        <span className='font-bold'>
                          {item.title || 'Untitled'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant='secondary'
                        className='rounded-full text-[10px] tracking-wider uppercase'
                      >
                        {item.sourceType}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-muted-foreground text-sm'>
                      {format(new Date(item.createdAt), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.status === 'published' ? 'default' : 'outline'
                        }
                        className='rounded-full capitalize'
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className='px-6 text-right'>
                      <div className='flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8 rounded-full'
                          title='Edit'
                        >
                          <IconEdit className='size-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='text-destructive h-8 w-8 rounded-full'
                          onClick={() => handleDelete(item.id)}
                          title='Delete'
                        >
                          <IconTrash className='size-4' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </motion.div>
        )}

        {view === 'calendar' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <CalendarView />
          </motion.div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className='bg-muted/10 flex flex-col items-center justify-center space-y-4 rounded-3xl border-2 border-dashed py-24 text-center'>
            <div className='bg-background rounded-full p-6 shadow-sm'>
              <IconSearch className='text-muted-foreground size-12' />
            </div>
            <div className='space-y-1'>
              <h3 className='text-xl font-bold'>No results found</h3>
              <p className='text-muted-foreground max-w-xs'>
                Try adjusting your search or filters to find what you&apos;re
                looking for.
              </p>
            </div>
            <Button
              variant='outline'
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
              }}
              className='rounded-full'
            >
              Clear all filters
            </Button>
          </div>
        )}
      </div>

      <ScheduleModal
        open={scheduleModalOpen}
        onOpenChange={setScheduleModalOpen}
        contentId={selectedItem?.id}
        title={
          selectedItem ? `Schedule: ${selectedItem.title}` : 'Schedule post'
        }
        onConfirm={() => setSelectedItem(null)}
      />

      <Dialog
        open={!!previewItem}
        onOpenChange={(open) => !open && setPreviewItem(null)}
      >
        <DialogContent className='max-w-4xl overflow-hidden rounded-3xl p-0'>
          <DialogHeader className='p-6 pb-0'>
            <DialogTitle className='flex items-center justify-between gap-4 pr-8'>
              <span className='line-clamp-1'>{previewItem?.title}</span>
              <Badge variant='secondary' className='rounded-full'>
                {previewItem?.status}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-6 p-6'>
            <div className='bg-muted relative aspect-video overflow-hidden rounded-2xl'>
              {previewItem && (
                <>
                  {previewItem.fileUrl ? (
                    <video
                      src={previewItem.fileUrl}
                      controls
                      autoPlay
                      className='h-full w-full object-contain'
                    />
                  ) : (
                    <div className='flex h-full flex-col items-center justify-center gap-4'>
                      <Icons.media className='text-muted-foreground/20 h-16 w-16' />
                      <p className='text-muted-foreground'>
                        No playable media found.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {previewItem?.assets && previewItem.assets.length > 0 && (
              <div className='space-y-4'>
                <h4 className='text-sm font-semibold tracking-wider uppercase'>
                  Generated Assets ({previewItem.assets.length})
                </h4>
                <div className='grid grid-cols-2 gap-4 sm:grid-cols-3'>
                  {previewItem.assets.map((asset: any) => (
                    <div
                      key={asset.id}
                      className='group bg-muted hover:ring-primary relative aspect-video cursor-pointer overflow-hidden rounded-xl transition-all hover:ring-2'
                      onClick={() => {
                        const video = document.querySelector(
                          'video'
                        ) as HTMLVideoElement;
                        if (video) {
                          video.src = asset.fileUrl;
                          video.play();
                        }
                      }}
                    >
                      <video
                        src={asset.fileUrl}
                        className='h-full w-full object-cover opacity-60 group-hover:opacity-100'
                      />
                      <div className='absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100'>
                        <IconPlayerPlay className='h-6 w-6 text-white' />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
