'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

/** Last-resort boundary when the root layout itself fails. */
export default function GlobalError({
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
    <html lang='en'>
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#010102',
          color: '#f7f8f8',
          fontFamily: 'system-ui, sans-serif'
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 360, padding: 24 }}>
          <h1 style={{ fontSize: 18, fontWeight: 600 }}>
            Sparqly hit an unexpected error
          </h1>
          <p style={{ color: '#8a8f98', fontSize: 14 }}>
            Reload the page to continue. If it keeps happening, contact support.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 12,
              padding: '8px 14px',
              borderRadius: 8,
              border: 0,
              background: '#5e6ad2',
              color: 'white',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
