import { Suspense } from 'react';
import type { Metadata } from 'next';
import { GoogleCallbackView } from '@/features/auth/callback-views';

export const metadata: Metadata = { title: 'Signing in' };

export default function Page() {
  return (
    <Suspense>
      <GoogleCallbackView />
    </Suspense>
  );
}
