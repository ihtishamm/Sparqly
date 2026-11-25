'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { format, startOfDay, subDays } from 'date-fns';
import { ChartNoAxesColumn, RefreshCw } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { PageBody, PageHeader } from '@/components/common/page-header';
import { EmptyState, ErrorState } from '@/components/common/states';
import { useAnalytics, useSyncAnalytics } from '@/lib/api/hooks/account';
import { compactNumber, relativeTime } from '@/lib/format';
import { platformMeta } from '@/lib/platforms';
import { cn } from '@/lib/utils';

const RANGES = { '7': 7, '30': 30, '90': 90 } as const;
type Range = keyof typeof RANGES;

const chartConfig = {
  views: { label: 'Views', color: 'var(--primary)' },
  engagement: { label: 'Engagement', color: 'var(--success)' }
} satisfies ChartConfig;

function Kpi({
  label,
  value,
  hint,
  loading
}: {
  label: string;
  value: string;
  hint?: React.ReactNode;
  loading: boolean;
}) {
  return (
    <div className='bg-card space-y-2 rounded-xl border p-4'>
      <p className='text-muted-foreground text-xs'>{label}</p>
      {loading ? (
        <Skeleton className='h-7 w-16' />
      ) : (
        <p className='tnum text-2xl leading-none font-semibold tracking-tight'>
          {value}
        </p>
      )}
      {hint && !loading && (
        <p className='text-muted-foreground text-xs'>{hint}</p>
      )}
    </div>
  );
}

export function AnalyticsPage() {
  const [range, setRange] = useState<Range>('30');
  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    return {
      startDate: startOfDay(subDays(end, RANGES[range] - 1)).toISOString(),
      // Rounded to the hour so the query key is stable between renders.
      endDate: new Date(
        Math.ceil(end.getTime() / 3_600_000) * 3_600_000
      ).toISOString()
    };
  }, [range]);
  const analytics = useAnalytics(startDate, endDate);
  const sync = useSyncAnalytics();
  const data = analytics.data;
  const loading = analytics.isPending;

  const growth = data?.kpis.growth;
  const totalPlatform =
    data?.platformBreakdown.reduce((sum, p) => sum + p.value, 0) ?? 0;

  return (
    <PageBody>
      <PageHeader
        title='Analytics'
        description={
          data?.lastSyncedAt
            ? `Metrics from your published posts. Last synced ${relativeTime(data.lastSyncedAt)}.`
            : 'Metrics from your published posts.'
        }
        actions={
          <>
            <ToggleGroup
              type='single'
              variant='outline'
              size='sm'
              value={range}
              onValueChange={(v) => v && setRange(v as Range)}
              aria-label='Date range'
            >
              {Object.keys(RANGES).map((r) => (
                <ToggleGroupItem key={r} value={r} className='px-2.5 text-xs'>
                  {r}d
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <Button
              variant='outline'
              size='sm'
              loading={sync.isPending}
              onClick={() =>
                sync.mutate(undefined, {
                  onSuccess: () =>
                    toast.success('Sync started', {
                      description: 'New numbers appear in a minute or two.'
                    })
                })
              }
            >
              {!sync.isPending && <RefreshCw />} Sync now
            </Button>
          </>
        }
      />

      {analytics.isError ? (
        <ErrorState
          error={analytics.error}
          onRetry={() => analytics.refetch()}
        />
      ) : !loading && data && data.kpis.totalPosts === 0 ? (
        <EmptyState
          icon={ChartNoAxesColumn}
          title='No published posts yet'
          description='Once Sparqly publishes for you, views and engagement show up here.'
          action={
            <Button asChild variant='outline'>
              <Link href='/dashboard/projects'>Schedule a post</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
            <Kpi
              label='Views'
              loading={loading}
              value={compactNumber(data?.kpis.views ?? 0)}
              hint={
                growth === null || growth === undefined ? (
                  'No earlier data to compare'
                ) : (
                  <span
                    className={cn(
                      growth >= 0 ? 'text-success' : 'text-destructive'
                    )}
                  >
                    {growth >= 0 ? '+' : ''}
                    {growth.toFixed(1)}% over the period
                  </span>
                )
              }
            />
            <Kpi
              label='Engagement rate'
              loading={loading}
              value={`${(data?.kpis.engagementRate ?? 0).toFixed(1)}%`}
              hint='Likes, comments and shares per view'
            />
            <Kpi
              label='Interactions'
              loading={loading}
              value={compactNumber(
                (data?.kpis.likes ?? 0) +
                  (data?.kpis.comments ?? 0) +
                  (data?.kpis.shares ?? 0)
              )}
              hint={
                data &&
                `${compactNumber(data.kpis.likes)} likes · ${compactNumber(data.kpis.comments)} comments`
              }
            />
            <Kpi
              label='Published posts'
              loading={loading}
              value={String(data?.kpis.totalPosts ?? 0)}
            />
          </div>

          <div className='grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px]'>
            <section className='bg-card space-y-3 rounded-xl border p-4'>
              <div className='flex items-center justify-between'>
                <h2 className='text-[13px] font-medium'>
                  Views and engagement
                </h2>
                <div className='text-muted-foreground flex items-center gap-3 text-xs'>
                  <span className='flex items-center gap-1.5'>
                    <span className='bg-primary size-2 rounded-full' /> Views
                  </span>
                  <span className='flex items-center gap-1.5'>
                    <span className='bg-success size-2 rounded-full' />{' '}
                    Engagement
                  </span>
                </div>
              </div>
              {loading ? (
                <Skeleton className='h-64' />
              ) : (
                <ChartContainer
                  config={chartConfig}
                  className='aspect-auto h-64 w-full'
                >
                  <AreaChart
                    data={data?.timeSeries ?? []}
                    margin={{ left: 0, right: 8, top: 8 }}
                  >
                    <defs>
                      {(['views', 'engagement'] as const).map((key) => (
                        <linearGradient
                          key={key}
                          id={`fill-${key}`}
                          x1='0'
                          y1='0'
                          x2='0'
                          y2='1'
                        >
                          <stop
                            offset='5%'
                            stopColor={`var(--color-${key})`}
                            stopOpacity={0.3}
                          />
                          <stop
                            offset='95%'
                            stopColor={`var(--color-${key})`}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray='3 3' />
                    <XAxis
                      dataKey='date'
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      minTickGap={32}
                      tickFormatter={(v: string) =>
                        format(new Date(v), 'MMM d')
                      }
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={40}
                      tickFormatter={(v: number) => compactNumber(v)}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelFormatter={(v: string) =>
                            format(new Date(v), 'EEE, MMM d')
                          }
                        />
                      }
                    />
                    <Area
                      dataKey='views'
                      type='monotone'
                      stroke='var(--color-views)'
                      strokeWidth={2}
                      fill='url(#fill-views)'
                    />
                    <Area
                      dataKey='engagement'
                      type='monotone'
                      stroke='var(--color-engagement)'
                      strokeWidth={2}
                      fill='url(#fill-engagement)'
                    />
                  </AreaChart>
                </ChartContainer>
              )}
            </section>

            <section className='bg-card space-y-4 rounded-xl border p-4'>
              <h2 className='text-[13px] font-medium'>Views by platform</h2>
              {loading ? (
                <Skeleton className='h-24' />
              ) : !data?.platformBreakdown.length ? (
                <p className='text-muted-foreground text-[13px]'>
                  No data for this period.
                </p>
              ) : (
                <ul className='space-y-3'>
                  {data.platformBreakdown.map((p) => {
                    const meta = platformMeta(p.name.toLowerCase());
                    const share = totalPlatform
                      ? (p.value / totalPlatform) * 100
                      : 0;
                    return (
                      <li key={p.name} className='space-y-1.5'>
                        <div className='flex items-center justify-between text-[13px]'>
                          <span>{meta.label}</span>
                          <span className='tnum text-muted-foreground'>
                            {compactNumber(p.value)} · {share.toFixed(0)}%
                          </span>
                        </div>
                        <div className='bg-secondary h-1.5 overflow-hidden rounded-full'>
                          <div
                            className='h-full rounded-full'
                            style={{
                              width: `${share}%`,
                              background: meta.color
                            }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </PageBody>
  );
}
