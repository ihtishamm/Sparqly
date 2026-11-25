'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { FormAlert } from '@/components/common/states';
import { useResendConfirmation, useSignIn } from '@/lib/api/hooks/auth';
import { ApiError } from '@/lib/api/errors';
import { applyApiErrors } from '@/lib/forms';
import { AuthCard } from './auth-card';
import { GoogleButton, OrDivider, safeReturnPath } from './google-button';

const schema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password')
});
type Values = z.infer<typeof schema>;

export function SignInForm() {
  const params = useSearchParams();
  const returnTo = safeReturnPath(params.get('callbackUrl'));
  const signIn = useSignIn();
  const resend = useResendConfirmation();
  const [unconfirmed, setUnconfirmed] = useState<string | null>(null);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' }
  });

  async function onSubmit(values: Values) {
    setUnconfirmed(null);
    try {
      await signIn.mutateAsync(values);
      window.location.assign(returnTo);
    } catch (error) {
      if (error instanceof ApiError && error.codes.email === 'notActive') {
        setUnconfirmed(values.email);
      }
      // A wrong password comes back on `password`; show it once, at the top.
      if (error instanceof ApiError && error.fieldErrors.password) {
        form.setError('root.server', { message: error.fieldErrors.password });
        return;
      }
      applyApiErrors(error, form.setError, ['email', 'password']);
    }
  }

  return (
    <AuthCard
      title='Sign in to Sparqly'
      description={
        params.get('expired')
          ? 'Your session ended. Sign in again to pick up where you left off.'
          : 'Welcome back.'
      }
      footer={
        <>
          New to Sparqly?{' '}
          <Link
            href='/auth/sign-up'
            className='text-foreground font-medium hover:underline'
          >
            Create an account
          </Link>
        </>
      }
    >
      <GoogleButton returnTo={returnTo} />
      <OrDivider />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-4'
          noValidate
        >
          <FormAlert message={form.formState.errors.root?.server?.message} />
          {unconfirmed && (
            <div className='bg-secondary rounded-lg border px-3 py-2 text-[13px]'>
              <p className='text-muted-foreground'>
                Didn’t get the confirmation email?
              </p>
              <Button
                type='button'
                variant='link'
                className='h-auto p-0'
                loading={resend.isPending}
                onClick={() =>
                  resend.mutate(unconfirmed, {
                    onSuccess: () =>
                      toast.success('Confirmation email sent', {
                        description: `Check ${unconfirmed}.`
                      })
                  })
                }
              >
                Send it again
              </Button>
            </div>
          )}
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
          <FormField
            control={form.control}
            name='password'
            render={({ field }) => (
              <FormItem>
                <div className='flex items-center justify-between'>
                  <FormLabel>Password</FormLabel>
                  <Link
                    href='/auth/forgot-password'
                    className='text-muted-foreground hover:text-foreground text-xs'
                  >
                    Forgot password?
                  </Link>
                </div>
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
          <Button
            type='submit'
            className='w-full'
            loading={form.formState.isSubmitting}
          >
            Sign in
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}
