import { Metadata } from 'next';
import { Suspense } from 'react';
import GoogleCallbackView from '@/features/auth/components/google-callback-view';

export const metadata: Metadata = {
  title: 'Authentication | Google Sign-In'
};

export default function Page() {
  return (
    <Suspense>
      <GoogleCallbackView />
    </Suspense>
  );
}
