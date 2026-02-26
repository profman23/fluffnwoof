import api from './client';
import { PaymentMethod, InvoiceStatus } from '../types';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  priceBeforeTax?: number;
  taxRate: number;
  discount: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  status: InvoiceStatus;
  isFinalized: boolean;
  finalizedAt?: string;
  notes?: string;
  ownerId: string;
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  };
  appointmentId?: string;
  appointment?: {
    id: string;
    appointmentDate: string;
    appointmentTime: string;
    pet?: {
      id: string;
      name: string;
      species: string;
    };
  };
  items: InvoiceItem[];
  payments: Payment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceInput {
  ownerId: string;
  appointmentId?: string;
  dueDate?: string;
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

export interface AddItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  priceBeforeTax?: number;
  taxRate?: number;
  discount?: number;
}

export interface AddPaymentInput {
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export const invoicesApi = {
  // Create invoice
  create: async (data: CreateInvoiceInput): Promise<Invoice> => {
    const response = await api.post('/invoices', data);
    return response.data;
  },

  // Get invoice by ID
  getById: async (id: string): Promise<Invoice> => {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  },

  // Get invoice by appointment ID
  getByAppointmentId: async (appointmentId: string): Promise<Invoice | null> => {
    try {
      const response = await api.get(`/invoices/appointment/${appointmentId}`);
      return response.data;
    } catch (error: unknown) {
      // Return null if no invoice found
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 404) {
          return null;
        }
      }
      throw error;
    }
  },

  // Update invoice
  update: async (id: string, data: { notes?: string; dueDate?: string }): Promise<Invoice> => {
    const response = await api.put(`/invoices/${id}`, data);
    return response.data;
  },

  // Delete invoice
  delete: async (id: string): Promise<void> => {
    await api.delete(`/invoices/${id}`);
  },

  // Add item to invoice
  addItem: async (invoiceId: string, data: AddItemInput): Promise<InvoiceItem> => {
    const response = await api.post(`/invoices/${invoiceId}/items`, data);
    return response.data;
  },

  // Update invoice item
  updateItem: async (itemId: string, data: Partial<AddItemInput>): Promise<InvoiceItem> => {
    const response = await api.put(`/invoices/items/${itemId}`, data);
    return response.data;
  },

  // Remove item from invoice
  removeItem: async (itemId: string): Promise<void> => {
    await api.delete(`/invoices/items/${itemId}`);
  },

  // Add payment to invoice
  addPayment: async (invoiceId: string, data: AddPaymentInput): Promise<Payment> => {
    const response = await api.post(`/invoices/${invoiceId}/payments`, data);
    return response.data;
  },

  // Remove payment from invoice
  removePayment: async (paymentId: string): Promise<void> => {
    await api.delete(`/invoices/payments/${paymentId}`);
  },

  // Finalize invoice - lock it and move appointment to COMPLETED
  finalize: async (id: string): Promise<Invoice> => {
    const response = await api.patch(`/invoices/${id}/finalize`);
    return response.data.data;
  },
};
