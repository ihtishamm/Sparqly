import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ConnectionsPage } from '@/features/publishing/connections-page';

export const metadata: Metadata = { title: 'Connections' };

export default function Page() {
  return (
    <Suspense>
      <ConnectionsPage />
    </Suspense>
  );
}
