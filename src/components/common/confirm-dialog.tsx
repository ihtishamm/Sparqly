'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Confirmation for destructive or paid actions. Set `confirmText` to make the
 * user type a phrase first (for irreversible actions).
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  destructive = false,
  confirmText,
  onConfirm
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
  confirmText?: string;
  onConfirm: () => Promise<unknown> | void;
}) {
  const [pending, setPending] = useState(false);
  const [typed, setTyped] = useState('');
  const blocked = !!confirmText && typed.trim() !== confirmText;

  async function confirm() {
    setPending(true);
    try {
      await onConfirm();
      onOpenChange(false);
      setTyped('');
    } catch {
      // The mutation's own handler reports the error; keep the dialog open.
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        if (!next) setTyped('');
        onOpenChange(next);
      }}
    >
      <AlertDialogContent className='sm:max-w-md'>
        <AlertDialogHeader>
          <AlertDialogTitle className='text-base'>{title}</AlertDialogTitle>
          <AlertDialogDescription className='text-[13px]'>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {confirmText && (
          <div className='space-y-1.5'>
            <Label
              htmlFor='confirm-text'
              className='text-muted-foreground text-xs'
            >
              Type{' '}
              <span className='text-foreground font-mono'>{confirmText}</span>{' '}
              to confirm
            </Label>
            <Input
              id='confirm-text'
              autoComplete='off'
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
            />
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant='outline' disabled={pending}>
              Cancel
            </Button>
          </AlertDialogCancel>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            loading={pending}
            disabled={blocked}
            onClick={confirm}
          >
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
