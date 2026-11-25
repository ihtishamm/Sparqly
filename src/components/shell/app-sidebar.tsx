'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useWallet } from '@/lib/api/hooks/account';
import { NAV, isActive } from './nav';
import { Notifications } from './notifications';
import { UserMenu } from './user-menu';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <svg viewBox='0 0 24 24' className='size-5' aria-hidden>
        <rect width='24' height='24' rx='6' fill='#5e6ad2' />
        <path
          d='M13.2 4.5 7.5 13.2h4.1l-.9 6.3 5.8-8.8h-4.1l.8-6.2Z'
          fill='white'
        />
      </svg>
      <span className='text-[15px] font-semibold tracking-[-0.02em]'>
        Sparqly
      </span>
    </span>
  );
}

function CreditsMeter() {
  const { data: wallet, isLoading } = useWallet();
  if (isLoading) return <Skeleton className='h-12 w-full rounded-lg' />;
  if (!wallet) return null;

  const allowance =
    wallet.planCredits +
    wallet.extraCredits +
    wallet.rolledOverCredits +
    wallet.proratedCredits;
  const used = Math.min(wallet.usageCount, allowance);
  const percent = allowance > 0 ? Math.round((used / allowance) * 100) : 0;
  const low = wallet.balance <= 2;

  return (
    <Link
      href='/dashboard/billing'
      className='hover:bg-sidebar-accent group block rounded-lg border px-2.5 py-2 transition-colors'
    >
      <div className='flex items-baseline justify-between text-xs'>
        <span className='text-sidebar-foreground'>Credits</span>
        <span className='tnum text-sidebar-accent-foreground font-medium'>
          {wallet.balance}
          {allowance > 0 && (
            <span className='text-muted-foreground font-normal'>
              {' '}
              / {allowance}
            </span>
          )}
        </span>
      </div>
      <div
        className='bg-sidebar-accent mt-1.5 h-1 overflow-hidden rounded-full'
        role='progressbar'
        aria-label='Credits used this period'
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={low ? 'bg-warning h-full' : 'bg-primary h-full'}
          style={{ width: `${allowance > 0 ? 100 - percent : 0}%` }}
        />
      </div>
      {low && (
        <p className='text-warning mt-1.5 text-[11px]'>
          Running low. Top up to keep creating.
        </p>
      )}
    </Link>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar variant='inset' collapsible='offcanvas'>
      <SidebarHeader className='gap-3 pb-1'>
        <div className='flex items-center gap-1'>
          <UserMenu />
          <Notifications />
        </div>
        <Button asChild size='sm' className='w-full justify-start'>
          <Link
            href='/dashboard/repurpose'
            onClick={() => setOpenMobile(false)}
          >
            <Plus /> New project
          </Link>
        </Button>
      </SidebarHeader>

      <SidebarContent className='scrollbar-thin gap-0'>
        {NAV.map((group, index) => (
          <SidebarGroup key={group.label ?? index} className='py-1'>
            {group.label && (
              <SidebarGroupLabel className='text-subtle-foreground h-7 text-[11px] font-medium'>
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarMenu className='gap-px'>
              {group.items.map((item) => {
                const active = isActive(pathname, item);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className='h-7 text-[13px] data-[active=true]:font-medium'
                    >
                      <Link
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        onClick={() => setOpenMobile(false)}
                      >
                        <item.icon
                          className={
                            active ? 'text-sidebar-accent-foreground' : ''
                          }
                        />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <CreditsMeter />
        <Logo className='text-muted-foreground px-1 pt-1 opacity-70 [&_span]:text-xs' />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
