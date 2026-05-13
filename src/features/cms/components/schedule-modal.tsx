'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { usePlatformAccounts } from '@/features/connections/api/platform-accounts';
import { useScheduledPosts } from '@/features/repurpose/api/scheduled-posts';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';
import {
  IconBrandLinkedin,
  IconBrandTwitter,
  IconBrandInstagram,
  IconBrandYoutube,
  IconBrandTiktok,
  IconCalendarEvent,
  IconClock,
  IconDevices
} from '@tabler/icons-react';
import { Skeleton } from '@/components/ui/skeleton';

const PLATFORM_ICONS: Record<string, any> = {
  youtube: IconBrandYoutube,
  linkedin: IconBrandLinkedin,
  instagram: IconBrandInstagram,
  twitter: IconBrandTwitter,
  tiktok: IconBrandTiktok
};

type ScheduleModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  contentId?: string;
  variantId?: string;
  onConfirm?: () => void;
};

export function ScheduleModal({
  open,
  onOpenChange,
  title = 'Schedule post',
  contentId,
  variantId,
  onConfirm
}: ScheduleModalProps) {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [time, setTime] = React.useState('12:00');
  const [selectedAccounts, setSelectedAccounts] = React.useState<string[]>([]);

  const { useGetAccounts } = usePlatformAccounts();
  const { data: accountsData, isLoading: accountsLoading } = useGetAccounts();
  const accounts = accountsData?.data || [];

  const { user } = useAuthStore();
  const { scheduleMutation } = useScheduledPosts();

  const toggleAccount = (id: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleConfirm = async (publishNow = false) => {
    if (!publishNow && !date) {
      toast.error('Please select a date');
      return;
    }

    if (selectedAccounts.length === 0) {
      toast.error('Please select at least one account');
      return;
    }

    if (!contentId) return;

    let scheduledAt = new Date();
    if (!publishNow && date) {
      const [hours, minutes] = time.split(':');
      scheduledAt = new Date(date);
      scheduledAt.setHours(parseInt(hours), parseInt(minutes));
    }

    try {
      // We need to create a scheduled post for each selected account
      await Promise.all(
        selectedAccounts.map((accountId) =>
          scheduleMutation.mutateAsync({
            content: contentId ? { id: contentId } : undefined,
            contentVariant: variantId ? { id: variantId } : undefined,
            platformAccount: { id: accountId },
            scheduledAt: scheduledAt.toISOString(),
            user: user ? { id: user.id } : undefined,
            publishNow
          })
        )
      );

      toast.success(
        publishNow
          ? 'Content is being published!'
          : 'Content scheduled successfully!'
      );
      onOpenChange(false);
      onConfirm?.();
    } catch (error) {
      // Error handled by mutation meta
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='bg-background overflow-hidden rounded-[32px] border-none p-0 shadow-2xl sm:max-w-7xl'>
        <div className='flex h-[750px]'>
          {/* Left Side: Accounts Selection */}
          <div className='bg-muted/20 flex w-[380px] flex-col border-r'>
            <div className='border-b p-8'>
              <h3 className='flex items-center gap-2 text-lg font-bold'>
                <IconDevices className='text-primary size-5' /> Select Accounts
              </h3>
              <p className='text-muted-foreground mt-1 text-xs'>
                Where should we post this?
              </p>
            </div>

            <div className='flex-1 space-y-3 overflow-y-auto p-6'>
              {accountsLoading ? (
                [1, 2, 3].map((i) => (
                  <Skeleton key={i} className='h-16 w-full rounded-2xl' />
                ))
              ) : accounts.length === 0 ? (
                <div className='space-y-4 p-8 text-center'>
                  <p className='text-muted-foreground text-sm'>
                    No accounts connected
                  </p>
                  <Button
                    variant='outline'
                    size='sm'
                    className='rounded-xl'
                    onClick={() =>
                      (window.location.href = '/dashboard/connections')
                    }
                  >
                    Connect Now
                  </Button>
                </div>
              ) : (
                accounts.map((acc) => {
                  const Icon = PLATFORM_ICONS[acc.platform] || IconDevices;
                  const isSelected = selectedAccounts.includes(acc.id);
                  return (
                    <div
                      key={acc.id}
                      onClick={() => toggleAccount(acc.id)}
                      className={`group flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-4 transition-all duration-200 ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'bg-background hover:border-primary/20 border-transparent shadow-xs'
                      }`}
                    >
                      <div
                        className={`rounded-xl p-2.5 transition-colors ${isSelected ? 'bg-primary/10' : 'bg-muted/50 group-hover:bg-muted'}`}
                      >
                        <Icon
                          className={`size-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}
                        />
                      </div>
                      <div className='min-w-0 flex-1'>
                        <p className='truncate text-sm font-bold'>
                          {acc.accountName}
                        </p>
                        <p className='text-muted-foreground text-[10px] font-medium tracking-widest uppercase'>
                          {acc.platform}
                        </p>
                      </div>
                      <Checkbox
                        checked={isSelected}
                        className='data-[state=checked]:bg-primary data-[state=checked]:border-primary size-5 rounded-full border-2'
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Side: Calendar & Time */}
          <div className='flex flex-1 flex-col'>
            <DialogHeader className='border-b p-8 pr-16'>
              <DialogTitle className='text-2xl font-black tracking-tight'>
                {title}
              </DialogTitle>
              <DialogDescription className='text-sm font-medium'>
                Choose the perfect time for maximum engagement.
              </DialogDescription>
            </DialogHeader>

            <div className='grid flex-1 grid-cols-2 gap-10 p-8'>
              <div className='space-y-4'>
                <Label className='text-muted-foreground flex items-center gap-2 text-[10px] font-bold tracking-[0.1em] uppercase'>
                  <IconCalendarEvent className='text-primary size-4' /> Select
                  Date
                </Label>
                <div className='bg-background border-border/50 rounded-3xl border p-2 shadow-sm'>
                  <Calendar
                    mode='single'
                    selected={date}
                    onSelect={setDate}
                    className='w-full'
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                  />
                </div>
              </div>

              <div className='space-y-8'>
                <div className='space-y-4'>
                  <Label className='text-muted-foreground flex items-center gap-2 text-[10px] font-bold tracking-[0.1em] uppercase'>
                    <IconClock className='text-primary size-4' /> Select Time
                  </Label>
                  <div className='group relative'>
                    <Input
                      type='time'
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className='bg-muted/30 focus-visible:ring-primary group-hover:bg-muted/50 h-16 rounded-2xl border-none px-6 text-3xl font-black transition-all'
                    />
                  </div>
                </div>

                <div className='from-primary/10 to-primary/5 border-primary/10 space-y-4 rounded-3xl border bg-linear-to-br p-6'>
                  <h4 className='text-primary/80 text-xs font-bold tracking-widest uppercase'>
                    Summary
                  </h4>
                  <div className='space-y-3'>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-muted-foreground'>Accounts</span>
                      <span className='bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-[10px] font-bold'>
                        {selectedAccounts.length} selected
                      </span>
                    </div>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-muted-foreground'>Date</span>
                      <span className='font-bold'>
                        {date
                          ? date.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })
                          : 'Not selected'}
                      </span>
                    </div>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-muted-foreground'>Time</span>
                      <span className='font-bold'>{time}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className='bg-muted/5 items-center gap-3 border-t p-8 sm:justify-between'>
              <Button
                variant='ghost'
                onClick={() => onOpenChange(false)}
                className='rounded-full px-8 font-bold'
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleConfirm(true)}
                disabled={
                  selectedAccounts.length === 0 || scheduleMutation.isPending
                }
                variant='outline'
                className='border-primary text-primary hover:bg-primary/5 h-14 rounded-full px-8 text-base font-black transition-all active:scale-[0.98]'
              >
                {scheduleMutation.isPending ? 'Publishing...' : 'Publish Now'}
              </Button>
              <Button
                onClick={() => handleConfirm(false)}
                disabled={
                  !date ||
                  selectedAccounts.length === 0 ||
                  scheduleMutation.isPending
                }
                className='shadow-primary/30 h-14 rounded-full px-12 text-base font-black shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]'
              >
                {scheduleMutation.isPending
                  ? 'Scheduling...'
                  : 'Confirm Schedule'}
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
