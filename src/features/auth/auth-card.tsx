import { cn } from '@/lib/utils';

export function AuthCard({
  title,
  description,
  children,
  footer,
  className
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-6', className)}>
      <div className='space-y-1.5 text-center'>
        <h1 className='text-xl'>{title}</h1>
        {description && (
          <p className='text-muted-foreground text-[13px]'>{description}</p>
        )}
      </div>
      <div className='bg-card shadow-raised rounded-xl border p-5'>
        {children}
      </div>
      {footer && (
        <div className='text-muted-foreground text-center text-[13px]'>
          {footer}
        </div>
      )}
    </div>
  );
}
