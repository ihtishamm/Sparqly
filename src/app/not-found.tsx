import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className='bg-canvas flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center'>
      <p className='text-muted-foreground font-mono text-xs'>404</p>
      <h1 className='text-xl'>This page doesn’t exist</h1>
      <p className='text-muted-foreground max-w-sm'>
        The link may be broken, or the page may have moved.
      </p>
      <Button asChild size='sm'>
        <Link href='/dashboard'>Go to dashboard</Link>
      </Button>
    </main>
  );
}
