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
    discount?: number;
  }[];
}

interface AddInvoiceItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
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
    const invoiceNumber = await nextInvoiceNumber();

    // Calculate total from items (with discount)
    let totalAmount = 0;
    const itemsData = data.items?.map((item) => {
      const discount = item.discount || 0;
      const subtotal = item.quantity * item.unitPrice;
      const totalPrice = subtotal * (1 - discount / 100);
      totalAmount += totalPrice;
      return {
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
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
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    const discount = data.discount || 0;
    const subtotal = data.quantity * data.unitPrice;
    const totalPrice = subtotal * (1 - discount / 100);

    const item = await prisma.invoiceItem.create({
      data: {
        invoiceId,
        description: data.description,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
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

    const quantity = data.quantity ?? item.quantity;
    const unitPrice = data.unitPrice ?? item.unitPrice;
    const discount = data.discount ?? item.discount;
    const subtotal = quantity * unitPrice;
    const totalPrice = subtotal * (1 - discount / 100);

    const updatedItem = await prisma.invoiceItem.update({
      where: { id: itemId },
      data: {
        description: data.description,
        quantity,
        unitPrice,
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

    if (data.amount > remainingAmount) {
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

    if (newPaidAmount >= invoice.totalAmount) {
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

    // Update invoice to finalized
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        isFinalized: true,
        finalizedAt: new Date(),
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
        items: true,
        payments: true,
      },
    });

    // Move appointment to COMPLETED if exists
    if (invoice.appointmentId) {
      await prisma.appointment.update({
        where: { id: invoice.appointmentId },
        data: { status: 'COMPLETED' },
      });
    }

    return updatedInvoice;
  },
};
