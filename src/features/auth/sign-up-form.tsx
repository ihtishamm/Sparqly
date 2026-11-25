'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MailCheck } from 'lucide-react';
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
import { FormAlert } from '@/components/common/states';
import { useResendConfirmation, useSignUp } from '@/lib/api/hooks/auth';
import { applyApiErrors, PASSWORD_HINT, PASSWORD_RULE } from '@/lib/forms';
import { AuthCard } from './auth-card';
import { GoogleButton, OrDivider } from './google-button';

const schema = z.object({
  fullName: z.string().trim().min(1, 'Enter your name').max(100),
  username: z
    .string()
    .trim()
    .min(3, 'At least 3 characters')
    .max(30, 'At most 30 characters')
    .regex(/^[a-z0-9_.]+$/i, 'Letters, numbers, dots and underscores only'),
  email: z.string().trim().email('Enter a valid email address'),
  password: z
    .string()
    .max(72, 'At most 72 characters')
    .regex(PASSWORD_RULE, PASSWORD_HINT)
});
type Values = z.infer<typeof schema>;

function CheckEmail({ email }: { email: string }) {
  const resend = useResendConfirmation();
  return (
    <AuthCard
      title='Check your email'
      description={
        <>
          We sent a confirmation link to{' '}
          <span className='text-foreground font-medium'>{email}</span>. Open it
          to activate your account.
        </>
      }
      footer={
        <Link
          href='/auth/sign-in'
          className='text-foreground font-medium hover:underline'
        >
          Back to sign in
        </Link>
      }
    >
      <div className='flex flex-col items-center gap-3 text-center'>
        <MailCheck className='text-primary size-8' aria-hidden />
        <p className='text-muted-foreground text-[13px]'>
          Can’t find it? Check your spam folder, or send it again.
        </p>
        <Button
          variant='outline'
          className='w-full'
          loading={resend.isPending}
          onClick={() =>
            resend.mutate(email, {
              onSuccess: () => toast.success('Confirmation email sent')
            })
          }
        >
          Resend email
        </Button>
      </div>
    </AuthCard>
  );
}

export function SignUpForm() {
  const signUp = useSignUp();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', username: '', email: '', password: '' },
    mode: 'onTouched'
  });

  async function onSubmit(values: Values) {
    try {
      await signUp.mutateAsync(values);
      setSentTo(values.email);
    } catch (error) {
      applyApiErrors(error, form.setError, [
        'fullName',
        'username',
        'email',
        'password'
      ]);
    }
  }

  if (sentTo) return <CheckEmail email={sentTo} />;

  return (
    <AuthCard
      title='Create your account'
      description='Turn one video into a week of content.'
      footer={
        <>
          Already have an account?{' '}
          <Link
            href='/auth/sign-in'
            className='text-foreground font-medium hover:underline'
          >
            Sign in
          </Link>
        </>
      }
    >
      <GoogleButton />
      <OrDivider />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-4'
          noValidate
        >
          <FormAlert message={form.formState.errors.root?.server?.message} />
          <FormField
            control={form.control}
            name='fullName'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input autoComplete='name' autoFocus {...field} />
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
                  <Input
                    autoComplete='username'
                    spellCheck={false}
                    {...field}
                  />
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
                  <Input type='email' autoComplete='email' {...field} />
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
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type='password'
                    autoComplete='new-password'
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
          <Button
            type='submit'
            className='w-full'
            loading={form.formState.isSubmitting}
          >
            Create account
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}
