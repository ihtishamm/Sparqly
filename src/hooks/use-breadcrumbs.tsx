'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

type BreadcrumbItem = {
  title: string;
  link: string;
};

// This allows to add custom title as well
const routeMapping: Record<string, BreadcrumbItem[]> = {
  '/dashboard': [{ title: 'Dashboard', link: '/dashboard' }],
  '/dashboard/repurpose': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Repurpose', link: '/dashboard/repurpose' }
  ],
  '/dashboard/create': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Create', link: '/dashboard/create' }
  ],
  '/dashboard/content': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Content', link: '/dashboard/content' }
  ],
  '/dashboard/analytics': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Analytics', link: '/dashboard/analytics' }
  ],
  '/dashboard/subscription': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Subscription', link: '/dashboard/subscription' }
  ],
  '/dashboard/connections': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Connections', link: '/dashboard/connections' }
  ],
  '/dashboard/profile': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Profile', link: '/dashboard/profile' }
  ]
};

export function useBreadcrumbs() {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    // Check if we have a custom mapping for this exact path
    if (routeMapping[pathname]) {
      return routeMapping[pathname];
    }

    // If no exact match, fall back to generating breadcrumbs from the path
    const segments = pathname.split('/').filter(Boolean);
    return segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join('/')}`;
      return {
        title: segment.charAt(0).toUpperCase() + segment.slice(1),
        link: path
      };
    });
  }, [pathname]);

  return breadcrumbs;
}
