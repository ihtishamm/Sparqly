'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CircleCheck, MailCheck } from 'lucide-react';
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
import { FormAlert } from '@/components/common/states';
import { useForgotPassword, useResetPassword } from '@/lib/api/hooks/auth';
import { applyApiErrors, PASSWORD_HINT, PASSWORD_RULE } from '@/lib/forms';
import { AuthCard } from './auth-card';

const backToSignIn = (
  <Link
    href='/auth/sign-in'
    className='text-foreground font-medium hover:underline'
  >
    Back to sign in
  </Link>
);

export function ForgotPasswordForm() {
  const forgot = useForgotPassword();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm<{ email: string }>({
    resolver: zodResolver(
      z.object({
        email: z.string().trim().email('Enter a valid email address')
      })
    ),
    defaultValues: { email: '' }
  });

  if (sentTo) {
    return (
      <AuthCard title='Check your email' footer={backToSignIn}>
        <div className='flex flex-col items-center gap-3 text-center'>
          <MailCheck className='text-primary size-8' aria-hidden />
          <p className='text-muted-foreground text-[13px]'>
            If an account uses <span className='text-foreground'>{sentTo}</span>
            , it will get a link to reset the password. The link expires soon,
            so use it today.
          </p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title='Reset your password'
      description='Enter your email and we’ll send you a reset link.'
      footer={backToSignIn}
    >
      <Form {...form}>
        <form
          noValidate
          className='space-y-4'
          onSubmit={form.handleSubmit(async ({ email }) => {
            try {
              await forgot.mutateAsync(email);
              setSentTo(email);
            } catch (error) {
              applyApiErrors(error, form.setError, ['email']);
            }
          })}
        >
          <FormAlert message={form.formState.errors.root?.server?.message} />
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
                    autoFocus
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type='submit'
            className='w-full'
            loading={form.formState.isSubmitting}
          >
            Send reset link
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}

const resetSchema = z
  .object({
    password: z.string().max(72).regex(PASSWORD_RULE, PASSWORD_HINT),
    confirm: z.string()
  })
  .refine((v) => v.password === v.confirm, {
    path: ['confirm'],
    message: 'Passwords don’t match'
  });

export function ResetPasswordForm() {
  const hash = useSearchParams().get('hash');
  const reset = useResetPassword();
  const [done, setDone] = useState(false);
  const form = useForm<z.infer<typeof resetSchema>>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirm: '' }
  });

  if (!hash) {
    return (
      <AuthCard
        title='This link is incomplete'
        description='Open the link from your email again, or request a new one.'
        footer={backToSignIn}
      >
        <Button asChild className='w-full'>
          <Link href='/auth/forgot-password'>Request a new link</Link>
        </Button>
      </AuthCard>
    );
  }

  if (done) {
    return (
      <AuthCard title='Password updated'>
        <div className='flex flex-col items-center gap-3 text-center'>
          <CircleCheck className='text-success size-8' aria-hidden />
          <p className='text-muted-foreground text-[13px]'>
            Sign in with your new password.
          </p>
          <Button asChild className='w-full'>
            <Link href='/auth/sign-in'>Sign in</Link>
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title='Choose a new password' footer={backToSignIn}>
      <Form {...form}>
        <form
          noValidate
          className='space-y-4'
          onSubmit={form.handleSubmit(async ({ password }) => {
            try {
              await reset.mutateAsync({ hash, password });
              setDone(true);
            } catch (error) {
              applyApiErrors(error, form.setError, ['password']);
            }
          })}
        >
          <FormAlert message={form.formState.errors.root?.server?.message} />
          <FormField
            control={form.control}
            name='password'
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>New password</FormLabel>
                <FormControl>
                  <Input
                    type='password'
                    autoComplete='new-password'
                    autoFocus
                    {...field}
                  />
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
                <FormLabel>Confirm password</FormLabel>
                <FormControl>
                  <Input
                    type='password'
                    autoComplete='new-password'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type='submit'
            className='w-full'
            loading={form.formState.isSubmitting}
          >
            Update password
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}
