import { Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboardService';
import { AuthRequest } from '../types';

export const dashboardController = {
  async getDashboardData(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await dashboardService.getDashboardData();

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
      const stats = await dashboardService.getStats();

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
      const appointments = await dashboardService.getUpcomingAppointments(limit);

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
      const vaccinations = await dashboardService.getUpcomingVaccinations(limit);

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
      const stats = await dashboardService.getVetPerformanceStats();

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

      const analytics = await dashboardService.getAnalytics(start, end);

      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  },
};
