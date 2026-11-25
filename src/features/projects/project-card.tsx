import Link from 'next/link';
import { CalendarClock, FileText, Film, Sparkles } from 'lucide-react';
import { StatusBadge, STAGE_LABELS } from '@/components/common/status-badge';
import { isJobActive } from '@/lib/api/hooks/projects';
import type { ProjectJob, ProjectSummary } from '@/lib/api/types';
import { hostname, relativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';

export function projectTitle(
  project: Pick<ProjectSummary, 'title' | 'sourceUrl'>
) {
  return (
    project.title?.trim() || hostname(project.sourceUrl) || 'Untitled project'
  );
}

/** One status pill for a job, using the pipeline stage while it runs. */
export function JobStatus({ job }: { job: ProjectJob | null }) {
  if (!job) return null;
  if (job.status === 'processing' && job.stage) {
    return (
      <StatusBadge
        status='processing'
        label={STAGE_LABELS[job.stage] ?? job.stage}
      />
    );
  }
  return <StatusBadge status={job.status} />;
}

function Count({
  icon: Icon,
  value,
  label
}: {
  icon: typeof Film;
  value: number;
  label: string;
}) {
  if (!value) return null;
  return (
    <span className='inline-flex items-center gap-1' title={label}>
      <Icon className='size-3' aria-hidden />
      <span className='tnum'>{value}</span>
      <span className='sr-only'>{label}</span>
    </span>
  );
}

export function ProjectThumb({
  project,
  className
}: {
  project: Pick<ProjectSummary, 'thumbnailUrl' | 'sourceType'>;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'bg-secondary relative flex items-center justify-center overflow-hidden',
        className
      )}
    >
      {project.thumbnailUrl ? (
        // Thumbnails come from arbitrary hosts (YouTube, S3), so no next/image.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={project.thumbnailUrl}
          alt=''
          loading='lazy'
          className='size-full object-cover'
        />
      ) : project.sourceType === 'ai_generated' ? (
        <Sparkles className='text-subtle-foreground size-5' aria-hidden />
      ) : (
        <Film className='text-subtle-foreground size-5' aria-hidden />
      )}
    </div>
  );
}

export function ProjectCard({ project }: { project: ProjectSummary }) {
  const job = project.latestJob;
  const running = isJobActive(job?.status);
  return (
    <Link
      href={`/dashboard/projects/${project.id}`}
      className='group bg-card hover:border-input focus-visible:ring-ring/50 flex flex-col overflow-hidden rounded-xl border transition-colors outline-none focus-visible:ring-2'
    >
      <div className='relative'>
        <ProjectThumb project={project} className='aspect-video' />
        {(running || job?.status === 'failed') && (
          <div className='absolute top-2 left-2'>
            <JobStatus job={job} />
          </div>
        )}
      </div>
      <div className='flex flex-1 flex-col gap-1.5 p-3'>
        <p className='line-clamp-1 font-medium group-hover:underline'>
          {projectTitle(project)}
        </p>
        <div className='text-muted-foreground flex items-center gap-3 text-xs'>
          <span>{relativeTime(project.createdAt)}</span>
          <Count icon={Film} value={project.clipCount} label='clips' />
          <Count
            icon={FileText}
            value={project.documentCount}
            label='documents'
          />
          <Count
            icon={CalendarClock}
            value={project.scheduledCount}
            label='scheduled posts'
          />
        </div>
      </div>
    </Link>
  );
}
