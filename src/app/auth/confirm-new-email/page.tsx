import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ConfirmEmailView } from '@/features/auth/callback-views';

export const metadata: Metadata = { title: 'Confirm new email' };

export default function Page() {
  return (
    <Suspense>
      <ConfirmEmailView newEmail />
    </Suspense>
  );
}
