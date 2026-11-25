import { CircleAlert, RotateCcw, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { errorMessage } from '@/lib/api/errors';
import { cn } from '@/lib/utils';

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact
}: {
  icon?: LucideIcon;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed text-center',
        compact ? 'gap-2 px-4 py-8' : 'gap-3 px-6 py-16',
        className
      )}
    >
      {Icon && (
        <div className='bg-secondary text-muted-foreground flex size-9 items-center justify-center rounded-lg border'>
          <Icon className='size-4' aria-hidden />
        </div>
      )}
      <div className='space-y-1'>
        <p className='font-medium'>{title}</p>
        {description && (
          <p className='text-muted-foreground mx-auto max-w-sm text-[13px]'>
            {description}
          </p>
        )}
      </div>
      {action && <div className='mt-1'>{action}</div>}
    </div>
  );
}

export function ErrorState({
  error,
  title = 'Couldn’t load this',
  onRetry,
  className
}: {
  error?: unknown;
  title?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role='alert'
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border px-6 py-12 text-center',
        className
      )}
    >
      <CircleAlert className='text-destructive size-5' aria-hidden />
      <div className='space-y-1'>
        <p className='font-medium'>{title}</p>
        <p className='text-muted-foreground max-w-sm text-[13px]'>
          {errorMessage(error, 'Something went wrong.')}
        </p>
      </div>
      {onRetry && (
        <Button variant='outline' size='sm' onClick={onRetry}>
          <RotateCcw /> Try again
        </Button>
      )}
    </div>
  );
}

/** Inline form-level error, e.g. "Incorrect email or password." */
export function FormAlert({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div
      role='alert'
      className='border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg border px-3 py-2 text-[13px]'
    >
      <CircleAlert className='mt-0.5 size-3.5 shrink-0' aria-hidden />
      <span>{message}</span>
    </div>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className='divide-y rounded-xl border' aria-busy='true'>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className='flex items-center gap-3 px-4 py-3'>
          <Skeleton className='size-8 rounded-lg' />
          <div className='flex-1 space-y-1.5'>
            <Skeleton className='h-3.5 w-1/3' />
            <Skeleton className='h-3 w-1/5' />
          </div>
        </div>
      ))}
    </div>
  );
}

export function GridSkeleton({
  count = 6,
  className
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn('grid gap-3 sm:grid-cols-2 lg:grid-cols-3', className)}
      aria-busy='true'
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className='overflow-hidden rounded-xl border'>
          <Skeleton className='aspect-video rounded-none' />
          <div className='space-y-1.5 p-3'>
            <Skeleton className='h-3.5 w-2/3' />
            <Skeleton className='h-3 w-1/3' />
          </div>
        </div>
      ))}
    </div>
  );
}
