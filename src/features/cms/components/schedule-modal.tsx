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
import { Badge } from '@/components/ui/badge';
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
  onConfirm?: () => void;
};

export function ScheduleModal({
  open,
  onOpenChange,
  title = 'Schedule post',
  contentId,
  onConfirm
}: ScheduleModalProps) {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [time, setTime] = React.useState('12:00');
  const [selectedAccounts, setSelectedAccounts] = React.useState<string[]>([]);

  const { useGetAccounts } = usePlatformAccounts();
  const { data: accountsData, isLoading: accountsLoading } = useGetAccounts();
  const accounts = accountsData?.data || [];

  const { scheduleMutation } = useScheduledPosts();

  const toggleAccount = (id: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleConfirm = async () => {
    if (!date || !contentId || selectedAccounts.length === 0) {
      toast.error('Please select a date and at least one account');
      return;
    }

    const [hours, minutes] = time.split(':');
    const scheduledAt = new Date(date);
    scheduledAt.setHours(parseInt(hours), parseInt(minutes));

    try {
      // We need to create a scheduled post for each selected account
      await Promise.all(
        selectedAccounts.map((accountId) =>
          scheduleMutation.mutateAsync({
            content: { id: contentId },
            platformAccount: { id: accountId },
            scheduledAt: scheduledAt.toISOString()
          })
        )
      );

      toast.success('Content scheduled successfully!');
      onOpenChange(false);
      onConfirm?.();
    } catch (error) {
      // Error handled by mutation meta
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='bg-background max-w-4xl overflow-hidden rounded-[32px] border-none p-0 shadow-2xl'>
        <div className='flex h-[600px]'>
          {/* Left Side: Accounts Selection */}
          <div className='bg-muted/20 flex w-[350px] flex-col border-r'>
            <div className='bg-background/50 border-b p-6'>
              <h3 className='flex items-center gap-2 font-bold'>
                <IconDevices className='text-primary h-5 w-5' /> Select Accounts
              </h3>
              <p className='text-muted-foreground mt-1 text-xs'>
                Where should we post this?
              </p>
            </div>

            <div className='flex-1 space-y-2 overflow-y-auto p-4'>
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
                      className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-3 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'bg-background hover:border-primary/20 border-transparent'
                      }`}
                    >
                      <div className='bg-muted rounded-xl p-2'>
                        <Icon className='text-muted-foreground h-5 w-5' />
                      </div>
                      <div className='min-w-0 flex-1'>
                        <p className='truncate text-sm font-bold'>
                          {acc.accountName}
                        </p>
                        <p className='text-muted-foreground text-[10px] tracking-widest uppercase'>
                          {acc.platform}
                        </p>
                      </div>
                      <Checkbox checked={isSelected} className='rounded-full' />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Side: Calendar & Time */}
          <div className='flex flex-1 flex-col'>
            <DialogHeader className='border-b p-6'>
              <DialogTitle className='text-2xl font-bold'>{title}</DialogTitle>
              <DialogDescription>
                Choose the perfect time for maximum engagement.
              </DialogDescription>
            </DialogHeader>

            <div className='grid flex-1 grid-cols-2 gap-8 p-6'>
              <div className='space-y-4'>
                <Label className='text-muted-foreground flex items-center gap-2 text-xs font-bold tracking-widest uppercase'>
                  <IconCalendarEvent className='h-4 w-4' /> Select Date
                </Label>
                <div className='bg-background rounded-3xl border p-2 shadow-sm'>
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
                  <Label className='text-muted-foreground flex items-center gap-2 text-xs font-bold tracking-widest uppercase'>
                    <IconClock className='h-4 w-4' /> Select Time
                  </Label>
                  <div className='relative'>
                    <Input
                      type='time'
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className='bg-muted/20 focus-visible:ring-primary h-16 rounded-2xl border-none px-6 text-2xl font-bold'
                    />
                  </div>
                </div>

                <div className='bg-primary/5 border-primary/10 space-y-3 rounded-3xl border p-6'>
                  <h4 className='text-sm font-bold'>Scheduling Summary</h4>
                  <div className='space-y-2'>
                    <div className='flex justify-between text-xs'>
                      <span className='text-muted-foreground'>Accounts:</span>
                      <span className='font-bold'>
                        {selectedAccounts.length} selected
                      </span>
                    </div>
                    <div className='flex justify-between text-xs'>
                      <span className='text-muted-foreground'>Date:</span>
                      <span className='font-bold'>
                        {date ? date.toLocaleDateString() : 'Not selected'}
                      </span>
                    </div>
                    <div className='flex justify-between text-xs'>
                      <span className='text-muted-foreground'>Time:</span>
                      <span className='font-bold'>{time}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className='bg-muted/10 gap-3 border-t p-6'>
              <Button
                variant='ghost'
                onClick={() => onOpenChange(false)}
                className='rounded-full px-8'
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={
                  !date ||
                  selectedAccounts.length === 0 ||
                  scheduleMutation.isPending
                }
                className='shadow-primary/20 h-12 rounded-full px-12 font-bold shadow-lg'
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
