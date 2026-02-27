import api from './client';
import { FlowBoardAppointment, PaymentMethod, InvoiceStatus } from '../types';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetNextAppointmentsParams {
  startDate?: string;
  endDate?: string;
  vetId?: string;
  customerCode?: string;
  phone?: string;
  page?: number;
  limit?: number;
}

export interface GetSalesReportParams {
  startDateTime?: string;
  endDateTime?: string;
  status?: InvoiceStatus | '';
  paymentMethod?: PaymentMethod | '';
  page?: number;
  limit?: number;
}

export interface PaymentMethodBreakdown {
  method: PaymentMethod;
  amount: number;
  count: number;
}

export interface SalesReportStats {
  totalSales: number;
  totalPayments: number;
  outstandingBalance: number;
  invoiceCount: number;
  paymentMethodBreakdown: PaymentMethodBreakdown[];
}

export interface SalesReportInvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  priceBeforeTax: number | null;
  taxRate: number;
  discount: number;
  totalPrice: number;
}

export interface SalesReportInvoice {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  status: InvoiceStatus;
  isFinalized: boolean;
  notes?: string;
  items: SalesReportInvoiceItem[];
  payments: {
    id: string;
    amount: number;
    paymentMethod: PaymentMethod;
    paymentDate: string;
  }[];
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  appointment?: {
    id: string;
    pet?: {
      id: string;
      name: string;
      species: string;
    };
  } | null;
}

export interface SalesReportResponse {
  stats: SalesReportStats;
  invoices: PaginatedResult<SalesReportInvoice>;
}

export const reportsApi = {
  getNextAppointments: async (params: GetNextAppointmentsParams): Promise<PaginatedResult<FlowBoardAppointment>> => {
    const response = await api.get('/reports/next-appointments', { params });
    return response.data;
  },

  getSalesReport: async (params: GetSalesReportParams): Promise<SalesReportResponse> => {
    const response = await api.get('/reports/sales', { params });
    return response.data;
  },
};
