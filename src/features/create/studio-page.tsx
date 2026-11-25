'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  FileText,
  Image as ImageIcon,
  Sparkles,
  Video
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { PageBody, PageHeader } from '@/components/common/page-header';
import {
  EmptyState,
  FormAlert,
  ListSkeleton
} from '@/components/common/states';
import { CreditCost, OutOfCredits } from '@/components/common/credits-notice';
import { StatusBadge, STAGE_LABELS } from '@/components/common/status-badge';
import { ApiError, errorMessage } from '@/lib/api/errors';
import {
  useJobs,
  useStartGeneration,
  type StudioJobType
} from '@/lib/api/hooks/jobs';
import type { AiJob } from '@/lib/api/types';
import { relativeTime } from '@/lib/format';

const KINDS: Array<{
  value: StudioJobType;
  label: string;
  icon: typeof Video;
  placeholder: string;
}> = [
  {
    value: 'video_generation',
    label: 'Video',
    icon: Video,
    placeholder:
      'A 30-second explainer on why compound interest matters, with upbeat narration…'
  },
  {
    value: 'image_generation',
    label: 'Image',
    icon: ImageIcon,
    placeholder:
      'A minimal flat illustration of a rocket made of paper, on a dark background…'
  },
  {
    value: 'blog_generation',
    label: 'Blog post',
    icon: FileText,
    placeholder:
      'A practical guide to repurposing podcasts for LinkedIn, for small agencies…'
  }
];

const KIND_LABEL: Record<string, string> = {
  video_generation: 'Video',
  image_generation: 'Image',
  blog_generation: 'Blog post'
};

function JobRow({ job }: { job: AiJob }) {
  const prompt =
    typeof job.input?.prompt === 'string' ? job.input.prompt : null;
  const title =
    job.content?.title ||
    (typeof job.input?.title === 'string' && job.input.title) ||
    prompt;
  const running = job.status === 'processing' && job.stage;
  return (
    <li className='flex items-center gap-3 px-4 py-3'>
      <div className='min-w-0 flex-1'>
        <p className='truncate text-[13px] font-medium'>
          {title || 'Untitled'}
        </p>
        <p className='text-muted-foreground truncate text-xs'>
          {KIND_LABEL[job.jobType] ?? job.jobType} ·{' '}
          {relativeTime(job.createdAt)}
          {job.status === 'failed' && job.errorMessage
            ? ` · ${job.errorMessage}`
            : ''}
        </p>
      </div>
      <StatusBadge
        status={job.status}
        label={running ? (STAGE_LABELS[job.stage!] ?? undefined) : undefined}
      />
      {job.status === 'completed' && job.content?.id && (
        <Button asChild variant='outline' size='sm'>
          <Link href={`/dashboard/projects/${job.content.id}`}>
            Open <ArrowRight />
          </Link>
        </Button>
      )}
    </li>
  );
}

export function StudioPage() {
  const [kind, setKind] = useState<StudioJobType>('video_generation');
  const [prompt, setPrompt] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [outOfCredits, setOutOfCredits] = useState(false);
  const start = useStartGeneration();
  const jobs = useJobs(20);
  const studioJobs =
    jobs.data?.data.filter((j) => j.jobType in KIND_LABEL) ?? [];
  const current = KINDS.find((k) => k.value === kind)!;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOutOfCredits(false);
    if (prompt.trim().length < 10) {
      setError('Describe what you want in a sentence or two.');
      return;
    }
    try {
      await start.mutateAsync({
        jobType: kind,
        prompt: prompt.trim(),
        title: title.trim() || undefined
      });
      setPrompt('');
      setTitle('');
    } catch (err) {
      if (err instanceof ApiError && err.isInsufficientCredits)
        setOutOfCredits(true);
      else setError(errorMessage(err));
    }
  }

  return (
    <PageBody className='max-w-3xl'>
      <PageHeader
        title='Studio'
        description='Generate a video, image or article from a prompt. Results open as a project you can edit and schedule.'
      />

      <form
        onSubmit={submit}
        className='bg-card space-y-4 rounded-xl border p-4'
        noValidate
      >
        {outOfCredits && <OutOfCredits />}
        <FormAlert message={error ?? undefined} />
        <ToggleGroup
          type='single'
          variant='outline'
          value={kind}
          onValueChange={(v) => v && setKind(v as StudioJobType)}
          aria-label='What to generate'
        >
          {KINDS.map((k) => (
            <ToggleGroupItem
              key={k.value}
              value={k.value}
              className='gap-1.5 px-3'
            >
              <k.icon className='size-3.5' aria-hidden /> {k.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className='space-y-1.5'>
          <Label htmlFor='prompt'>Prompt</Label>
          <Textarea
            id='prompt'
            rows={5}
            maxLength={2000}
            value={prompt}
            placeholder={current.placeholder}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.currentTarget.form?.requestSubmit();
              }
            }}
          />
        </div>
        <div className='space-y-1.5'>
          <Label htmlFor='title'>
            Title{' '}
            <span className='text-muted-foreground font-normal'>
              (optional)
            </span>
          </Label>
          <Input
            id='title'
            value={title}
            maxLength={255}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className='flex items-center justify-between gap-3'>
          <CreditCost />
          <Button type='submit' loading={start.isPending}>
            <Sparkles /> Generate
          </Button>
        </div>
      </form>

      <section className='space-y-3'>
        <h2 className='text-[13px] font-medium'>Recent generations</h2>
        {jobs.isPending ? (
          <ListSkeleton rows={3} />
        ) : studioJobs.length === 0 ? (
          <EmptyState
            compact
            icon={Sparkles}
            title='Nothing generated yet'
            description='Your generations appear here while they run.'
          />
        ) : (
          <ul className='divide-y rounded-xl border'>
            {studioJobs.map((job) => (
              <JobRow key={job.id} job={job} />
            ))}
          </ul>
        )}
      </section>
    </PageBody>
  );
}
