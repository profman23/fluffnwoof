import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  errorCode?: string;

  constructor(message: string, statusCode: number, errorCode?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errorCode = errorCode;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Default error
  let statusCode = 500;
  let message = 'حدث خطأ في الخادم';

  // Custom AppError
  let errorCode: string | undefined;
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorCode = err.errorCode;
  }

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = 400;

    if (err.code === 'P2002') {
      message = 'هذا السجل موجود بالفعل';
    } else if (err.code === 'P2025') {
      message = 'السجل المطلوب غير موجود';
    } else if (err.code === 'P2003') {
      message = 'خطأ في العلاقة بين البيانات';
    }
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'رمز التحقق غير صالح';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'انتهت صلاحية رمز التحقق';
  }

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errorCode && { errorCode }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`المسار ${req.originalUrl} غير موجود`, 404);
  next(error);
};
