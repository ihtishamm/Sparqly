import Link from 'next/link';
import { Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Shown when the API refuses an action for lack of credits. */
export function OutOfCredits() {
  return (
    <div
      role='alert'
      className='border-warning/30 bg-warning/10 flex items-center gap-3 rounded-lg border px-3 py-2.5 text-[13px]'
    >
      <Coins className='text-warning size-4 shrink-0' aria-hidden />
      <p className='flex-1'>
        You’re out of credits. Top up or change plan to continue.
      </p>
      <Button asChild size='sm' variant='outline'>
        <Link href='/dashboard/billing'>Get credits</Link>
      </Button>
    </div>
  );
}

export function CreditCost({ credits = 1 }: { credits?: number }) {
  return (
    <span className='text-muted-foreground inline-flex items-center gap-1 text-xs'>
      <Coins className='size-3' aria-hidden />
      Uses {credits} credit{credits === 1 ? '' : 's'}
    </span>
  );
}
