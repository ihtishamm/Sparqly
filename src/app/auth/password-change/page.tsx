import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ResetPasswordForm } from '@/features/auth/password-forms';

export const metadata: Metadata = { title: 'Choose a new password' };

/** The password reset email links here. */
export default function Page() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
