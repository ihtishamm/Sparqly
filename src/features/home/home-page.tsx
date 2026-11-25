'use client';

import Link from 'next/link';
import {
  ArrowRight,
  CalendarClock,
  Coins,
  FolderOpen,
  LoaderCircle,
  Scissors,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageBody, PageHeader } from '@/components/common/page-header';
import {
  EmptyState,
  ErrorState,
  GridSkeleton,
  ListSkeleton
} from '@/components/common/states';
import { PlatformMark } from '@/components/common/platform-mark';
import { ActivityItem } from '@/components/shell/notifications';
import { useActivity, useWallet } from '@/lib/api/hooks/account';
import { useProjects, isJobActive } from '@/lib/api/hooks/projects';
import { useUpcomingPosts } from '@/lib/api/hooks/publishing';
import { dateTime, pluralize, shortDate } from '@/lib/format';
import { useAuthStore } from '@/store/auth-store';
import { ProjectCard, projectTitle } from '@/features/projects/project-card';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function Section({
  title,
  href,
  children
}: {
  title: string;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <section className='space-y-3'>
      <div className='flex items-center justify-between'>
        <h2 className='text-[13px] font-medium'>{title}</h2>
        {href && (
          <Button asChild variant='ghost' size='xs'>
            <Link href={href}>
              View all <ArrowRight />
            </Link>
          </Button>
        )}
      </div>
      {children}
    </section>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
  href
}: {
  icon: typeof Coins;
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className='bg-card hover:border-input flex flex-col gap-3 rounded-xl border p-4 transition-colors'
    >
      <span className='text-muted-foreground flex items-center gap-2 text-xs'>
        <Icon className='size-3.5' aria-hidden /> {label}
      </span>
      <span className='tnum text-2xl leading-none font-semibold tracking-tight'>
        {value}
      </span>
      {hint && <span className='text-muted-foreground text-xs'>{hint}</span>}
    </Link>
  );
}

export function HomePage() {
  const user = useAuthStore((s) => s.user);
  const wallet = useWallet();
  const projects = useProjects();
  const upcoming = useUpcomingPosts(5);
  const activity = useActivity(8);

  const recent = projects.data?.pages[0]?.data.slice(0, 6) ?? [];
  const running = recent.filter((p) => isJobActive(p.latestJob?.status));
  const firstName = user?.fullName?.split(' ')[0];

  return (
    <PageBody>
      <PageHeader
        title={firstName ? `${greeting()}, ${firstName}` : greeting()}
        description='Here’s what’s happening with your content.'
        actions={
          <>
            <Button asChild variant='outline'>
              <Link href='/dashboard/studio'>
                <Sparkles /> Generate
              </Link>
            </Button>
            <Button asChild>
              <Link href='/dashboard/repurpose'>
                <Scissors /> Repurpose a video
              </Link>
            </Button>
          </>
        }
      />

      <div className='grid gap-3 sm:grid-cols-3'>
        <Stat
          icon={Coins}
          label='Credits'
          href='/dashboard/billing'
          value={
            wallet.data ? (
              wallet.data.balance
            ) : (
              <Skeleton className='h-6 w-12' />
            )
          }
          hint={
            wallet.data?.currentPeriodEnd
              ? `Renews ${shortDate(wallet.data.currentPeriodEnd)}`
              : 'Each run, post or export uses 1 credit'
          }
        />
        <Stat
          icon={LoaderCircle}
          label='Running'
          href='/dashboard/projects'
          value={
            projects.isPending ? (
              <Skeleton className='h-6 w-8' />
            ) : (
              running.length
            )
          }
          hint={
            running.length ? projectTitle(running[0]) : 'Nothing in progress'
          }
        />
        <Stat
          icon={CalendarClock}
          label='Scheduled'
          href='/dashboard/calendar'
          value={
            upcoming.isPending ? (
              <Skeleton className='h-6 w-8' />
            ) : (
              `${upcoming.data?.data.length ?? 0}${upcoming.data?.hasNextPage ? '+' : ''}`
            )
          }
          hint={
            upcoming.data?.data[0]
              ? `Next: ${dateTime(upcoming.data.data[0].scheduledAt)}`
              : 'No posts coming up'
          }
        />
      </div>

      <div className='grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]'>
        <Section title='Recent projects' href='/dashboard/projects'>
          {projects.isPending ? (
            <GridSkeleton count={4} className='lg:grid-cols-2' />
          ) : projects.isError ? (
            <ErrorState
              error={projects.error}
              onRetry={() => projects.refetch()}
            />
          ) : recent.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title='No projects yet'
              description='Paste a video link and Sparqly cuts clips and writes posts from it.'
              action={
                <Button asChild>
                  <Link href='/dashboard/repurpose'>
                    Repurpose your first video
                  </Link>
                </Button>
              }
            />
          ) : (
            <div className='grid gap-3 sm:grid-cols-2'>
              {recent.slice(0, 4).map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </Section>

        <div className='space-y-8'>
          <Section title='Coming up' href='/dashboard/calendar'>
            {upcoming.isPending ? (
              <ListSkeleton rows={3} />
            ) : !upcoming.data?.data.length ? (
              <EmptyState
                compact
                icon={CalendarClock}
                title='Nothing scheduled'
                description='Schedule clips and posts from a project.'
              />
            ) : (
              <ul className='divide-y rounded-xl border'>
                {upcoming.data.data.map((post) => (
                  <li
                    key={post.id}
                    className='flex items-center gap-3 px-3 py-2.5'
                  >
                    <PlatformMark
                      platform={post.platformAccount.platform}
                      size='sm'
                    />
                    <div className='min-w-0 flex-1'>
                      <p className='truncate text-[13px]'>
                        {post.metadata?.title ||
                          post.contentVariant?.title ||
                          post.metadata?.caption ||
                          'Untitled post'}
                      </p>
                      <p className='text-muted-foreground text-xs'>
                        {dateTime(post.scheduledAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title='Activity'>
            {activity.isPending ? (
              <ListSkeleton rows={3} />
            ) : !activity.data?.data.length ? (
              <p className='text-muted-foreground text-[13px]'>
                No activity yet.
              </p>
            ) : (
              <div className='-mx-2'>
                {activity.data.data.map((item) => (
                  <ActivityItem key={item.id} activity={item} />
                ))}
              </div>
            )}
            {activity.data && activity.data.data.length >= 8 && (
              <p className='text-muted-foreground text-xs'>
                Showing the latest {pluralize(8, 'event')}.
              </p>
            )}
          </Section>
        </div>
      </div>
    </PageBody>
  );
}
