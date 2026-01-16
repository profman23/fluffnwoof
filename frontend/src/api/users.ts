import api from './client';
import { User } from '../types';

export interface CreateUserInput {
  email: string;
  password: string;
  roleId: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface UpdateUserInput {
  email?: string;
  roleId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface PaginatedUsers {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
}

export const usersApi = {
  /**
   * Get all users with pagination and search
   */
  getAll: async (page: number = 1, limit: number = 50, search?: string): Promise<PaginatedUsers> => {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));
    if (search) {
      params.append('search', search);
    }
    const response = await api.get(`/users?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get user by ID
   */
  getById: async (id: string): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data.data;
  },

  /**
   * Create a new user
   */
  create: async (data: CreateUserInput): Promise<User> => {
    const response = await api.post('/users', data);
    return response.data.data;
  },

  /**
   * Update user
   */
  update: async (id: string, data: UpdateUserInput): Promise<User> => {
    const response = await api.put(`/users/${id}`, data);
    return response.data.data;
  },

  /**
   * Deactivate user (soft delete)
   */
  deactivate: async (id: string): Promise<void> => {
    await api.patch(`/users/${id}/deactivate`);
  },

  /**
   * Reactivate user
   */
  reactivate: async (id: string): Promise<void> => {
    await api.patch(`/users/${id}/reactivate`);
  },

  /**
   * Get user statistics
   */
  getStatistics: async () => {
    const response = await api.get('/users/statistics');
    return response.data.data;
  },

  /**
   * Change user password (Admin reset)
   */
  changePassword: async (id: string, newPassword: string): Promise<void> => {
    await api.patch(`/users/${id}/password`, { newPassword });
  },
};
