'use client';

import { Button } from '@/components/ui/button';
import { useTour } from '../context/tour-context';
import { Icons } from '@/components/icons';

export function TourTriggerButton() {
  const { start } = useTour();
  const Icon = Icons.help;

  return (
    <Button
      variant='ghost'
      size='icon'
      onClick={start}
      data-tour='trigger'
      aria-label='Start product tour'
    >
      <Icon className='size-4' />
    </Button>
  );
}
