import prisma from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import { InvoiceStatus } from '@prisma/client';
import { nextCreditNoteNumber } from '../utils/codeGenerator';

interface ListParams {
  startDateTime?: string;
  endDateTime?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface ListInvoicesParams {
  search?: string;
  page?: number;
  limit?: number;
}

const ownerSelect = {
  id: true,
  firstName: true,
  lastName: true,
  phone: true,
  customerCode: true,
} as const;

export const creditNoteService = {
  /**
   * Create a credit note that fully cancels a finalized invoice.
   * - Only finalized invoices can be credited (business rule).
   * - One credit note per invoice (enforced by unique invoiceId + status check).
   * - The credit note amount equals the full invoice total (full reversal).
   * - The original invoice, its items and payments are KEPT for the audit trail;
   *   only its status flips to CREDITED.
   * - Both writes happen inside a transaction (atomic — all or nothing).
   */
  async create(invoiceId: string, reason: string | undefined, userId: string | undefined) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { id: true, ownerId: true, totalAmount: true, isFinalized: true, status: true },
    });

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    if (!invoice.isFinalized) {
      throw new AppError('Only finalized invoices can be credited', 400);
    }

    if (invoice.status === InvoiceStatus.CREDITED) {
      throw new AppError('This invoice has already been credited', 400);
    }

    // Mint the serial before the transaction (atomicNextNumber is itself atomic).
    const creditNoteNumber = await nextCreditNoteNumber();

    const [creditNote] = await prisma.$transaction([
      prisma.creditNote.create({
        data: {
          creditNoteNumber,
          amount: invoice.totalAmount,
          reason: reason || null,
          invoiceId: invoice.id,
          ownerId: invoice.ownerId,
          createdById: userId || null,
        },
        include: {
          owner: { select: ownerSelect },
          invoice: { select: { id: true, invoiceNumber: true, totalAmount: true, issueDate: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: InvoiceStatus.CREDITED },
      }),
    ]);

    return creditNote;
  },

  /**
   * List issued credit notes (paginated), filtered by createdAt range + owner search.
   */
  async list(params: ListParams) {
    const { startDateTime, endDateTime, search, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (startDateTime || endDateTime) {
      where.createdAt = {};
      if (startDateTime) where.createdAt.gte = new Date(startDateTime);
      if (endDateTime) where.createdAt.lte = new Date(endDateTime);
    }
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { creditNoteNumber: { contains: q, mode: 'insensitive' } },
        { invoice: { invoiceNumber: { contains: q, mode: 'insensitive' } } },
        { owner: { firstName: { contains: q, mode: 'insensitive' } } },
        { owner: { lastName: { contains: q, mode: 'insensitive' } } },
        { owner: { phone: { contains: q } } },
      ];
    }

    const [total, data] = await Promise.all([
      prisma.creditNote.count({ where }),
      prisma.creditNote.findMany({
        where,
        include: {
          owner: { select: ownerSelect },
          invoice: { select: { id: true, invoiceNumber: true, totalAmount: true, issueDate: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async findById(id: string) {
    const creditNote = await prisma.creditNote.findUnique({
      where: { id },
      include: {
        owner: { select: ownerSelect },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
            paidAmount: true,
            issueDate: true,
            items: true,
          },
        },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!creditNote) {
      throw new AppError('Credit note not found', 404);
    }

    return creditNote;
  },

  /**
   * List finalized invoices that can still be credited (not already CREDITED),
   * so the UI can offer them for selection. Paginated + owner/number search.
   */
  async listCreditableInvoices(params: ListInvoicesParams) {
    const { search, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      isFinalized: true,
    };
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { invoiceNumber: { contains: q, mode: 'insensitive' } },
        { owner: { firstName: { contains: q, mode: 'insensitive' } } },
        { owner: { lastName: { contains: q, mode: 'insensitive' } } },
        { owner: { phone: { contains: q } } },
      ];
    }

    const [total, data] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
        where,
        select: {
          id: true,
          invoiceNumber: true,
          totalAmount: true,
          paidAmount: true,
          status: true,
          issueDate: true,
          owner: { select: ownerSelect },
        },
        orderBy: { issueDate: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  },
};
