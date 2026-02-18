'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type StepperStep = {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
};

type VerticalStepperProps = {
  steps: StepperStep[];
  activeIndex: number;
  loading?: boolean;
  className?: string;
};

export function VerticalStepper({
  steps,
  activeIndex,
  loading = false,
  className
}: VerticalStepperProps) {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {steps.map((step, index) => {
        const isActive = index === activeIndex;
        const isCompleted = index < activeIndex;
        const Icon = step.icon;

        return (
          <div
            key={step.id}
            className={cn(
              'flex gap-4 rounded-2xl border p-4 transition-colors',
              isActive &&
                'border-ring bg-muted/50 ring-ring/30 ring-offset-background ring-2 ring-offset-2',
              isCompleted && 'border-border bg-muted/30',
              !isActive && !isCompleted && 'border-border bg-card'
            )}
          >
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border',
                isActive && 'border-primary bg-primary/10 text-primary',
                isCompleted &&
                  'border-primary bg-primary text-primary-foreground',
                !isActive && !isCompleted && 'border-border bg-muted'
              )}
            >
              {isCompleted ? (
                <svg
                  className='h-5 w-5'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M5 13l4 4L19 7'
                  />
                </svg>
              ) : (
                <Icon className='h-5 w-5' />
              )}
            </div>
            <div className='min-w-0 flex-1 space-y-1'>
              <p className='font-medium'>{step.title}</p>
              <p className='text-muted-foreground text-sm'>
                {step.description}
              </p>
            </div>
            {isActive && loading && (
              <div
                className='border-primary size-5 shrink-0 animate-spin rounded-full border-2 border-t-transparent'
                aria-hidden
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
