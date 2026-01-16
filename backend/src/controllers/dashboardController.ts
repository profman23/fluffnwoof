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
};
