import * as React from 'react';

import { cn } from '@/lib/utils';

export const fieldClasses =
  'w-full min-w-0 rounded-lg border border-input bg-card text-[13px] text-foreground placeholder:text-subtle-foreground transition-[border-color,box-shadow] outline-none hover:border-[color-mix(in_srgb,var(--input)_60%,var(--foreground)_15%)] focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-[#121315]';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot='input'
      className={cn(
        fieldClasses,
        'h-8 px-2.5 file:mr-2 file:border-0 file:bg-transparent file:text-[13px] file:font-medium',
        className
      )}
      {...props}
    />
  );
}

export { Input };
