'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ErrorState } from '@/components/common/states';
import {
  useAccountPerformance,
  usePostPerformance
} from '@/lib/api/hooks/account';
import type { PostPerformance } from '@/lib/api/types';
import { compactNumber, shortDate } from '@/lib/format';
import { platformMeta } from '@/lib/platforms';
import { cn } from '@/lib/utils';

type SortKey = 'views' | 'viewsInRange' | 'likes' | 'comments' | 'shares';

const COLUMNS: Array<{ key: SortKey; label: string }> = [
  { key: 'views', label: 'Views' },
  { key: 'viewsInRange', label: 'In range' },
  { key: 'likes', label: 'Likes' },
  { key: 'comments', label: 'Comments' },
  { key: 'shares', label: 'Shares' }
];

export function engagementRate(p: {
  views: number;
  likes: number;
  comments: number;
  shares: number;
}) {
  return p.views > 0 ? ((p.likes + p.comments + p.shares) / p.views) * 100 : 0;
}

export function sortPosts(posts: PostPerformance[], key: SortKey) {
  return [...posts].sort(
    (a, b) =>
      b[key] - a[key] ||
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

function PlatformMark({ platform }: { platform: string }) {
  const meta = platformMeta(platform);
  const Icon = meta.icon;
  return (
    <Icon
      className='size-3.5 shrink-0'
      style={{ color: meta.color }}
      aria-label={meta.label}
    />
  );
}

function SortHeader({
  label,
  active,
  onClick
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <TableHead
      className='text-right'
      aria-sort={active ? 'descending' : undefined}
    >
      <button
        type='button'
        onClick={onClick}
        className={cn(
          'hover:text-foreground inline-flex items-center gap-1',
          active && 'text-foreground'
        )}
      >
        {label}
        {active && <ArrowDown className='size-3' aria-hidden />}
      </button>
    </TableHead>
  );
}

function TableSkeleton() {
  return (
    <div className='space-y-2 p-4'>
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className='h-8' />
      ))}
    </div>
  );
}

/** Per-account and per-post performance for the selected range. */
export function PerformanceTables({
  startDate,
  endDate
}: {
  startDate: string;
  endDate: string;
}) {
  const posts = usePostPerformance(startDate, endDate);
  const accounts = useAccountPerformance(startDate, endDate);
  const [tab, setTab] = useState('accounts');
  const [sort, setSort] = useState<SortKey>('views');
  const [accountFilter, setAccountFilter] = useState<string | null>(null);

  const rows = useMemo(() => {
    const list = posts.data ?? [];
    const filtered = accountFilter
      ? list.filter((p) => p.accountId === accountFilter)
      : list;
    return sortPosts(filtered, sort);
  }, [posts.data, accountFilter, sort]);

  const filterName = accounts.data?.find(
    (a) => a.accountId === accountFilter
  )?.accountName;

  return (
    <section className='bg-card rounded-xl border'>
      <Tabs value={tab} onValueChange={setTab}>
        <div className='flex items-center justify-between gap-3 border-b px-4 py-2.5'>
          <h2 className='text-[13px] font-medium'>Performance</h2>
          <TabsList>
            <TabsTrigger value='accounts'>By account</TabsTrigger>
            <TabsTrigger value='posts'>By post</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value='accounts' className='m-0'>
          {accounts.isPending ? (
            <TableSkeleton />
          ) : accounts.isError ? (
            <ErrorState
              error={accounts.error}
              className='m-4'
              onRetry={() => void accounts.refetch()}
            />
          ) : !accounts.data.length ? (
            <p className='text-muted-foreground p-4 text-[13px]'>
              No published posts in this period.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='pl-4'>Account</TableHead>
                  <TableHead className='text-right'>Posts</TableHead>
                  <TableHead className='text-right'>Views</TableHead>
                  <TableHead className='text-right'>In range</TableHead>
                  <TableHead className='text-right'>Engagement</TableHead>
                  <TableHead className='pr-4 text-right'>
                    <span className='sr-only'>Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.data.map((a) => (
                  <TableRow key={a.accountId}>
                    <TableCell className='pl-4'>
                      <span className='flex items-center gap-2'>
                        <PlatformMark platform={a.platform} />
                        <span className='truncate'>
                          {a.accountName ?? platformMeta(a.platform).label}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className='tnum text-right'>{a.posts}</TableCell>
                    <TableCell className='tnum text-right'>
                      {compactNumber(a.views)}
                    </TableCell>
                    <TableCell className='tnum text-muted-foreground text-right'>
                      +{compactNumber(a.viewsInRange)}
                    </TableCell>
                    <TableCell className='tnum text-right'>
                      {a.engagementRate.toFixed(1)}%
                    </TableCell>
                    <TableCell className='pr-4 text-right'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => {
                          setAccountFilter(a.accountId);
                          setTab('posts');
                        }}
                      >
                        View posts
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value='posts' className='m-0'>
          {accountFilter && (
            <div className='flex items-center gap-2 border-b px-4 py-2 text-xs'>
              <span className='text-muted-foreground'>Showing</span>
              <span className='font-medium'>{filterName ?? 'one account'}</span>
              <Button
                variant='ghost'
                size='icon-xs'
                aria-label='Show all accounts'
                onClick={() => setAccountFilter(null)}
              >
                <X />
              </Button>
            </div>
          )}
          {posts.isPending ? (
            <TableSkeleton />
          ) : posts.isError ? (
            <ErrorState
              error={posts.error}
              className='m-4'
              onRetry={() => void posts.refetch()}
            />
          ) : !rows.length ? (
            <p className='text-muted-foreground p-4 text-[13px]'>
              No published posts in this period.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='pl-4'>Post</TableHead>
                  {COLUMNS.map((c) => (
                    <SortHeader
                      key={c.key}
                      label={c.label}
                      active={sort === c.key}
                      onClick={() => setSort(c.key)}
                    />
                  ))}
                  <TableHead className='pr-4 text-right'>Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className='max-w-72 pl-4'>
                      <div className='flex items-center gap-2'>
                        <PlatformMark platform={p.platform} />
                        <div className='min-w-0'>
                          {p.contentId ? (
                            <Link
                              href={`/dashboard/projects/${p.contentId}`}
                              className='block truncate hover:underline'
                            >
                              {p.title || 'Untitled post'}
                            </Link>
                          ) : (
                            <span className='block truncate'>
                              {p.title || 'Untitled post'}
                            </span>
                          )}
                          <span className='text-muted-foreground block text-[11px]'>
                            {p.accountName ?? platformMeta(p.platform).label} ·{' '}
                            {shortDate(p.publishedAt)}
                          </span>
                        </div>
                        {p.postUrl && (
                          <a
                            href={p.postUrl}
                            target='_blank'
                            rel='noreferrer'
                            className='text-muted-foreground hover:text-foreground shrink-0'
                            aria-label='Open the published post'
                          >
                            <ExternalLink className='size-3.5' />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    {COLUMNS.map((c) => (
                      <TableCell
                        key={c.key}
                        className={cn(
                          'tnum text-right',
                          c.key === 'viewsInRange' && 'text-muted-foreground'
                        )}
                      >
                        {c.key === 'viewsInRange' ? '+' : ''}
                        {compactNumber(p[c.key])}
                      </TableCell>
                    ))}
                    <TableCell className='tnum pr-4 text-right'>
                      {engagementRate(p).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}
