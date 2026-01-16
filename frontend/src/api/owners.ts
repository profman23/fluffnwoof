import api from './client';
import { Owner } from '../types';

export interface CreateOwnerInput {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  nationalId?: string;
  notes?: string;
}

export interface UpdateOwnerInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  address?: string;
  nationalId?: string;
  notes?: string;
}

export interface PaginatedOwners {
  data: Owner[];
  total: number;
  page: number;
  totalPages: number;
}

export const ownersApi = {
  /**
   * Get all owners with pagination and search
   */
  getAll: async (page = 1, limit = 50, search?: string): Promise<PaginatedOwners> => {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));
    if (search) params.append('search', search);
    const response = await api.get(`/owners?${params.toString()}`);
    // Map backend response to frontend expected format
    return {
      data: response.data.data || [],
      total: response.data.pagination?.total || 0,
      page: response.data.pagination?.page || 1,
      totalPages: response.data.pagination?.totalPages || 1,
    };
  },

  /**
   * Get owner by ID
   */
  getById: async (id: string): Promise<Owner> => {
    const response = await api.get(`/owners/${id}`);
    return response.data.data;
  },

  /**
   * Create a new owner
   */
  create: async (data: CreateOwnerInput): Promise<Owner> => {
    const response = await api.post('/owners', data);
    return response.data.data;
  },

  /**
   * Update owner
   */
  update: async (id: string, data: UpdateOwnerInput): Promise<Owner> => {
    const response = await api.put(`/owners/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete owner
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/owners/${id}`);
  },

  /**
   * Search owners by name or phone (for dropdown)
   */
  search: async (query: string, limit = 10): Promise<Owner[]> => {
    const params = new URLSearchParams();
    params.append('search', query);
    params.append('limit', String(limit));
    const response = await api.get(`/owners?${params.toString()}`);
    return response.data.data || [];
  },
};
