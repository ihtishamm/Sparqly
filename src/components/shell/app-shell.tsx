'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger
} from '@/components/ui/sidebar';
import { useMe } from '@/lib/api/hooks/auth';
import { useAuthStore } from '@/store/auth-store';
import { AppSidebar, Logo } from './app-sidebar';

/**
 * Waits for the persisted session to load from localStorage. Starts false on
 * both server and client (the persist API doesn't exist on the server), so
 * the first client render matches the server HTML.
 */
function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const persist = useAuthStore.persist;
    if (!persist || persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return persist.onFinishHydration(() => setHydrated(true));
  }, []);
  return hydrated;
}

export function AppShell({
  children,
  defaultOpen
}: {
  children: React.ReactNode;
  defaultOpen: boolean;
}) {
  const hydrated = useHydrated();
  const token = useAuthStore((s) => s.token);
  const pathname = usePathname();
  useMe();

  // The session cookie outlived the stored tokens (cleared storage, another
  // browser profile): send them to sign in rather than failing every request.
  useEffect(() => {
    if (hydrated && !token) {
      useAuthStore.getState().clear();
      window.location.assign(
        `/auth/sign-in?callbackUrl=${encodeURIComponent(pathname)}`
      );
    }
  }, [hydrated, token, pathname]);

  if (!hydrated || !token) {
    return <div className='bg-sidebar h-svh' aria-busy='true' />;
  }

  return (
    <SidebarProvider defaultOpen={defaultOpen} className='bg-sidebar h-svh'>
      <a
        href='#main'
        className='bg-primary text-primary-foreground sr-only z-50 rounded-md px-3 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2'
      >
        Skip to content
      </a>
      <AppSidebar />
      <SidebarInset className='min-h-0'>
        <div className='flex h-11 shrink-0 items-center gap-2 border-b px-3 md:hidden'>
          <SidebarTrigger aria-label='Open navigation' />
          <Logo />
        </div>
        <div
          id='main'
          className='scrollbar-thin min-h-0 flex-1 overflow-y-auto'
        >
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
