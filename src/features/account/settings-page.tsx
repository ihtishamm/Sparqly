'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { PageBody, PageHeader } from '@/components/common/page-header';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { FormAlert } from '@/components/common/states';
import { useDeleteAccount, useUpdateProfile } from '@/lib/api/hooks/auth';
import type { User } from '@/lib/api/types';
import { applyApiErrors, PASSWORD_HINT, PASSWORD_RULE } from '@/lib/forms';
import { useAuthStore } from '@/store/auth-store';

function Panel({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className='grid gap-4 border-b pb-8 md:grid-cols-[220px_1fr] md:gap-8'>
      <div className='space-y-1'>
        <h2 className='font-medium'>{title}</h2>
        {description && (
          <p className='text-muted-foreground text-[13px]'>{description}</p>
        )}
      </div>
      <div className='min-w-0'>{children}</div>
    </section>
  );
}

const profileSchema = z.object({
  fullName: z.string().trim().min(1, 'Enter your name').max(100),
  username: z
    .string()
    .trim()
    .min(3, 'At least 3 characters')
    .max(30, 'At most 30 characters')
    .regex(/^[a-z0-9_.]+$/i, 'Letters, numbers, dots and underscores only'),
  email: z.string().trim().email('Enter a valid email address')
});

function ProfileForm({ user }: { user: User }) {
  const update = useUpdateProfile();
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    values: {
      fullName: user.fullName ?? '',
      username: user.username ?? '',
      email: user.email ?? ''
    },
    resetOptions: { keepDirtyValues: true }
  });
  const isEmailUser = user.provider === 'email';

  return (
    <Form {...form}>
      <form
        noValidate
        className='max-w-md space-y-4'
        onSubmit={form.handleSubmit(async (values) => {
          const body: Partial<typeof values> = {};
          const dirty = form.formState.dirtyFields;
          if (dirty.fullName) body.fullName = values.fullName;
          if (dirty.username) body.username = values.username;
          if (dirty.email && isEmailUser) body.email = values.email;
          try {
            await update.mutateAsync(body);
            toast.success(
              body.email
                ? 'Saved. Check your new inbox to confirm the email change.'
                : 'Profile saved'
            );
            form.reset({ ...values, email: user.email ?? '' });
          } catch (error) {
            applyApiErrors(error, form.setError, [
              'fullName',
              'username',
              'email'
            ]);
          }
        })}
      >
        <FormAlert message={form.formState.errors.root?.server?.message} />
        <FormField
          control={form.control}
          name='fullName'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input autoComplete='name' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='username'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input autoComplete='username' spellCheck={false} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type='email'
                  autoComplete='email'
                  disabled={!isEmailUser}
                  {...field}
                />
              </FormControl>
              <FormDescription className='text-xs'>
                {isEmailUser
                  ? 'Changing it sends a confirmation link to the new address.'
                  : 'Managed by your Google account.'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type='submit'
          loading={form.formState.isSubmitting}
          disabled={!form.formState.isDirty}
        >
          Save changes
        </Button>
      </form>
    </Form>
  );
}

const passwordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Enter your current password'),
    password: z.string().max(72).regex(PASSWORD_RULE, PASSWORD_HINT),
    confirm: z.string()
  })
  .refine((v) => v.password === v.confirm, {
    path: ['confirm'],
    message: 'Passwords don’t match'
  });

function PasswordForm() {
  const update = useUpdateProfile();
  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { oldPassword: '', password: '', confirm: '' }
  });

  return (
    <Form {...form}>
      <form
        noValidate
        className='max-w-md space-y-4'
        onSubmit={form.handleSubmit(async ({ oldPassword, password }) => {
          try {
            await update.mutateAsync({ oldPassword, password });
            toast.success('Password updated', {
              description: 'Other devices are signed out.'
            });
            form.reset();
          } catch (error) {
            applyApiErrors(error, form.setError, ['oldPassword', 'password']);
          }
        })}
      >
        <FormAlert message={form.formState.errors.root?.server?.message} />
        <FormField
          control={form.control}
          name='oldPassword'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current password</FormLabel>
              <FormControl>
                <Input
                  type='password'
                  autoComplete='current-password'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>New password</FormLabel>
              <FormControl>
                <Input type='password' autoComplete='new-password' {...field} />
              </FormControl>
              {fieldState.error ? (
                <FormMessage />
              ) : (
                <FormDescription className='text-xs'>
                  {PASSWORD_HINT}
                </FormDescription>
              )}
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='confirm'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm new password</FormLabel>
              <FormControl>
                <Input type='password' autoComplete='new-password' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type='submit'
          variant='outline'
          loading={form.formState.isSubmitting}
        >
          Update password
        </Button>
      </form>
    </Form>
  );
}

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const remove = useDeleteAccount();
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <PageBody className='max-w-4xl'>
      <PageHeader title='Settings' description='Your profile and account.' />
      {!user ? (
        <Skeleton className='h-64 rounded-xl' />
      ) : (
        <div className='space-y-8'>
          <Panel title='Profile' description='How you appear in Sparqly.'>
            <ProfileForm user={user} />
          </Panel>
          {user.provider === 'email' && (
            <Panel
              title='Password'
              description='Use a password you don’t use anywhere else.'
            >
              <PasswordForm />
            </Panel>
          )}
          <Panel
            title='Delete account'
            description='Permanently removes your projects, schedule and connected accounts.'
          >
            <div className='border-destructive/30 flex max-w-md flex-col items-start gap-3 rounded-xl border p-4'>
              <p className='text-muted-foreground text-[13px]'>
                Scheduled posts are cancelled and unused credits are lost.
                Cancel any subscription in Billing first. This can’t be undone.
              </p>
              <Button
                variant='destructive'
                onClick={() => setConfirmDelete(true)}
              >
                Delete account
              </Button>
            </div>
          </Panel>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        destructive
        title='Delete your account?'
        description='Everything in your Sparqly account is deleted. This can’t be undone.'
        confirmText='delete my account'
        confirmLabel='Delete account'
        onConfirm={async () => {
          await remove.mutateAsync();
          window.location.assign('/auth/sign-in');
        }}
      />
    </PageBody>
  );
}
