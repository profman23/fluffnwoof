// ══════════════════════════════════════════════════════════════
// FluffNwoof Backend - Security Middleware
// Security headers and rate limiting configuration
// ══════════════════════════════════════════════════════════════

import { Express, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

/**
 * Rate limiting messages in both languages
 */
const rateLimitMessages = {
  general: {
    en: 'Too many requests, please try again later',
    ar: 'طلبات كثيرة جداً، يرجى المحاولة لاحقاً',
  },
  auth: {
    en: 'Too many login attempts, please try again later',
    ar: 'محاولات تسجيل دخول كثيرة، يرجى المحاولة لاحقاً',
  },
};

/**
 * Security headers middleware
 * Adds important security headers to all responses
 */
export const securityHeaders = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS filter in browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Control referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy (formerly Feature-Policy)
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self), payment=()'
  );

  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');

  next();
};

/**
 * Content Security Policy middleware
 * Note: May need adjustment based on frontend requirements
 */
export const contentSecurityPolicy = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https://res.cloudinary.com blob:",
    "connect-src 'self' https://api.cloudinary.com wss:",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  res.setHeader('Content-Security-Policy', cspDirectives);
  next();
};

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: rateLimitMessages.general.ar,
    messageEn: rateLimitMessages.general.en,
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path.startsWith('/health');
  },
});

/**
 * Strict rate limiter for authentication endpoints
 * 5 attempts per 15 minutes per IP
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: rateLimitMessages.auth.ar,
    messageEn: rateLimitMessages.auth.en,
  },
  skipSuccessfulRequests: true, // Only count failed attempts
});

/**
 * Password reset rate limiter
 * 3 attempts per hour per IP
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'طلبات استعادة كلمة المرور كثيرة، يرجى المحاولة لاحقاً',
    messageEn: 'Too many password reset requests, please try again later',
  },
});

/**
 * SMS sending rate limiter
 * 10 SMS per hour per IP
 */
export const smsRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'تم تجاوز الحد الأقصى لإرسال الرسائل النصية',
    messageEn: 'SMS rate limit exceeded',
  },
});

/**
 * Apply all security middlewares to the app
 */
export const setupSecurity = (app: Express): void => {
  // Apply security headers to all requests
  app.use(securityHeaders);

  // Apply general rate limiting to API routes
  app.use('/api/', generalRateLimiter);

  // Apply strict rate limiting to auth endpoints
  app.use('/api/auth/login', authRateLimiter);
  app.use('/api/auth/register', authRateLimiter);
  app.use('/api/portal/auth', authRateLimiter);

  // Apply password reset rate limiting
  app.use('/api/auth/forgot-password', passwordResetRateLimiter);
  app.use('/api/auth/reset-password', passwordResetRateLimiter);

  // Apply SMS rate limiting
  app.use('/api/sms/send', smsRateLimiter);

  console.log('🔒 Security middleware configured');
};

/**
 * CORS configuration helper
 */
export const getCorsOptions = (allowedOrigins: string | string[]) => {
  const origins = Array.isArray(allowedOrigins)
    ? allowedOrigins
    : allowedOrigins.split(',').map((o) => o.trim());

  return {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) {
        callback(null, true);
        return;
      }

      if (origins.includes(origin) || origins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Accept-Language',
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
    maxAge: 86400, // 24 hours
  };
};

export default {
  setupSecurity,
  securityHeaders,
  contentSecurityPolicy,
  generalRateLimiter,
  authRateLimiter,
  passwordResetRateLimiter,
  smsRateLimiter,
  getCorsOptions,
};
