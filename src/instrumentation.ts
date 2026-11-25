import * as Sentry from '@sentry/nextjs';

// Off unless a DSN is configured. No PII, and only a sample of traces.
export async function register() {
  if (
    !process.env.NEXT_PUBLIC_SENTRY_DSN ||
    process.env.NEXT_PUBLIC_SENTRY_DISABLED
  ) {
    return;
  }
  if (
    process.env.NEXT_RUNTIME === 'nodejs' ||
    process.env.NEXT_RUNTIME === 'edge'
  ) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      sendDefaultPii: false,
      tracesSampleRate: 0.1
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
