'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { addHours, format, startOfHour } from 'date-fns';
import { CircleAlert, CircleCheck, Plug } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CreditCost, OutOfCredits } from '@/components/common/credits-notice';
import { FormAlert } from '@/components/common/states';
import { PlatformMark } from '@/components/common/platform-mark';
import { ApiError, errorMessage } from '@/lib/api/errors';
import { useAccounts, useCreatePost } from '@/lib/api/hooks/publishing';
import { platformMeta, PLATFORM_ORDER } from '@/lib/platforms';
import { cn } from '@/lib/utils';

export type ScheduleTarget = {
  contentId: string;
  variantId: string;
  versionId: string;
  title: string;
  /** Video clips go to any platform; text only where it's supported. */
  kind: 'video' | 'text';
  /** Pre-fills the caption for text posts. */
  text?: string;
};

type Result = { accountId: string; ok: boolean; message?: string };

const LOCAL_FORMAT = "yyyy-MM-dd'T'HH:mm";

function defaultTime() {
  return format(addHours(startOfHour(new Date()), 1), LOCAL_FORMAT);
}

function parseHashtags(value: string) {
  return value
    .split(/[\s,]+/)
    .map((tag) => tag.replace(/^#+/, '').trim())
    .filter(Boolean)
    .slice(0, 30);
}

export function ScheduleDialog({
  target,
  onOpenChange
}: {
  target: ScheduleTarget | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        {target && (
          <ScheduleForm
            key={target.versionId}
            target={target}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ScheduleForm({
  target,
  onDone
}: {
  target: ScheduleTarget;
  onDone: () => void;
}) {
  const accounts = useAccounts();
  const createPost = useCreatePost();
  const [selected, setSelected] = useState<string[]>([]);
  const [when, setWhen] = useState(defaultTime);
  const [title, setTitle] = useState(target.title);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [outOfCredits, setOutOfCredits] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [pending, setPending] = useState(false);

  const usable = useMemo(
    () =>
      (accounts.data?.data ?? [])
        .filter((a) => !a.needsReconnect)
        .filter(
          (a) =>
            target.kind === 'video' || platformMeta(a.platform).supportsText
        )
        .sort(
          (a, b) =>
            PLATFORM_ORDER.indexOf(a.platform) -
            PLATFORM_ORDER.indexOf(b.platform)
        ),
    [accounts.data, target.kind]
  );
  const okIds = new Set(results.filter((r) => r.ok).map((r) => r.accountId));
  const hasYouTube = usable.some(
    (a) => selected.includes(a.id) && a.platform === 'youtube'
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOutOfCredits(false);
    const scheduledAt = new Date(when);
    if (!selected.length) return setError('Pick at least one account.');
    if (Number.isNaN(scheduledAt.getTime()))
      return setError('Pick a date and time.');
    if (scheduledAt.getTime() < Date.now() + 60_000) {
      return setError('Pick a time at least a minute from now.');
    }

    setPending(true);
    const next: Result[] = [...results.filter((r) => r.ok)];
    // One post per account, so each charge and failure is independent.
    for (const accountId of selected.filter((id) => !okIds.has(id))) {
      try {
        await createPost.mutateAsync({
          platformAccountId: accountId,
          contentId: target.contentId,
          variantId: target.variantId,
          versionId: target.versionId,
          scheduledAt,
          metadata: {
            title: title.trim() || undefined,
            caption: caption.trim() || undefined,
            hashtags: parseHashtags(hashtags)
          }
        });
        next.push({ accountId, ok: true });
      } catch (err) {
        if (err instanceof ApiError && err.isInsufficientCredits) {
          setOutOfCredits(true);
          next.push({ accountId, ok: false, message: 'Not enough credits' });
          break;
        }
        next.push({ accountId, ok: false, message: errorMessage(err) });
      }
    }
    setResults(next);
    setPending(false);

    const failed = next.filter((r) => !r.ok);
    if (!failed.length) {
      toast.success(
        next.length === 1 ? 'Post scheduled' : `${next.length} posts scheduled`,
        {
          description: format(scheduledAt, "EEE, MMM d 'at' h:mm a"),
          action: {
            label: 'View',
            onClick: () => window.location.assign('/dashboard/calendar')
          }
        }
      );
      onDone();
    }
  }

  return (
    <form onSubmit={submit} noValidate className='space-y-5'>
      <DialogHeader>
        <DialogTitle>
          Schedule {target.kind === 'video' ? 'clip' : 'post'}
        </DialogTitle>
        <DialogDescription className='truncate'>
          {target.title}
        </DialogDescription>
      </DialogHeader>

      {outOfCredits && <OutOfCredits />}
      <FormAlert message={error ?? undefined} />

      <fieldset className='space-y-2'>
        <legend className='mb-2 text-sm font-medium'>Publish to</legend>
        {accounts.isPending ? (
          <p className='text-muted-foreground text-[13px]'>Loading accounts…</p>
        ) : usable.length === 0 ? (
          <div className='flex items-center gap-3 rounded-lg border border-dashed p-3 text-[13px]'>
            <Plug
              className='text-muted-foreground size-4 shrink-0'
              aria-hidden
            />
            <p className='text-muted-foreground flex-1'>
              {target.kind === 'text'
                ? 'Connect a LinkedIn account to publish text posts.'
                : 'Connect an account to publish clips.'}
            </p>
            <Button asChild size='sm' variant='outline'>
              <Link href='/dashboard/connections'>Connect</Link>
            </Button>
          </div>
        ) : (
          <div className='grid gap-1.5'>
            {usable.map((account) => {
              const result = results.find((r) => r.accountId === account.id);
              const done = result?.ok;
              return (
                <label
                  key={account.id}
                  className={cn(
                    'hover:bg-accent/60 flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2',
                    selected.includes(account.id) &&
                      'border-primary/50 bg-primary/5',
                    done && 'pointer-events-none opacity-70'
                  )}
                >
                  <Checkbox
                    checked={selected.includes(account.id)}
                    disabled={done}
                    onCheckedChange={(on) =>
                      setSelected((ids) =>
                        on
                          ? [...ids, account.id]
                          : ids.filter((id) => id !== account.id)
                      )
                    }
                  />
                  <PlatformMark platform={account.platform} size='sm' />
                  <span className='min-w-0 flex-1 truncate text-[13px]'>
                    {account.accountName ||
                      platformMeta(account.platform).label}
                  </span>
                  {result &&
                    (result.ok ? (
                      <span className='text-success flex items-center gap-1 text-xs'>
                        <CircleCheck className='size-3.5' aria-hidden />{' '}
                        Scheduled
                      </span>
                    ) : (
                      <span
                        className='text-destructive flex max-w-[50%] items-center gap-1 truncate text-xs'
                        title={result.message}
                      >
                        <CircleAlert
                          className='size-3.5 shrink-0'
                          aria-hidden
                        />
                        {result.message}
                      </span>
                    ))}
                </label>
              );
            })}
          </div>
        )}
      </fieldset>

      <div className='grid gap-4 sm:grid-cols-2'>
        <div className='space-y-1.5'>
          <Label htmlFor='when'>Date and time</Label>
          <Input
            id='when'
            type='datetime-local'
            value={when}
            min={format(new Date(), LOCAL_FORMAT)}
            onChange={(e) => setWhen(e.target.value)}
            className='dark:[color-scheme:dark]'
          />
        </div>
        <div className='space-y-1.5'>
          <Label htmlFor='title'>Title</Label>
          <Input
            id='title'
            value={title}
            maxLength={100}
            onChange={(e) => setTitle(e.target.value)}
          />
          {hasYouTube && (
            <p className='text-muted-foreground text-xs'>
              Used as the YouTube title.
            </p>
          )}
        </div>
      </div>

      {target.kind === 'video' ? (
        <div className='space-y-1.5'>
          <Label htmlFor='caption'>Caption</Label>
          <Textarea
            id='caption'
            rows={3}
            maxLength={2200}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder='What’s this clip about?'
          />
        </div>
      ) : (
        <p className='text-muted-foreground bg-secondary rounded-lg px-3 py-2 text-xs'>
          The post text is the current saved version of this document.
        </p>
      )}

      <div className='space-y-1.5'>
        <Label htmlFor='hashtags'>
          Hashtags{' '}
          <span className='text-muted-foreground font-normal'>(optional)</span>
        </Label>
        <Input
          id='hashtags'
          value={hashtags}
          onChange={(e) => setHashtags(e.target.value)}
          placeholder='marketing, video, growth'
        />
      </div>

      <DialogFooter className='items-center sm:justify-between'>
        <CreditCost
          credits={Math.max(1, selected.filter((id) => !okIds.has(id)).length)}
        />
        <div className='flex gap-2'>
          <Button
            type='button'
            variant='outline'
            onClick={onDone}
            disabled={pending}
          >
            {okIds.size ? 'Done' : 'Cancel'}
          </Button>
          <Button type='submit' loading={pending} disabled={!usable.length}>
            {results.some((r) => !r.ok) ? 'Retry failed' : 'Schedule'}
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}
