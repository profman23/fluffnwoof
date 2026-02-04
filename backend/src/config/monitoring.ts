// ══════════════════════════════════════════════════════════════
// FluffNwoof Backend - Monitoring Configuration
// Sentry integration for error tracking and performance monitoring
// ══════════════════════════════════════════════════════════════

import { Express, Request, Response, NextFunction } from 'express';

// Sentry types (will be available after installing @sentry/node)
interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  tracesSampleRate: number;
  profilesSampleRate?: number;
}

interface MonitoringContext {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  action?: string;
  [key: string]: unknown;
}

// Check if Sentry is available
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Sentry: any = null;

/**
 * Initialize monitoring (Sentry) for the application
 * Only initializes in non-development environments with valid DSN
 */
export const initMonitoring = async (app: Express): Promise<void> => {
  const isDev = process.env.NODE_ENV === 'development';
  const sentryDsn = process.env.SENTRY_DSN;

  if (isDev) {
    console.log('📊 Monitoring: Skipped in development mode');
    return;
  }

  if (!sentryDsn) {
    console.log('📊 Monitoring: No SENTRY_DSN configured');
    return;
  }

  try {
    // Dynamic import to avoid issues if @sentry/node is not installed
    Sentry = await import('@sentry/node');

    const config: SentryConfig = {
      dsn: sentryDsn,
      environment: process.env.NODE_ENV || 'production',
      release: process.env.npm_package_version,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    };

    Sentry.init({
      ...config,

      // Integrations
      integrations: [
        // HTTP tracing
        Sentry.httpIntegration({ tracing: true }),

        // Express integration
        Sentry.expressIntegration({ app }),
      ],

      // Filter sensitive data before sending
      beforeSend(event) {
        // Remove sensitive headers
        if (event.request?.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
          delete event.request.headers['x-api-key'];
        }

        // Remove sensitive data from body
        if (event.request?.data) {
          const data =
            typeof event.request.data === 'string'
              ? JSON.parse(event.request.data)
              : event.request.data;

          if (data.password) data.password = '[FILTERED]';
          if (data.token) data.token = '[FILTERED]';
          if (data.apiKey) data.apiKey = '[FILTERED]';

          event.request.data = JSON.stringify(data);
        }

        return event;
      },

      // Ignore common non-critical errors
      ignoreErrors: [
        'TokenExpiredError',
        'JsonWebTokenError',
        'NotBeforeError',
        'ECONNREFUSED',
        'ETIMEDOUT',
      ],
    });

    console.log('✅ Sentry monitoring initialized');
  } catch (error) {
    console.warn('⚠️ Failed to initialize Sentry:', error);
  }
};

/**
 * Express error handler for Sentry
 * Use this as the last error handler in the middleware chain
 */
export const sentryErrorHandler = () => {
  if (!Sentry) {
    // Return a no-op middleware if Sentry is not initialized
    return (_err: Error, _req: Request, _res: Response, next: NextFunction) => {
      next(_err);
    };
  }
  return Sentry.expressErrorHandler();
};

/**
 * Request handler for Sentry
 * Use this as one of the first middlewares
 */
export const sentryRequestHandler = () => {
  if (!Sentry) {
    // Return a no-op middleware if Sentry is not initialized
    return (_req: Request, _res: Response, next: NextFunction) => {
      next();
    };
  }
  return Sentry.expressRequestHandler();
};

/**
 * Capture an error with additional context
 */
export const captureError = (
  error: Error,
  context?: MonitoringContext
): void => {
  if (!Sentry) {
    console.error('Error (Sentry not available):', error, context);
    return;
  }

  Sentry.withScope((scope) => {
    if (context) {
      // Set user context
      if (context.userId || context.userEmail) {
        scope.setUser({
          id: context.userId,
          email: context.userEmail,
        });
      }

      // Set custom tags
      if (context.userRole) {
        scope.setTag('user_role', context.userRole);
      }

      if (context.action) {
        scope.setTag('action', context.action);
      }

      // Set extra data
      scope.setExtras(context);
    }

    Sentry.captureException(error);
  });
};

/**
 * Capture a message with severity level
 */
export const captureMessage = (
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
  context?: MonitoringContext
): void => {
  if (!Sentry) {
    console.log(`[${level.toUpperCase()}] ${message}`, context);
    return;
  }

  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(context);
    }
    Sentry.captureMessage(message, level);
  });
};

/**
 * Start a performance transaction
 */
export const startTransaction = (
  name: string,
  op: string
): { finish: () => void } => {
  if (!Sentry) {
    return { finish: () => {} };
  }

  const transaction = Sentry.startInactiveSpan({
    name,
    op,
  });

  return {
    finish: () => transaction?.end(),
  };
};

/**
 * Add breadcrumb for debugging
 */
export const addBreadcrumb = (
  message: string,
  category: string,
  data?: Record<string, unknown>
): void => {
  if (!Sentry) {
    return;
  }

  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
    timestamp: Date.now() / 1000,
  });
};

export default {
  initMonitoring,
  sentryErrorHandler,
  sentryRequestHandler,
  captureError,
  captureMessage,
  startTransaction,
  addBreadcrumb,
};
