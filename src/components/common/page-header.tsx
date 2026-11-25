import { cn } from '@/lib/utils';

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  className
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  eyebrow?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between',
        className
      )}
    >
      <div className='min-w-0 space-y-1'>
        {eyebrow && (
          <div className='text-muted-foreground flex items-center gap-1.5 text-xs'>
            {eyebrow}
          </div>
        )}
        <h1 className='truncate text-xl leading-7'>{title}</h1>
        {description && (
          <p className='text-muted-foreground max-w-2xl text-[13px]'>
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className='flex shrink-0 flex-wrap items-center gap-2'>
          {actions}
        </div>
      )}
    </header>
  );
}

/** Standard padded page body with a max width. */
export function PageBody({
  className,
  wide,
  ...props
}: React.ComponentProps<'div'> & { wide?: boolean }) {
  return (
    <div
      className={cn(
        'mx-auto flex w-full flex-col gap-6 px-4 py-6 md:px-8 md:py-8',
        wide ? 'max-w-[1400px]' : 'max-w-6xl',
        className
      )}
      {...props}
    />
  );
}
