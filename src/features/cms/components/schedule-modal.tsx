'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
const PLATFORMS = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'twitter', label: 'Twitter' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'tiktok', label: 'TikTok' }
] as const;

type ScheduleModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  onConfirm?: (data: { date: Date; time: string; platforms: string[] }) => void;
};

export function ScheduleModal({
  open,
  onOpenChange,
  title = 'Schedule post',
  onConfirm
}: ScheduleModalProps) {
  const [date, setDate] = React.useState<Date | undefined>(undefined);
  const [time, setTime] = React.useState('12:00');
  const [platforms, setPlatforms] = React.useState<string[]>([]);

  const togglePlatform = (id: string) => {
    setPlatforms((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id]
    );
  };

  const handleConfirm = () => {
    if (date && onConfirm) {
      onConfirm({ date, time, platforms });
      onOpenChange(false);
      setDate(undefined);
      setTime('12:00');
      setPlatforms([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='border-border bg-background/95 supports-[backdrop-filter]:bg-background/80 rounded-2xl backdrop-blur sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className='space-y-6 py-4'>
          <div className='space-y-2'>
            <Label>Platforms</Label>
            <div className='flex flex-wrap gap-4'>
              {PLATFORMS.map((p) => (
                <div key={p.id} className='flex items-center space-x-2'>
                  <Checkbox
                    id={p.id}
                    checked={platforms.includes(p.id)}
                    onCheckedChange={() => togglePlatform(p.id)}
                  />
                  <Label
                    htmlFor={p.id}
                    className='cursor-pointer text-sm font-normal'
                  >
                    {p.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <div className='space-y-2'>
            <Label>Date</Label>
            <Calendar
              mode='single'
              selected={date}
              onSelect={setDate}
              className='border-border rounded-xl border'
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='time'>Time</Label>
            <Input
              id='time'
              type='time'
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className='rounded-xl'
            />
          </div>
        </div>
        <DialogFooter className='gap-2 sm:gap-0'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!date}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
