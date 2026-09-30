import { Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboardService';
import { permissionService } from '../services/permissionService';
import { AuthRequest } from '../types';

/**
 * Resolve the vetId to scope dashboard data by.
 * - A user holding `dashboard.ownOnly` (non-ADMIN) is always locked to their own id;
 *   any `staffId` they pass is ignored (security).
 * - An unscoped user (ADMIN / manager / reception) may optionally filter by `staffId`.
 */
async function resolveDashboardScope(req: AuthRequest): Promise<string | undefined> {
  const ownScope = await permissionService.resolveOwnScope(req.user, 'dashboard.ownOnly');
  if (ownScope) return ownScope; // own-only user: locked to self
  const requestedStaffId = req.query.staffId as string | undefined;
  return requestedStaffId || undefined; // manager's optional pick
}

export const dashboardController = {
  async getDashboardData(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const scopeVetId = await resolveDashboardScope(req);
      const data = await dashboardService.getDashboardData(scopeVetId);

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const scopeVetId = await resolveDashboardScope(req);
      const stats = await dashboardService.getStats(scopeVetId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  },

  async getUpcomingAppointments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const scopeVetId = await resolveDashboardScope(req);
      const appointments = await dashboardService.getUpcomingAppointments(limit, scopeVetId);

      res.status(200).json({
        success: true,
        data: appointments,
      });
    } catch (error) {
      next(error);
    }
  },

  async getUpcomingVaccinations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const scopeVetId = await resolveDashboardScope(req);
      const vaccinations = await dashboardService.getUpcomingVaccinations(limit, scopeVetId);

      res.status(200).json({
        success: true,
        data: vaccinations,
      });
    } catch (error) {
      next(error);
    }
  },

  async getVetPerformance(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const scopeVetId = await resolveDashboardScope(req);
      const stats = await dashboardService.getVetPerformanceStats(scopeVetId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  },

  async getAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;

      // Default to current month if not provided
      const start = startDate
        ? new Date(startDate as string)
        : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const end = endDate
        ? new Date(endDate as string)
        : new Date();

      const scopeVetId = await resolveDashboardScope(req);
      const analytics = await dashboardService.getAnalytics(start, end, scopeVetId);

      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  },
};
