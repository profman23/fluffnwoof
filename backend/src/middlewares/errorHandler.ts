import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

interface BilingualMessage {
  ar: string;
  en: string;
}

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  errorCode?: string;
  messageEn?: string;

  constructor(message: string, statusCode: number, errorCode?: string, messageEn?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errorCode = errorCode;
    this.messageEn = messageEn;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Bilingual error messages
const errorMessages: Record<string, BilingualMessage> = {
  serverError: { ar: 'حدث خطأ في الخادم', en: 'Server error occurred' },
  recordCodeConflict: { ar: 'حدث تعارض أثناء إغلاق السجل. يرجى المحاولة مرة أخرى.', en: 'Conflict occurred while closing record. Please try again.' },
  appointmentHasRecord: { ar: 'هذا الموعد لديه سجل طبي بالفعل', en: 'This appointment already has a medical record' },
  emailExists: { ar: 'البريد الإلكتروني مستخدم بالفعل', en: 'Email is already in use' },
  phoneExists: { ar: 'رقم الهاتف مستخدم بالفعل', en: 'Phone number is already in use' },
  recordExists: { ar: 'هذا السجل موجود بالفعل', en: 'This record already exists' },
  recordNotFound: { ar: 'السجل المطلوب غير موجود', en: 'Requested record not found' },
  relationError: { ar: 'خطأ في العلاقة بين البيانات', en: 'Data relationship error' },
  invalidData: { ar: 'بيانات غير صالحة', en: 'Invalid data' },
  dbConnectionError: { ar: 'خطأ في الاتصال بقاعدة البيانات', en: 'Database connection error' },
  invalidToken: { ar: 'رمز التحقق غير صالح', en: 'Invalid authentication token' },
  tokenExpired: { ar: 'انتهت صلاحية رمز التحقق', en: 'Authentication token expired' },
  notFound: { ar: 'المسار غير موجود', en: 'Route not found' },
};

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Default error
  let statusCode = 500;
  let message = errorMessages.serverError.ar;
  let messageEn = errorMessages.serverError.en;

  // Custom AppError
  let errorCode: string | undefined;
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    messageEn = err.messageEn || err.message; // Fallback to Arabic if no English
    errorCode = err.errorCode;
  }

  // Prisma errors - Known request errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = 400;

    if (err.code === 'P2002') {
      // Get the field(s) that caused the unique constraint violation
      const target = err.meta?.target as string[] | string | undefined;
      const targetFields = Array.isArray(target) ? target : target ? [target] : [];

      // Specific error messages based on the field
      if (targetFields.some(f => f.includes('recordCode'))) {
        statusCode = 409; // Conflict
        message = errorMessages.recordCodeConflict.ar;
        messageEn = errorMessages.recordCodeConflict.en;
      } else if (targetFields.some(f => f.includes('appointmentId'))) {
        message = errorMessages.appointmentHasRecord.ar;
        messageEn = errorMessages.appointmentHasRecord.en;
      } else if (targetFields.some(f => f.includes('email'))) {
        message = errorMessages.emailExists.ar;
        messageEn = errorMessages.emailExists.en;
      } else if (targetFields.some(f => f.includes('phone'))) {
        message = errorMessages.phoneExists.ar;
        messageEn = errorMessages.phoneExists.en;
      } else {
        message = errorMessages.recordExists.ar;
        messageEn = errorMessages.recordExists.en;
      }
    } else if (err.code === 'P2025') {
      message = errorMessages.recordNotFound.ar;
      messageEn = errorMessages.recordNotFound.en;
    } else if (err.code === 'P2003') {
      message = errorMessages.relationError.ar;
      messageEn = errorMessages.relationError.en;
    }
  }

  // Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = errorMessages.invalidData.ar;
    messageEn = errorMessages.invalidData.en;
  }

  // Prisma initialization errors (database connection issues)
  if (err instanceof Prisma.PrismaClientInitializationError) {
    statusCode = 503;
    message = errorMessages.dbConnectionError.ar;
    messageEn = errorMessages.dbConnectionError.en;
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
    messageEn = err.message;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = errorMessages.invalidToken.ar;
    messageEn = errorMessages.invalidToken.en;
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = errorMessages.tokenExpired.ar;
    messageEn = errorMessages.tokenExpired.en;
  }

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    messageEn,
    ...(errorCode && { errorCode }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(
    `المسار ${req.originalUrl} غير موجود`,
    404,
    'NOT_FOUND',
    `Route ${req.originalUrl} not found`
  );
  next(error);
};
