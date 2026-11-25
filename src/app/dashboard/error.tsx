'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { ErrorState } from '@/components/common/states';
import { PageBody } from '@/components/common/page-header';

/** Per-route boundary: a crash in one page keeps the sidebar usable. */
export default function DashboardError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <PageBody>
      <ErrorState
        title='This page hit an error'
        error={new Error('Something went wrong while showing this page.')}
        onRetry={reset}
      />
    </PageBody>
  );
}
