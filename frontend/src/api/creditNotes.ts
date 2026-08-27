import api from './client';
import { InvoiceStatus } from '../types';
import { PaginatedResult } from './reports';

export interface CreditableInvoice {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  paidAmount: number;
  status: InvoiceStatus;
  issueDate: string;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    customerCode: string;
  };
}

export interface CreditNote {
  id: string;
  creditNoteNumber: string;
  amount: number;
  reason: string | null;
  createdAt: string;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    customerCode: string;
  };
  invoice: {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    issueDate: string;
  };
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

export interface ListCreditNotesParams {
  startDateTime?: string;
  endDateTime?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ListCreditableInvoicesParams {
  search?: string;
  page?: number;
  limit?: number;
}

export const creditNotesApi = {
  listCreditableInvoices: async (
    params: ListCreditableInvoicesParams
  ): Promise<PaginatedResult<CreditableInvoice>> => {
    const response = await api.get('/credit-notes/invoices', { params });
    return response.data;
  },

  list: async (params: ListCreditNotesParams): Promise<PaginatedResult<CreditNote>> => {
    const response = await api.get('/credit-notes', { params });
    return response.data;
  },

  create: async (invoiceId: string, reason?: string): Promise<CreditNote> => {
    const response = await api.post('/credit-notes', { invoiceId, reason });
    return response.data;
  },
};
