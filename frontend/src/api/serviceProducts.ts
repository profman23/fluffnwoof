import api from './client';

export interface Category {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceProduct {
  id: string;
  name: string;
  categoryId: string;
  category: Category;
  priceBeforeTax: number;
  taxRate: number;
  priceAfterTax: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceProductInput {
  name: string;
  categoryId: string;
  priceBeforeTax: number;
  taxRate: number;
  priceAfterTax: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const serviceProductsApi = {
  // Categories
  getCategories: async (): Promise<Category[]> => {
    const response = await api.get('/service-products/categories');
    return response.data.data;
  },

  createCategory: async (name: string): Promise<Category> => {
    const response = await api.post('/service-products/categories', { name });
    return response.data.data;
  },

  updateCategory: async (id: string, name: string): Promise<Category> => {
    const response = await api.put(`/service-products/categories/${id}`, { name });
    return response.data.data;
  },

  deleteCategory: async (id: string): Promise<void> => {
    await api.delete(`/service-products/categories/${id}`);
  },

  // Service Products
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
  }): Promise<PaginatedResult<ServiceProduct>> => {
    const response = await api.get('/service-products', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ServiceProduct> => {
    const response = await api.get(`/service-products/${id}`);
    return response.data.data;
  },

  create: async (data: ServiceProductInput): Promise<ServiceProduct> => {
    const response = await api.post('/service-products', data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<ServiceProductInput>): Promise<ServiceProduct> => {
    const response = await api.put(`/service-products/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/service-products/${id}`);
  },

  // Import from Excel
  importFromExcel: async (file: File): Promise<{ success: number; failed: number; errors: string[] }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/service-products/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },
};
