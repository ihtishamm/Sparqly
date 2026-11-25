'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CircleAlert, CircleCheck, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConfirmEmail, useGoogleSignIn } from '@/lib/api/hooks/auth';
import { errorMessage } from '@/lib/api/errors';
import { AuthCard } from './auth-card';
import {
  GOOGLE_RETURN_KEY,
  GOOGLE_STATE_KEY,
  safeReturnPath
} from './google-button';

function Status({
  state,
  message
}: {
  state: 'loading' | 'success' | 'error';
  message: string;
}) {
  const Icon =
    state === 'loading'
      ? LoaderCircle
      : state === 'success'
        ? CircleCheck
        : CircleAlert;
  return (
    <div className='flex flex-col items-center gap-3 text-center' role='status'>
      <Icon
        aria-hidden
        className={
          state === 'loading'
            ? 'text-muted-foreground size-7 animate-spin'
            : state === 'success'
              ? 'text-success size-7'
              : 'text-destructive size-7'
        }
      />
      <p className='text-muted-foreground text-[13px]'>{message}</p>
    </div>
  );
}

export function ConfirmEmailView({ newEmail = false }: { newEmail?: boolean }) {
  const hash = useSearchParams().get('hash');
  const confirm = useConfirmEmail(newEmail);
  const started = useRef(false);

  useEffect(() => {
    if (hash && !started.current) {
      started.current = true;
      confirm.mutate(hash);
    }
  }, [hash, confirm]);

  if (!hash) {
    return (
      <AuthCard title='This link is incomplete'>
        <Status
          state='error'
          message='Open the confirmation link from your email again.'
        />
      </AuthCard>
    );
  }

  return (
    <AuthCard title='Confirming your email'>
      {confirm.isError ? (
        <div className='space-y-4'>
          <Status state='error' message={errorMessage(confirm.error)} />
          <Button asChild variant='outline' className='w-full'>
            <Link href='/auth/sign-in'>Go to sign in</Link>
          </Button>
        </div>
      ) : confirm.isSuccess ? (
        <div className='space-y-4'>
          <Status
            state='success'
            message={
              newEmail
                ? 'Your new email address is confirmed.'
                : 'Your email is confirmed. You can sign in now.'
            }
          />
          <Button asChild className='w-full'>
            <Link href={newEmail ? '/dashboard/settings' : '/auth/sign-in'}>
              {newEmail ? 'Back to settings' : 'Sign in'}
            </Link>
          </Button>
        </div>
      ) : (
        <Status state='loading' message='One moment…' />
      )}
    </AuthCard>
  );
}

export function GoogleCallbackView() {
  const params = useSearchParams();
  const signIn = useGoogleSignIn();
  const router = useRouter();
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const code = params.get('code');
    const state = params.get('state');
    const expectedState = sessionStorage.getItem(GOOGLE_STATE_KEY);
    sessionStorage.removeItem(GOOGLE_STATE_KEY);
    if (params.get('error') || !code || !state) {
      setError('Google sign-in was cancelled or didn’t complete.');
      return;
    }
    if (state !== expectedState) {
      setError('This sign-in link didn’t start here. Try again.');
      return;
    }
    signIn.mutate(
      { code, state },
      {
        onSuccess: () => {
          const returnTo = safeReturnPath(
            sessionStorage.getItem(GOOGLE_RETURN_KEY)
          );
          sessionStorage.removeItem(GOOGLE_RETURN_KEY);
          // Client-side, so the access token held in memory is kept.
          router.replace(returnTo);
        },
        onError: (e) => setError(errorMessage(e))
      }
    );
  }, [params, router, signIn]);

  return (
    <AuthCard title='Signing in with Google'>
      {error ? (
        <div className='space-y-4'>
          <Status state='error' message={error} />
          <Button asChild variant='outline' className='w-full'>
            <Link href='/auth/sign-in'>Back to sign in</Link>
          </Button>
        </div>
      ) : (
        <Status state='loading' message='Finishing sign-in…' />
      )}
    </AuthCard>
  );
}
