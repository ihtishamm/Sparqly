import { Suspense } from 'react';
import type { Metadata } from 'next';
import { CalendarPage } from '@/features/publishing/calendar-page';

export const metadata: Metadata = { title: 'Calendar' };

export default function Page() {
  return (
    <Suspense>
      <CalendarPage />
    </Suspense>
  );
}
