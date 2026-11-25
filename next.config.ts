import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const baseConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    // Old routes, kept so bookmarks and emailed links still work.
    return [
      {
        source: '/dashboard/overview',
        destination: '/dashboard',
        permanent: true
      },
      {
        source: '/dashboard/content',
        destination: '/dashboard/projects',
        permanent: true
      },
      {
        source: '/dashboard/content/:id',
        destination: '/dashboard/projects/:id',
        permanent: true
      },
      {
        source: '/dashboard/create',
        destination: '/dashboard/studio',
        permanent: true
      },
      {
        source: '/dashboard/subscription',
        destination: '/dashboard/billing',
        permanent: true
      },
      {
        source: '/dashboard/profile',
        destination: '/dashboard/settings',
        permanent: true
      },
      {
        source: '/auth/reset-password',
        destination: '/auth/password-change',
        permanent: true
      }
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' }
        ]
      }
    ];
  }
};

// Sentry is only wired in when a DSN is configured and not disabled.
const sentryOn =
  !!process.env.NEXT_PUBLIC_SENTRY_DSN &&
  !process.env.NEXT_PUBLIC_SENTRY_DISABLED;

const nextConfig = sentryOn
  ? withSentryConfig(baseConfig, {
      org: process.env.NEXT_PUBLIC_SENTRY_ORG,
      project: process.env.NEXT_PUBLIC_SENTRY_PROJECT,
      silent: !process.env.CI,
      widenClientFileUpload: true,
      tunnelRoute: '/monitoring',
      disableLogger: true,
      telemetry: false
    })
  : baseConfig;

export default nextConfig;
