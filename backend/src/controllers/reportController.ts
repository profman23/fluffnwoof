import { Request, Response } from 'express';
import { reportService } from '../services/reportService';

export const reportController = {
  getNextAppointments: async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, vetId, customerCode, phone, page, limit } = req.query;

      const result = await reportService.getNextAppointments({
        startDate: startDate as string,
        endDate: endDate as string,
        vetId: vetId as string,
        customerCode: customerCode as string,
        phone: phone as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
      });

      res.json(result);
    } catch (error) {
      console.error('Error fetching next appointments report:', error);
      res.status(500).json({ error: 'Failed to fetch appointments report' });
    }
  },
};
