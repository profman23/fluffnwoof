import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { AuthRequest, AuthUser } from '../types';
import { AppError } from './errorHandler';
import { UserRole } from '@prisma/client';
import { permissionService } from '../services/permissionService';
import { screenPermissionService } from '../services/screenPermissionService';

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new AppError('Unauthorized. Please login', 401);
    }

    const decoded = jwt.verify(token, config.jwt.secret) as AuthUser;
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError('You do not have permission to perform this action', 403);
    }

    next();
  };
};

// New permission-based authorization middleware
export const requirePermission = (...permissions: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      // ADMIN has full access to everything - skip permission check
      if (req.user.role === 'ADMIN') {
        return next();
      }

      const userPermissions = await permissionService.getUserPermissions(req.user.id);

      const hasPermission = permissions.some((p) => userPermissions.includes(p));

      if (!hasPermission) {
        throw new AppError('You do not have permission to perform this action', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Check multiple permissions (AND logic - requires all permissions)
export const requireAllPermissions = (...permissions: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      // ADMIN has full access to everything - skip permission check
      if (req.user.role === 'ADMIN') {
        return next();
      }

      const userPermissions = await permissionService.getUserPermissions(req.user.id);

      const hasAllPermissions = permissions.every((p) => userPermissions.includes(p));

      if (!hasAllPermissions) {
        throw new AppError('You do not have permission to perform this action', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Screen-based permission middlewares

// Require minimum Read access to screen
export const requireScreenAccess = (screenName: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      // ADMIN has full access to everything - skip permission check
      if (req.user.role === 'ADMIN') {
        (req as any).screenPermissionLevel = 'full';
        return next();
      }

      const canAccess = await screenPermissionService.canAccessScreen(req.user.id, screenName);

      if (!canAccess) {
        throw new AppError('You do not have permission to access this screen', 403);
      }

      // Store permission level in request for later use (optional)
      const permissionLevel = await screenPermissionService.getScreenPermission(
        req.user.id,
        screenName
      );
      (req as any).screenPermissionLevel = permissionLevel;

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Require Full Control access to screen
export const requireScreenModify = (screenName: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      // ADMIN has full access to everything - skip permission check
      if (req.user.role === 'ADMIN') {
        return next();
      }

      const canModify = await screenPermissionService.canModifyScreen(req.user.id, screenName);

      if (!canModify) {
        throw new AppError('You do not have permission to modify this screen', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
