import {
  CalendarDays,
  ChartNoAxesColumn,
  CreditCard,
  FolderOpen,
  House,
  Plug,
  Scissors,
  Settings,
  Sparkles,
  type LucideIcon
} from 'lucide-react';

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Also active on nested routes (e.g. /projects/[id]). */
  matchPrefix?: boolean;
};

export type NavGroup = { label?: string; items: NavItem[] };

export const NAV: NavGroup[] = [
  {
    items: [{ title: 'Home', href: '/dashboard', icon: House }]
  },
  {
    label: 'Create',
    items: [
      { title: 'Repurpose', href: '/dashboard/repurpose', icon: Scissors },
      { title: 'Studio', href: '/dashboard/studio', icon: Sparkles }
    ]
  },
  {
    label: 'Library',
    items: [
      {
        title: 'Projects',
        href: '/dashboard/projects',
        icon: FolderOpen,
        matchPrefix: true
      }
    ]
  },
  {
    label: 'Publish',
    items: [
      { title: 'Calendar', href: '/dashboard/calendar', icon: CalendarDays },
      { title: 'Connections', href: '/dashboard/connections', icon: Plug }
    ]
  },
  {
    label: 'Insights',
    items: [
      {
        title: 'Analytics',
        href: '/dashboard/analytics',
        icon: ChartNoAxesColumn
      }
    ]
  },
  {
    label: 'Account',
    items: [
      { title: 'Billing', href: '/dashboard/billing', icon: CreditCard },
      { title: 'Settings', href: '/dashboard/settings', icon: Settings }
    ]
  }
];

export function isActive(pathname: string, item: NavItem) {
  if (item.href === '/dashboard') return pathname === '/dashboard';
  return item.matchPrefix
    ? pathname === item.href || pathname.startsWith(`${item.href}/`)
    : pathname === item.href;
}
