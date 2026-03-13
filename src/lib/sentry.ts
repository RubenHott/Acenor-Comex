import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;

export function initSentry() {
  if (!SENTRY_DSN) return;

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    enabled: import.meta.env.PROD,
    // Performance — sample 10% of transactions in production
    tracesSampleRate: 0.1,
    // Only send errors (no breadcrumbs for console.log in prod)
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
        return null;
      }
      return breadcrumb;
    },
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
  });
}

export { Sentry };
