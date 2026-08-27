import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { creditNoteService } from '../services/creditNoteService';

export const creditNoteController = {
  /**
   * Create a credit note (full cancellation) for a finalized invoice.
   */
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { invoiceId, reason } = req.body;

      if (!invoiceId) {
        return res.status(400).json({ message: 'Invoice ID is required' });
      }

      const creditNote = await creditNoteService.create(invoiceId, reason, req.user?.id);
      res.status(201).json(creditNote);
    } catch (error) {
      next(error);
    }
  },

  /**
   * List issued credit notes (paginated + filters).
   */
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { startDateTime, endDateTime, search, page, limit } = req.query;
      const result = await creditNoteService.list({
        startDateTime: startDateTime as string,
        endDateTime: endDateTime as string,
        search: search as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * List finalized invoices eligible for a credit note (for selection).
   */
  async listCreditableInvoices(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { search, page, limit } = req.query;
      const result = await creditNoteService.listCreditableInvoices({
        search: search as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get a single credit note by ID.
   */
  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const creditNote = await creditNoteService.findById(id);
      res.json(creditNote);
    } catch (error) {
      next(error);
    }
  },
};
