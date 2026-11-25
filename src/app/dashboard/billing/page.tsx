import { Suspense } from 'react';
import type { Metadata } from 'next';
import { BillingPage } from '@/features/account/billing-page';

export const metadata: Metadata = { title: 'Billing' };

export default function Page() {
  return (
    <Suspense>
      <BillingPage />
    </Suspense>
  );
}
