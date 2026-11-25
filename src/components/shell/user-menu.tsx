'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import {
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Monitor,
  Moon,
  Settings,
  Sun
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useSignOut } from '@/lib/api/hooks/auth';
import { useAuthStore } from '@/store/auth-store';

export function initials(name: string | null | undefined) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

export function Avatar({
  name,
  className = 'size-6 text-[10px]'
}: {
  name: string | null | undefined;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`bg-primary/20 text-primary flex shrink-0 items-center justify-center rounded-full font-semibold dark:text-[#b4baff] ${className}`}
    >
      {initials(name)}
    </span>
  );
}

export function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const signOut = useSignOut();
  const { theme, setTheme } = useTheme();
  const name = user?.fullName || user?.username || user?.email || 'Account';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className='hover:bg-sidebar-accent data-[state=open]:bg-sidebar-accent focus-visible:ring-sidebar-ring flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1 text-left outline-none focus-visible:ring-2'>
        <Avatar name={name} />
        <span className='text-sidebar-accent-foreground truncate text-[13px] font-medium'>
          {name}
        </span>
        <ChevronsUpDown className='text-muted-foreground ml-auto size-3.5 shrink-0' />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='start' className='w-60'>
        <DropdownMenuLabel className='font-normal'>
          <p className='truncate text-[13px] font-medium'>{name}</p>
          {user?.email && (
            <p className='text-muted-foreground truncate text-xs'>
              {user.email}
            </p>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href='/dashboard/settings'>
            <Settings /> Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href='/dashboard/billing'>
            <CreditCard /> Billing
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className='gap-2'>
            <Moon className='text-muted-foreground size-4' /> Theme
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
              <DropdownMenuRadioItem value='dark'>
                <Moon /> Dark
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value='light'>
                <Sun /> Light
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value='system'>
                <Monitor /> System
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void signOut()}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
