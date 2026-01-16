import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { auditService } from '../services/auditService';

// Helper to convert HTTP method to audit action
function getActionFromMethod(method: string): 'CREATE' | 'UPDATE' | 'DELETE' | 'READ' {
  switch (method.toUpperCase()) {
    case 'POST':
      return 'CREATE';
    case 'PUT':
    case 'PATCH':
      return 'UPDATE';
    case 'DELETE':
      return 'DELETE';
    case 'GET':
    default:
      return 'READ';
  }
}

// Helper to extract resource ID from response or params
function extractIdFromResponse(data: any): string | undefined {
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      return undefined;
    }
  }

  if (data && typeof data === 'object') {
    return data.id || data.data?.id;
  }

  return undefined;
}

/**
 * Audit middleware - automatically logs all operations
 */
export const auditMiddleware = (resource: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalSend = res.send;

    res.send = function (data: any) {
      // Log only on successful operations (2xx status) and when user is authenticated
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user?.id) {
        const action = getActionFromMethod(req.method);
        const resourceId = req.params.id || extractIdFromResponse(data);

        // Don't wait for audit log to complete
        auditService
          .log({
            userId: req.user.id,
            action,
            resource,
            resourceId,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
          })
          .catch((err) => console.error('Audit log failed:', err));
      }

      // Call original send
      return originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Audit middleware with details - logs operations with additional details
 */
export const auditWithDetails = (resource: string, detailsExtractor?: (req: AuthRequest) => any) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalSend = res.send;

    res.send = function (data: any) {
      // Log only on successful operations (2xx status) and when user is authenticated
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user?.id) {
        const action = getActionFromMethod(req.method);
        const resourceId = req.params.id || extractIdFromResponse(data);
        const details = detailsExtractor ? detailsExtractor(req) : undefined;

        // Don't wait for audit log to complete
        auditService
          .log({
            userId: req.user.id,
            action,
            resource,
            resourceId,
            details,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
          })
          .catch((err) => console.error('Audit log failed:', err));
      }

      // Call original send
      return originalSend.call(this, data);
    };

    next();
  };
};
