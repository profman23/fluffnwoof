import { randomUUID } from 'crypto';
import prisma from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import { InvoiceStatus, PaymentMethod } from '@prisma/client';
import { nextInvoiceNumber } from '../utils/codeGenerator';

interface CreateInvoiceInput {
  ownerId: string;
  appointmentId?: string;
  dueDate?: Date;
  notes?: string;
  items?: {
    description: string;
    quantity: number;
    unitPrice: number;
    priceBeforeTax?: number;
    taxRate?: number;
    discount?: number;
  }[];
}

interface AddInvoiceItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  priceBeforeTax?: number;
  taxRate?: number;
  discount?: number;
}

/** Calculate item total: discount on priceBeforeTax, then apply tax */
function calculateItemTotal(priceBeforeTax: number, quantity: number, discount: number, taxRate: number): number {
  const discountedPrice = priceBeforeTax * (1 - discount / 100);
  return quantity * discountedPrice * (1 + taxRate / 100);
}

/**
 * Authoritative guard: invoice items may only be edited while the visit is
 * still in progress. Blocks edits when the invoice is finalized OR the linked
 * appointment has moved to READY_TO_CHECKOUT (control handed to reception).
 * Server-side so no stale/concurrent client can bypass it. Throws 409.
 */
async function assertItemsEditable(invoiceId: string): Promise<void> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { isFinalized: true, appointmentId: true },
  });
  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }
  if (invoice.isFinalized) {
    throw new AppError('Cannot modify a finalized invoice', 409);
  }
  if (invoice.appointmentId) {
    const appt = await prisma.appointment.findUnique({
      where: { id: invoice.appointmentId },
      select: { status: true },
    });
    if (appt?.status === 'READY_TO_CHECKOUT') {
      throw new AppError('Cannot modify items while the appointment is ready for checkout', 409);
    }
  }
}

interface AddPaymentInput {
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export const invoiceService = {
  /**
   * Create a new invoice
   */
  async create(data: CreateInvoiceInput) {
    // Draft invoices get a temporary, unique, non-official number.
    // The official INV-YYYYMMDD-NNNN serial is only minted at finalize(),
    // so the sequential counter is never burned for drafts (gap-free serials).
    const invoiceNumber = `DRAFT-${randomUUID()}`;

    // Calculate total from items (discount before tax)
    let totalAmount = 0;
    const itemsData = data.items?.map((item) => {
      const discount = item.discount || 0;
      const taxRate = item.taxRate ?? 15;
      const priceBeforeTax = item.priceBeforeTax ?? item.unitPrice;
      const totalPrice = calculateItemTotal(priceBeforeTax, item.quantity, discount, taxRate);
      totalAmount += totalPrice;
      return {
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        priceBeforeTax,
        taxRate,
        discount,
        totalPrice,
      };
    }) || [];

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        ownerId: data.ownerId,
        appointmentId: data.appointmentId,
        dueDate: data.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        totalAmount,
        paidAmount: 0,
        status: InvoiceStatus.PENDING,
        notes: data.notes,
        items: {
          create: itemsData,
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        appointment: {
          select: {
            id: true,
            appointmentDate: true,
            appointmentTime: true,
          },
        },
        items: true,
        payments: true,
      },
    });

    return invoice;
  },

  /**
   * Get invoice by ID
   */
  async findById(id: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        appointment: {
          select: {
            id: true,
            appointmentDate: true,
            appointmentTime: true,
            pet: {
              select: {
                id: true,
                name: true,
                species: true,
              },
            },
          },
        },
        items: {
          orderBy: { createdAt: 'asc' },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    return invoice;
  },

  /**
   * Get invoice by appointment ID
   */
  async findByAppointmentId(appointmentId: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { appointmentId },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        items: {
          orderBy: { createdAt: 'asc' },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    return invoice;
  },

  /**
   * Add item to invoice
   */
  async addItem(invoiceId: string, data: AddInvoiceItemInput) {
    // Blocks finalized invoices AND appointments in READY_TO_CHECKOUT (server-side).
    await assertItemsEditable(invoiceId);

    const discount = data.discount || 0;
    const taxRate = data.taxRate ?? 15;
    const priceBeforeTax = data.priceBeforeTax ?? data.unitPrice;
    const totalPrice = calculateItemTotal(priceBeforeTax, data.quantity, discount, taxRate);

    const item = await prisma.invoiceItem.create({
      data: {
        invoiceId,
        description: data.description,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        priceBeforeTax,
        taxRate,
        discount,
        totalPrice,
      },
    });

    // Update invoice total
    await this.recalculateTotal(invoiceId);

    return item;
  },

  /**
   * Update invoice item
   */
  async updateItem(itemId: string, data: Partial<AddInvoiceItemInput>) {
    const item = await prisma.invoiceItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new AppError('Invoice item not found', 404);
    }

    // Block edits to a finalized invoice OR one whose appointment is ready for checkout.
    await assertItemsEditable(item.invoiceId);

    const quantity = data.quantity ?? item.quantity;
    const unitPrice = data.unitPrice ?? item.unitPrice;
    const discount = data.discount ?? item.discount;
    const taxRate = data.taxRate ?? item.taxRate;
    const priceBeforeTax = data.priceBeforeTax ?? item.priceBeforeTax ?? unitPrice;
    const totalPrice = calculateItemTotal(priceBeforeTax, quantity, discount, taxRate);

    const updatedItem = await prisma.invoiceItem.update({
      where: { id: itemId },
      data: {
        description: data.description,
        quantity,
        unitPrice,
        priceBeforeTax,
        taxRate,
        discount,
        totalPrice,
      },
    });

    // Update invoice total
    await this.recalculateTotal(item.invoiceId);

    return updatedItem;
  },

  /**
   * Remove item from invoice
   */
  async removeItem(itemId: string) {
    const item = await prisma.invoiceItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new AppError('Invoice item not found', 404);
    }

    // Block removing items from a finalized invoice OR one ready for checkout.
    await assertItemsEditable(item.invoiceId);

    await prisma.invoiceItem.delete({
      where: { id: itemId },
    });

    // Update invoice total
    await this.recalculateTotal(item.invoiceId);
  },

  /**
   * Add payment to invoice
   */
  async addPayment(invoiceId: string, data: AddPaymentInput) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true },
    });

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    const remainingAmount = invoice.totalAmount - invoice.paidAmount;

    if (Math.round(data.amount * 100) > Math.round(remainingAmount * 100)) {
      throw new AppError('Payment amount exceeds remaining balance', 400);
    }

    const payment = await prisma.payment.create({
      data: {
        invoiceId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
      },
    });

    // Update invoice paid amount and status
    const newPaidAmount = invoice.paidAmount + data.amount;
    let newStatus: InvoiceStatus;

    if (Math.round(newPaidAmount * 100) >= Math.round(invoice.totalAmount * 100)) {
      newStatus = InvoiceStatus.PAID;
    } else if (newPaidAmount > 0) {
      newStatus = InvoiceStatus.PARTIALLY_PAID;
    } else {
      newStatus = InvoiceStatus.PENDING;
    }

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
      },
    });

    return payment;
  },

  /**
   * Remove payment from invoice
   */
  async removePayment(paymentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { invoice: true },
    });

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    await prisma.payment.delete({
      where: { id: paymentId },
    });

    // Recalculate paid amount
    const remainingPayments = await prisma.payment.aggregate({
      where: { invoiceId: payment.invoiceId },
      _sum: { amount: true },
    });

    const newPaidAmount = remainingPayments._sum.amount || 0;
    let newStatus: InvoiceStatus;

    if (newPaidAmount >= payment.invoice.totalAmount) {
      newStatus = InvoiceStatus.PAID;
    } else if (newPaidAmount > 0) {
      newStatus = InvoiceStatus.PARTIALLY_PAID;
    } else {
      newStatus = InvoiceStatus.PENDING;
    }

    await prisma.invoice.update({
      where: { id: payment.invoiceId },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
      },
    });
  },

  /**
   * Recalculate invoice total from items
   */
  async recalculateTotal(invoiceId: string) {
    const items = await prisma.invoiceItem.aggregate({
      where: { invoiceId },
      _sum: { totalPrice: true },
    });

    const totalAmount = items._sum.totalPrice || 0;

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) return;

    let newStatus: InvoiceStatus;
    if (invoice.paidAmount >= totalAmount && totalAmount > 0) {
      newStatus = InvoiceStatus.PAID;
    } else if (invoice.paidAmount > 0) {
      newStatus = InvoiceStatus.PARTIALLY_PAID;
    } else {
      newStatus = InvoiceStatus.PENDING;
    }

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        totalAmount,
        status: newStatus,
      },
    });
  },

  /**
   * Update invoice
   */
  async update(id: string, data: { notes?: string; dueDate?: Date }) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    return prisma.invoice.update({
      where: { id },
      data,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        items: true,
        payments: true,
      },
    });
  },

  /**
   * Delete invoice (only if no payments)
   */
  async delete(id: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { payments: true },
    });

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    if (invoice.payments.length > 0) {
      throw new AppError('Cannot delete invoice with payments', 400);
    }

    await prisma.invoice.delete({
      where: { id },
    });
  },

  /**
   * Finalize invoice - lock it and move appointment to COMPLETED
   */
  async finalize(id: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        appointment: true,
      },
    });

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    if (invoice.isFinalized) {
      throw new AppError('Invoice is already finalized', 400);
    }

    // Mint the official serial only now (at finalize), and only if this is still
    // a draft. If a legacy row already carries an INV- number, keep it (never
    // burn a second serial for the same invoice).
    const officialNumber = invoice.invoiceNumber.startsWith('DRAFT-')
      ? await nextInvoiceNumber()
      : invoice.invoiceNumber;

    // Conditional write closes the check-then-act (TOCTOU) window: only ONE
    // concurrent finalize call (e.g. double-click) will match isFinalized:false
    // and win. The loser sees count === 0 and is rejected — guaranteeing a single
    // serial is burned per invoice.
    const result = await prisma.invoice.updateMany({
      where: { id, isFinalized: false },
      data: {
        isFinalized: true,
        finalizedAt: new Date(),
        invoiceNumber: officialNumber,
      },
    });

    if (result.count === 0) {
      throw new AppError('Invoice is already finalized', 400);
    }

    // Move appointment to COMPLETED if exists (winning path only)
    if (invoice.appointmentId) {
      await prisma.appointment.update({
        where: { id: invoice.appointmentId },
        data: { status: 'COMPLETED' },
      });
    }

    // Re-fetch the finalized invoice with the relations the caller expects
    const updatedInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        items: true,
        payments: true,
      },
    });

    return updatedInvoice;
  },
};
