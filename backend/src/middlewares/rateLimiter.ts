import rateLimit from 'express-rate-limit';
import { Request } from 'express';

/**
 * Rate limiter for email check (used during registration to check if email exists)
 * 30 requests per 5 minutes per IP (more lenient since it's just a DB lookup)
 */
export const emailCheckLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30,
  message: {
    success: false,
    message: 'تم تجاوز الحد الأقصى للطلبات. يرجى المحاولة بعد 5 دقائق.',
    messageEn: 'Too many requests. Please try again after 5 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for OTP requests (register, resend-otp, forgot-password, verify-otp)
 * 10 requests per 15 minutes per IP/email
 */
export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: 'تم تجاوز الحد الأقصى للطلبات. يرجى المحاولة بعد 15 دقيقة.',
    messageEn: 'Too many requests. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use email if available, otherwise use IP
    const email = req.body?.email;
    return email || req.ip || 'unknown';
  },
  validate: false,
});

/**
 * Rate limiter for login attempts
 * 10 attempts per 15 minutes per IP/email
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: 'تم تجاوز الحد الأقصى لمحاولات تسجيل الدخول. يرجى المحاولة بعد 15 دقيقة.',
    messageEn: 'Too many login attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const email = req.body?.email;
    return email || req.ip || 'unknown';
  },
  validate: false,
});

/**
 * Rate limiter for registration
 * 20 attempts per hour per IP (increased for development)
 */
export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: {
    success: false,
    message: 'تم تجاوز الحد الأقصى لمحاولات التسجيل. يرجى المحاولة بعد ساعة.',
    messageEn: 'Too many registration attempts. Please try again after 1 hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for password reset
 * 3 attempts per hour per email
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    success: false,
    message: 'تم تجاوز الحد الأقصى لمحاولات إعادة تعيين كلمة المرور. يرجى المحاولة بعد ساعة.',
    messageEn: 'Too many password reset attempts. Please try again after 1 hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const email = req.body?.email;
    return email || req.ip || 'unknown';
  },
  validate: false,
});

/**
 * Rate limiter for booking appointments
 * 10 bookings per hour per customer
 */
export const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    success: false,
    message: 'تم تجاوز الحد الأقصى للحجوزات. يرجى المحاولة بعد ساعة.',
    messageEn: 'Too many booking attempts. Please try again after 1 hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use customer ID from auth token if available
    const customerId = (req as any).customerId;
    return customerId || req.ip || 'unknown';
  },
  validate: false,
});

/**
 * General API rate limiter for portal endpoints
 * 500 requests per 15 minutes per IP (increased for development)
 */
export const portalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Increased from 100 for development
  message: {
    success: false,
    message: 'تم تجاوز الحد الأقصى للطلبات. يرجى المحاولة لاحقاً.',
    messageEn: 'Too many requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export default {
  emailCheckLimiter,
  otpLimiter,
  loginLimiter,
  registrationLimiter,
  passwordResetLimiter,
  bookingLimiter,
  portalApiLimiter,
};
