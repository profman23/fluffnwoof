import prisma from '../lib/prisma';
import { InvoiceStatus, PaymentMethod } from '@prisma/client';

interface GetNextAppointmentsParams {
  startDate?: string;
  endDate?: string;
  vetId?: string;
  customerCode?: string;
  phone?: string;
  page?: number;
  limit?: number;
}

interface GetSalesReportParams {
  startDateTime?: string;
  endDateTime?: string;
  status?: string;
  paymentMethod?: string;
  page?: number;
  limit?: number;
}

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const reportService = {
  getNextAppointments: async (params: GetNextAppointmentsParams): Promise<PaginatedResult<any>> => {
    const { startDate, endDate, vetId, customerCode, phone, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      status: {
        in: ['SCHEDULED', 'CONFIRMED'],
      },
    };

    // Date filtering - تحويل التاريخ لـ ISO DateTime
    if (startDate || endDate) {
      where.appointmentDate = {};
      if (startDate) {
        where.appointmentDate.gte = new Date(startDate + 'T00:00:00.000Z');
      }
      if (endDate) {
        where.appointmentDate.lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }

    // Vet filtering
    if (vetId) {
      where.vetId = vetId;
    }

    // Customer code filtering
    if (customerCode) {
      where.pet = {
        ...where.pet,
        owner: {
          customerCode: { contains: customerCode, mode: 'insensitive' },
        },
      };
    }

    // Phone filtering
    if (phone) {
      where.pet = {
        ...where.pet,
        owner: {
          ...where.pet?.owner,
          phone: { contains: phone },
        },
      };
    }

    // Get total count
    const total = await prisma.appointment.count({ where });

    // Get appointments with pagination
    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
            petCode: true,
            daftraCode: true,
            microchipId: true,
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
                customerCode: true,
              },
            },
          },
        },
        vet: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { appointmentDate: 'asc' },
        { appointmentTime: 'asc' },
      ],
      skip,
      take: limit,
    });

    return {
      data: appointments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  getSalesReport: async (params: GetSalesReportParams) => {
    const { startDateTime, endDateTime, status, paymentMethod, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    // Build invoice where clause
    const invoiceWhere: any = {};

    // DateTime filtering — supports cross-day ranges (e.g. Ramadan: 10AM to 2:30AM next day)
    if (startDateTime || endDateTime) {
      invoiceWhere.issueDate = {};
      if (startDateTime) {
        invoiceWhere.issueDate.gte = new Date(startDateTime);
      }
      if (endDateTime) {
        invoiceWhere.issueDate.lte = new Date(endDateTime);
      }
    }

    // Status filtering
    if (status && Object.values(InvoiceStatus).includes(status as InvoiceStatus)) {
      invoiceWhere.status = status as InvoiceStatus;
    }

    // Payment where — filter payments by their invoice's issueDate
    const paymentWhere: any = {};
    if (startDateTime || endDateTime) {
      paymentWhere.invoice = { issueDate: invoiceWhere.issueDate };
    }
    if (paymentMethod && Object.values(PaymentMethod).includes(paymentMethod as PaymentMethod)) {
      paymentWhere.paymentMethod = paymentMethod as PaymentMethod;
    }

    // 4 parallel queries for performance
    const [invoiceStats, paymentStats, paymentMethodBreakdown, total, invoices] = await Promise.all([
      // 1. Invoice aggregate stats
      prisma.invoice.aggregate({
        where: invoiceWhere,
        _sum: { totalAmount: true, paidAmount: true },
        _count: { id: true },
      }),

      // 2. Payment total
      prisma.payment.aggregate({
        where: paymentWhere,
        _sum: { amount: true },
      }),

      // 3. Payment method breakdown
      prisma.payment.groupBy({
        by: ['paymentMethod'],
        where: paymentWhere,
        _sum: { amount: true },
        _count: { id: true },
      }),

      // 4a. Invoice count for pagination
      prisma.invoice.count({ where: invoiceWhere }),

      // 4b. Paginated invoices with relations
      prisma.invoice.findMany({
        where: invoiceWhere,
        include: {
          items: {
            select: {
              id: true,
              description: true,
              quantity: true,
              unitPrice: true,
              priceBeforeTax: true,
              taxRate: true,
              discount: true,
              totalPrice: true,
            },
          },
          payments: {
            select: {
              id: true,
              amount: true,
              paymentMethod: true,
              paymentDate: true,
            },
          },
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          appointment: {
            select: {
              id: true,
              pet: {
                select: {
                  id: true,
                  name: true,
                  species: true,
                },
              },
            },
          },
        },
        orderBy: { issueDate: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const totalSales = invoiceStats._sum.totalAmount || 0;
    const totalPayments = paymentStats._sum.amount || 0;
    const outstandingBalance = totalSales - totalPayments;

    return {
      stats: {
        totalSales,
        totalPayments,
        outstandingBalance,
        invoiceCount: invoiceStats._count.id,
        paymentMethodBreakdown: paymentMethodBreakdown.map((pm) => ({
          method: pm.paymentMethod,
          amount: pm._sum.amount || 0,
          count: pm._count.id,
        })),
      },
      invoices: {
        data: invoices,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getAcquisitionReport(params: {
    startDate?: string;
    endDate?: string;
    firstInvoiceOnly?: boolean;
  }) {
    const { startDate, endDate, firstInvoiceOnly = true } = params;

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    // Get owners with referralSource created in date range
    const owners = await prisma.owner.findMany({
      where: {
        referralSource: { not: null },
        ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        referralSource: true,
        customerCode: true,
        createdAt: true,
      },
    });

    // For each owner, get invoices
    const ownerInvoices = await Promise.all(
      owners.map(async (owner) => {
        const invoiceWhere: any = {
          ownerId: owner.id,
          isFinalized: true,
        };

        let invoices;
        if (firstInvoiceOnly) {
          const firstInvoice = await prisma.invoice.findFirst({
            where: invoiceWhere,
            orderBy: { issueDate: 'asc' },
            include: {
              items: { select: { priceBeforeTax: true, quantity: true, taxRate: true, totalPrice: true } },
            },
          });
          invoices = firstInvoice ? [firstInvoice] : [];
        } else {
          invoices = await prisma.invoice.findMany({
            where: invoiceWhere,
            include: {
              items: { select: { priceBeforeTax: true, quantity: true, taxRate: true, totalPrice: true } },
            },
          });
        }

        const totalWithTax = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
        const totalBeforeTax = invoices.reduce((sum, inv) => {
          return sum + inv.items.reduce((itemSum, item) => {
            return itemSum + ((item.priceBeforeTax ?? item.totalPrice / (1 + (item.taxRate ?? 15) / 100)) * item.quantity);
          }, 0);
        }, 0);

        return {
          ownerId: owner.id,
          ownerName: `${owner.firstName} ${owner.lastName}`,
          customerCode: owner.customerCode,
          referralSource: owner.referralSource!,
          createdAt: owner.createdAt.toISOString(),
          totalWithTax,
          totalBeforeTax,
          invoiceCount: invoices.length,
        };
      })
    );

    // Group by referralSource
    const sourceMap = new Map<string, {
      source: string;
      customerCount: number;
      totalWithTax: number;
      totalBeforeTax: number;
      customers: typeof ownerInvoices;
    }>();

    for (const oi of ownerInvoices) {
      const existing = sourceMap.get(oi.referralSource) || {
        source: oi.referralSource,
        customerCount: 0,
        totalWithTax: 0,
        totalBeforeTax: 0,
        customers: [],
      };
      existing.customerCount++;
      existing.totalWithTax += oi.totalWithTax;
      existing.totalBeforeTax += oi.totalBeforeTax;
      existing.customers.push(oi);
      sourceMap.set(oi.referralSource, existing);
    }

    const bySource = Array.from(sourceMap.values())
      .sort((a, b) => b.customerCount - a.customerCount);

    const totalCustomers = owners.length;
    const totalSalesWithTax = ownerInvoices.reduce((sum, oi) => sum + oi.totalWithTax, 0);
    const totalSalesBeforeTax = ownerInvoices.reduce((sum, oi) => sum + oi.totalBeforeTax, 0);

    return {
      summary: {
        totalCustomers,
        totalSalesWithTax: Math.round(totalSalesWithTax * 100) / 100,
        totalSalesBeforeTax: Math.round(totalSalesBeforeTax * 100) / 100,
        averagePerCustomer: totalCustomers > 0 ? Math.round((totalSalesWithTax / totalCustomers) * 100) / 100 : 0,
      },
      bySource,
      customers: ownerInvoices,
    };
  },
};
