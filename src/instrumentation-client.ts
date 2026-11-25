import * as Sentry from '@sentry/nextjs';

// Off unless a DSN is configured. No PII, and only a sample of traces.
if (
  process.env.NEXT_PUBLIC_SENTRY_DSN &&
  !process.env.NEXT_PUBLIC_SENTRY_DISABLED
) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    sendDefaultPii: false,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.5,
    integrations: [
      Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true })
    ]
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
