'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

function Toaster(props: ToasterProps) {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      theme={(resolvedTheme as ToasterProps['theme']) ?? 'dark'}
      className='toaster group'
      toastOptions={{
        classNames: {
          toast:
            'group toast !rounded-xl !border !border-border !bg-popover !text-popover-foreground !shadow-overlay !text-[13px]',
          description: '!text-muted-foreground',
          actionButton: '!bg-primary !text-primary-foreground !rounded-md',
          cancelButton: '!bg-secondary !text-secondary-foreground !rounded-md'
        }
      }}
      {...props}
    />
  );
}

export { Toaster };
