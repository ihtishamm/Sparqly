'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthService } from '../api/auth-service';
import { Icons } from '@/components/icons';

export default function ConfirmEmailViewPage() {
  const searchParams = useSearchParams();
  const hash = searchParams.get('hash');
  const { confirmEmailMutation } = useAuthService();
  const router = useRouter();
  const triggered = useRef(false);

  useEffect(() => {
    if (hash && !triggered.current) {
      triggered.current = true;
      confirmEmailMutation.mutate(hash);
    }
  }, [hash, confirmEmailMutation]);

  if (!hash) {
    return (
      <div className='flex h-screen items-center justify-center p-4'>
        <div className='text-center'>
          <h1 className='text-destructive text-2xl font-bold'>
            Invalid Verification Link
          </h1>
          <p className='text-muted-foreground'>
            The verification link is invalid or has expired.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex h-screen items-center justify-center p-4'>
      <div className='flex w-full max-w-md flex-col items-center space-y-6 text-center'>
        {confirmEmailMutation.isPending ? (
          <>
            <Icons.spinner className='text-primary h-12 w-12 animate-spin' />
            <h1 className='text-2xl font-semibold tracking-tight'>
              Verifying your email...
            </h1>
            <p className='text-muted-foreground'>
              Please wait while we confirm your email address.
            </p>
          </>
        ) : confirmEmailMutation.isError ? (
          <>
            <div className='bg-destructive/10 rounded-full p-3'>
              <Icons.close className='text-destructive h-12 w-12' />
            </div>
            <h1 className='text-2xl font-semibold tracking-tight'>
              Verification Failed
            </h1>
            <p className='text-muted-foreground'>
              We couldn&apos;t verify your email. The link might be expired.
            </p>
            <button
              onClick={() => router.push('/auth/sign-in')}
              className='text-primary hover:underline'
            >
              Back to Sign In
            </button>
          </>
        ) : confirmEmailMutation.isSuccess ? (
          <>
            <div className='rounded-full bg-green-100 p-3'>
              <Icons.check className='h-12 w-12 text-green-600' />
            </div>
            <h1 className='text-2xl font-semibold tracking-tight'>
              Email Verified!
            </h1>
            <p className='text-muted-foreground'>
              Your email has been successfully verified. Redirecting to sign
              in...
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
