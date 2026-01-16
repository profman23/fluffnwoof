import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { auditService } from '../services/auditService';

export const auditController = {
  /**
   * Get audit logs with filters (userId, resource, action, date range)
   */
  async getAuditLogs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const userId = req.query.userId as string;
      const resource = req.query.resource as string;
      const action = req.query.action as string;
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const result = await auditService.getAuditLogs({
        userId,
        resource,
        action,
        startDate,
        endDate,
        page,
        limit,
      });

      res.json({
        message: 'تم جلب سجل العمليات بنجاح',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all changes for a specific resource
   */
  async getResourceHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { resource, id } = req.params;

      const history = await auditService.getResourceHistory(resource, id);

      res.json({
        message: 'تم جلب تاريخ العمليات بنجاح',
        data: history,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all activities by a specific user
   */
  async getUserActivity(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await auditService.getUserActivity(userId, page, limit);

      res.json({
        message: 'تم جلب نشاط المستخدم بنجاح',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get recent activity (last 100 logs)
   */
  async getRecentActivity(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 100;

      const logs = await auditService.getRecentActivity(limit);

      res.json({
        message: 'تم جلب النشاط الأخير بنجاح',
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get audit statistics
   */
  async getStatistics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const stats = await auditService.getAuditStatistics(startDate, endDate);

      res.json({
        message: 'تم جلب إحصائيات سجل العمليات بنجاح',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  },
};
