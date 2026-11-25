import Link from 'next/link';
import { Logo } from '@/components/shell/app-sidebar';

export default function AuthLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='bg-canvas relative flex min-h-svh flex-col'>
      <div
        aria-hidden
        className='pointer-events-none absolute inset-x-0 top-0 h-80 opacity-60 [background:radial-gradient(60%_100%_at_50%_0%,color-mix(in_srgb,var(--primary)_18%,transparent),transparent)]'
      />
      <header className='relative px-6 py-5'>
        <Link href='/' aria-label='Sparqly home'>
          <Logo />
        </Link>
      </header>
      <main className='relative flex flex-1 items-start justify-center px-4 pt-[8vh] pb-16'>
        <div className='w-full max-w-[380px]'>{children}</div>
      </main>
    </div>
  );
}
