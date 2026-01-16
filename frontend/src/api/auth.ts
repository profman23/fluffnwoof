import apiClient from './client';
import { ApiResponse, AuthResponse } from '../types';

export const authApi = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', {
      email,
      password,
    });
    return response.data.data!;
  },

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return response.data.data!;
  },

  async getProfile() {
    const response = await apiClient.get('/auth/profile');
    return response.data.data;
  },

  async logout() {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  async getMyPermissions(): Promise<string[]> {
    const response = await apiClient.get<ApiResponse<{ permissions: string[] }>>(
      '/auth/permissions'
    );
    return response.data.data!.permissions;
  },
};
