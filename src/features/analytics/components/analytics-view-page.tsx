'use client';

import * as React from 'react';
import PageContainer from '@/components/layout/page-container';
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent
} from '@/components/ui/glass-card';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { useAnalytics } from '../api/analytics';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const chartConfig = {
  views: {
    label: 'Views',
    color: 'var(--chart-1)'
  },
  engagement: {
    label: 'Engagement',
    color: 'var(--chart-2)'
  },
  instagram: { label: 'Instagram', color: 'var(--chart-1)' },
  twitter: { label: 'Twitter', color: 'var(--chart-2)' },
  linkedin: { label: 'LinkedIn', color: 'var(--chart-3)' },
  tiktok: { label: 'TikTok', color: 'var(--chart-4)' }
};

export default function AnalyticsViewPage() {
  const { useGetOverview } = useAnalytics();
  const { data, isLoading } = useGetOverview();

  if (isLoading) {
    return (
      <PageContainer scrollable={true}>
        <div className='flex flex-1 flex-col gap-6'>
          <Skeleton className='h-10 w-48' />
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className='h-24 rounded-2xl' />
            ))}
          </div>
          <Skeleton className='h-[400px] rounded-2xl' />
        </div>
      </PageContainer>
    );
  }

  const kpis = data?.kpis || {
    totalPosts: 0,
    views: 0,
    engagementRate: 0,
    growth: 0
  };
  const timeSeries = data?.timeSeries || [];
  const platformBreakdown = data?.platformBreakdown || [];

  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col gap-6'>
        <header className='space-y-2'>
          <h1 className='text-3xl font-bold tracking-tight md:text-4xl'>
            Analytics
          </h1>
          <p className='text-muted-foreground'>
            Track performance and engagement across your content.
          </p>
        </header>

        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <GlassCard className='rounded-2xl'>
            <GlassCardHeader>
              <GlassCardDescription>Total Posts</GlassCardDescription>
              <GlassCardTitle className='text-2xl'>
                <AnimatedCounter value={kpis.totalPosts} />
              </GlassCardTitle>
            </GlassCardHeader>
          </GlassCard>
          <GlassCard className='rounded-2xl'>
            <GlassCardHeader>
              <GlassCardDescription>Views</GlassCardDescription>
              <GlassCardTitle className='text-2xl'>
                <AnimatedCounter value={kpis.views} />
              </GlassCardTitle>
            </GlassCardHeader>
          </GlassCard>
          <GlassCard className='rounded-2xl'>
            <GlassCardHeader>
              <GlassCardDescription>Engagement Rate</GlassCardDescription>
              <GlassCardTitle className='text-2xl'>
                <AnimatedCounter
                  value={kpis.engagementRate}
                  suffix='%'
                  decimals={1}
                />
              </GlassCardTitle>
            </GlassCardHeader>
          </GlassCard>
          <GlassCard className='rounded-2xl'>
            <GlassCardHeader>
              <GlassCardDescription>Growth</GlassCardDescription>
              <GlassCardTitle className='text-2xl'>
                <AnimatedCounter value={kpis.growth} suffix='%' decimals={1} />
              </GlassCardTitle>
            </GlassCardHeader>
          </GlassCard>
        </div>

        <GlassCard className='rounded-2xl'>
          <GlassCardHeader>
            <GlassCardTitle>Views over time</GlassCardTitle>
            <GlassCardDescription>Last 30 days</GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <ChartContainer config={chartConfig} className='h-[280px] w-full'>
              <LineChart
                data={timeSeries}
                margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
              >
                <CartesianGrid
                  strokeDasharray='3 3'
                  className='stroke-border/50'
                  vertical={false}
                />
                <XAxis
                  dataKey='date'
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => format(new Date(v), 'MMM dd')}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type='monotone'
                  dataKey='views'
                  stroke='var(--chart-1)'
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </GlassCardContent>
        </GlassCard>

        <div className='grid gap-6 lg:grid-cols-2'>
          <GlassCard className='rounded-2xl'>
            <GlassCardHeader>
              <GlassCardTitle>Platform breakdown</GlassCardTitle>
              <GlassCardDescription>
                Distribution by platform
              </GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent>
              <ChartContainer
                config={chartConfig}
                className='mx-auto h-[240px] w-full max-w-[280px]'
              >
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={platformBreakdown}
                    dataKey='value'
                    nameKey='name'
                    innerRadius={60}
                    strokeWidth={0}
                  >
                    {platformBreakdown.map((_, i) => (
                      <Cell key={i} fill={platformBreakdown[i].color} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </GlassCardContent>
          </GlassCard>

          <GlassCard className='rounded-2xl'>
            <GlassCardHeader>
              <GlassCardTitle>Platform Performance</GlassCardTitle>
              <GlassCardDescription>
                Engagement by platform
              </GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent>
              <ul className='space-y-4'>
                {platformBreakdown.map((platform, i) => (
                  <li
                    key={platform.name}
                    className='border-border flex items-center justify-between border-b pb-4 last:border-0 last:pb-0'
                  >
                    <div className='flex items-center gap-4'>
                      <span className='text-muted-foreground w-6 text-sm'>
                        {i + 1}
                      </span>
                      <span className='font-medium'>{platform.name}</span>
                    </div>
                    <div className='text-muted-foreground text-right text-sm'>
                      <span className='text-foreground font-medium'>
                        {platform.value.toLocaleString()}
                      </span>{' '}
                      views
                    </div>
                  </li>
                ))}
              </ul>
            </GlassCardContent>
          </GlassCard>
        </div>
      </div>
    </PageContainer>
  );
}
