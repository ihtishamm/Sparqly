'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GOOGLE_STATE_KEY, useAuthService } from '../api/auth-service';
import { Icons } from '@/components/icons';

export default function GoogleCallbackView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { googleCallbackMutation } = useAuthService();
  const triggered = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (triggered.current) return;
    triggered.current = true;

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const expectedState = sessionStorage.getItem(GOOGLE_STATE_KEY);
    sessionStorage.removeItem(GOOGLE_STATE_KEY);

    if (searchParams.get('error')) {
      setError('Google sign-in was cancelled.');
    } else if (!code || !state || state !== expectedState) {
      setError('This sign-in link is invalid or has expired.');
    } else {
      googleCallbackMutation.mutate(
        { code, state },
        { onError: () => setError('Google sign-in failed. Please try again.') }
      );
    }
  }, [searchParams, googleCallbackMutation]);

  return (
    <div className='flex h-screen items-center justify-center p-4'>
      <div className='flex w-full max-w-md flex-col items-center space-y-6 text-center'>
        {error ? (
          <>
            <div className='bg-destructive/10 rounded-full p-3'>
              <Icons.close className='text-destructive h-12 w-12' />
            </div>
            <h1 className='text-2xl font-semibold tracking-tight'>
              Sign-in failed
            </h1>
            <p className='text-muted-foreground'>{error}</p>
            <button
              onClick={() => router.push('/auth/sign-in')}
              className='text-primary hover:underline'
            >
              Back to Sign In
            </button>
          </>
        ) : (
          <>
            <Icons.spinner className='text-primary h-12 w-12 animate-spin' />
            <h1 className='text-2xl font-semibold tracking-tight'>
              Signing you in...
            </h1>
          </>
        )}
      </div>
    </div>
  );
}
