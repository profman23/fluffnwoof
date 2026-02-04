import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { AppError } from './errorHandler';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface CustomerTokenPayload {
  id: string;
  email: string;
  type: 'customer';
}

// Extend Express Request to include customer info
declare global {
  namespace Express {
    interface Request {
      customerId?: string;
      customerEmail?: string;
    }
  }
}

/**
 * Middleware to authenticate customer portal requests
 * Extracts customer ID from JWT token
 */
export const customerAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('يجب تسجيل الدخول', 401);
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as CustomerTokenPayload;

    // Check token type
    if (decoded.type !== 'customer') {
      throw new AppError('رمز غير صالح', 401);
    }

    // Check if owner exists and is verified
    const owner = await prisma.owner.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        isVerified: true,
        portalEnabled: true,
      },
    });

    if (!owner) {
      throw new AppError('الحساب غير موجود', 401);
    }

    if (!owner.isVerified) {
      throw new AppError('الحساب غير مفعل', 401);
    }

    if (!owner.portalEnabled) {
      throw new AppError('تم تعطيل حسابك', 403);
    }

    // Attach customer info to request
    req.customerId = owner.id;
    req.customerEmail = owner.email || undefined;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى', 401));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('رمز غير صالح', 401));
    } else {
      next(error);
    }
  }
};

/**
 * Optional authentication middleware
 * Doesn't throw error if token is missing, just doesn't set customer info
 */
export const optionalCustomerAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as CustomerTokenPayload;

    if (decoded.type === 'customer') {
      const owner = await prisma.owner.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, isVerified: true, portalEnabled: true },
      });

      if (owner && owner.isVerified && owner.portalEnabled) {
        req.customerId = owner.id;
        req.customerEmail = owner.email || undefined;
      }
    }

    next();
  } catch (error) {
    // Ignore token errors for optional auth
    next();
  }
};

export default { customerAuth, optionalCustomerAuth };
