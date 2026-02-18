'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { useTour } from '../context/tour-context';
import { cn } from '@/lib/utils';

export function TourOverlay() {
  const { steps, currentIndex, isActive, next, skip } = useTour();
  const [targetRect, setTargetRect] = React.useState<DOMRect | null>(null);
  const step = steps[currentIndex];

  React.useEffect(() => {
    if (!isActive || !step?.target || typeof document === 'undefined') {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(step.target);
    if (!el) {
      setTargetRect(null);
      return;
    }
    const update = () => setTargetRect(el.getBoundingClientRect());
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    window.addEventListener('scroll', update, true);
    return () => {
      obs.disconnect();
      window.removeEventListener('scroll', update, true);
    };
  }, [isActive, step?.target, currentIndex]);

  if (!isActive || !step) return null;

  const isLast = currentIndex === steps.length - 1;

  const overlay = (
    <div
      className='fixed inset-0 z-[100]'
      aria-modal
      aria-label='Product tour'
      role='dialog'
    >
      <div
        className='bg-background/80 absolute inset-0 backdrop-blur-sm'
        onClick={skip}
        aria-hidden
      />
      {targetRect && (
        <div
          className='ring-ring ring-offset-background pointer-events-none absolute rounded-2xl ring-2 ring-offset-2'
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16
          }}
        />
      )}
      <div
        className='border-border bg-card fixed z-10 max-w-sm rounded-2xl border p-4 shadow-lg'
        style={
          targetRect
            ? {
                top: targetRect.bottom + 16,
                left: Math.min(
                  Math.max(targetRect.left, 16),
                  typeof window !== 'undefined' ? window.innerWidth - 336 : 0
                )
              }
            : {
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
              }
        }
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className='font-semibold'>{step.title}</h3>
        <p className='text-muted-foreground mt-1 text-sm'>{step.description}</p>
        <div className='mt-4 flex items-center justify-between gap-4'>
          <div className='flex gap-1'>
            {steps.map((_, i) => (
              <span
                key={i}
                className={cn(
                  'size-2 rounded-full',
                  i === currentIndex ? 'bg-primary' : 'bg-muted'
                )}
                aria-hidden
              />
            ))}
          </div>
          <div className='flex gap-2'>
            <Button variant='ghost' size='sm' onClick={skip}>
              Skip
            </Button>
            <Button size='sm' onClick={next}>
              {isLast ? 'Finish' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(overlay, document.body);
  }
  return null;
}
