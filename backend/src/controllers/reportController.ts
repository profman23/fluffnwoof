import { Request, Response } from 'express';
import { reportService } from '../services/reportService';
import { AuthRequest } from '../types';
import { permissionService } from '../services/permissionService';

// Sources visible to a Google-restricted (marketing) role.
const GOOGLE_SOURCES = ['GOOGLE_SEARCH', 'GOOGLE_MAPS'];

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

  getSalesReport: async (req: Request, res: Response) => {
    try {
      const { startDateTime, endDateTime, status, paymentMethod, page, limit } = req.query;

      const result = await reportService.getSalesReport({
        startDateTime: startDateTime as string,
        endDateTime: endDateTime as string,
        status: status as string,
        paymentMethod: paymentMethod as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
      });

      res.json(result);
    } catch (error: any) {
      console.error('Error fetching sales report:', error?.message || error);
      res.status(500).json({ error: 'Failed to fetch sales report', details: error?.message });
    }
  },

  getAcquisitionReport: async (req: AuthRequest, res: Response) => {
    try {
      const { startDate, endDate, firstInvoiceOnly, source, startDateTime, endDateTime } = req.query;

      // Server-enforced Google-only restriction (marketing role). ADMIN bypasses.
      // This is the ONLY real security boundary — a restricted user cannot widen the
      // result by passing ?source=INSTAGRAM (or omitting source).
      let allowedSources: string[] | undefined;
      let restricted = false;
      if (req.user && req.user.role !== 'ADMIN') {
        const perms = await permissionService.getUserPermissions(req.user.id);
        if (perms.includes('acquisitionReport.googleOnly')) {
          allowedSources = GOOGLE_SOURCES;
          restricted = true;
        }
      }

      const result = await reportService.getAcquisitionReport({
        startDate: startDate as string,
        endDate: endDate as string,
        firstInvoiceOnly: firstInvoiceOnly !== 'false',
        source: source as string,
        startDateTime: startDateTime as string,
        endDateTime: endDateTime as string,
        allowedSources,
      });

      // Restricted (marketing) role gets aggregates only — strip customer PII (names/codes).
      if (restricted) {
        const r = result as any;
        if (Array.isArray(r.customers)) r.customers = [];
        if (Array.isArray(r.bySource)) {
          r.bySource = r.bySource.map((s: any) => ({ ...s, customers: [] }));
        }
      }

      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('Error fetching acquisition report:', error?.message || error);
      res.status(500).json({ error: 'Failed to fetch acquisition report' });
    }
  },

  getLostCustomersReport: async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, vetId, page, limit } = req.query;

      const result = await reportService.getLostCustomersReport({
        startDate: startDate as string,
        endDate: endDate as string,
        vetId: (vetId as string) || undefined,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
      });

      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('Error fetching lost customers report:', error?.message || error);
      res.status(500).json({ error: 'Failed to fetch lost customers report' });
    }
  },
};
