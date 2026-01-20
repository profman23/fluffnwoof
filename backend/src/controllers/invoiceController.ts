import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { invoiceService } from '../services/invoiceService';
import { PaymentMethod } from '@prisma/client';

export const invoiceController = {
  /**
   * Create a new invoice
   */
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { ownerId, appointmentId, dueDate, notes, items } = req.body;

      if (!ownerId) {
        return res.status(400).json({ message: 'Owner ID is required' });
      }

      const invoice = await invoiceService.create({
        ownerId,
        appointmentId,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        notes,
        items,
      });

      res.status(201).json(invoice);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get invoice by ID
   */
  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const invoice = await invoiceService.findById(id);
      res.json(invoice);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get invoice by appointment ID
   */
  async findByAppointmentId(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { appointmentId } = req.params;
      const invoice = await invoiceService.findByAppointmentId(appointmentId);
      res.json(invoice);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update invoice
   */
  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { notes, dueDate } = req.body;

      const invoice = await invoiceService.update(id, {
        notes,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      });

      res.json(invoice);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete invoice
   */
  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await invoiceService.delete(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  /**
   * Add item to invoice
   */
  async addItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { description, quantity, unitPrice, discount } = req.body;

      if (!description || quantity === undefined || unitPrice === undefined) {
        return res.status(400).json({ message: 'Description, quantity, and unitPrice are required' });
      }

      const item = await invoiceService.addItem(id, {
        description,
        quantity: Number(quantity),
        unitPrice: Number(unitPrice),
        discount: discount !== undefined ? Number(discount) : undefined,
      });

      res.status(201).json(item);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update invoice item
   */
  async updateItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { itemId } = req.params;
      const { description, quantity, unitPrice, discount } = req.body;

      const item = await invoiceService.updateItem(itemId, {
        description,
        quantity: quantity !== undefined ? Number(quantity) : undefined,
        unitPrice: unitPrice !== undefined ? Number(unitPrice) : undefined,
        discount: discount !== undefined ? Number(discount) : undefined,
      });

      res.json(item);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Remove item from invoice
   */
  async removeItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { itemId } = req.params;
      await invoiceService.removeItem(itemId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  /**
   * Add payment to invoice
   */
  async addPayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { amount, paymentMethod, notes } = req.body;

      if (amount === undefined || !paymentMethod) {
        return res.status(400).json({ message: 'Amount and payment method are required' });
      }

      // Validate payment method
      const validMethods: PaymentMethod[] = ['CASH', 'CARD', 'MADA', 'TABBY', 'TAMARA', 'BANK_TRANSFER'];
      if (!validMethods.includes(paymentMethod)) {
        return res.status(400).json({ message: 'Invalid payment method' });
      }

      const payment = await invoiceService.addPayment(id, {
        amount: Number(amount),
        paymentMethod,
        notes,
      });

      res.status(201).json(payment);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Remove payment from invoice
   */
  async removePayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { paymentId } = req.params;
      await invoiceService.removePayment(paymentId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  /**
   * Finalize invoice - lock it and move appointment to COMPLETED
   */
  async finalize(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const invoice = await invoiceService.finalize(id);
      res.json({
        success: true,
        message: 'تم إغلاق الفاتورة بنجاح',
        data: invoice,
      });
    } catch (error) {
      next(error);
    }
  },
};
