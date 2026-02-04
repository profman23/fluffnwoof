import { create } from 'zustand';

export interface Customer {
  id: string;
  customerCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  preferredLang?: string;
}

interface CustomerAuthState {
  customer: Customer | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (customer: Customer, token: string) => void;
  logout: () => void;
  initializeAuth: () => void;
  updateCustomer: (data: Partial<Customer>) => void;
}

export const useCustomerAuthStore = create<CustomerAuthState>((set, get) => ({
  customer: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (customer, token) => {
    localStorage.setItem('customer', JSON.stringify(customer));
    localStorage.setItem('customerToken', token);
    set({ customer, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('customer');
    localStorage.removeItem('customerToken');
    set({ customer: null, token: null, isAuthenticated: false });
  },

  initializeAuth: () => {
    const customer = localStorage.getItem('customer');
    const token = localStorage.getItem('customerToken');

    if (customer && token) {
      set({
        customer: JSON.parse(customer),
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      set({ isLoading: false });
    }
  },

  updateCustomer: (data) => {
    const current = get().customer;
    if (current) {
      const updated = { ...current, ...data };
      localStorage.setItem('customer', JSON.stringify(updated));
      set({ customer: updated });
    }
  },
}));
