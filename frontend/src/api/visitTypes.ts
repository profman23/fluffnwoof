import api from './client';

export interface VisitType {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  duration: number;
  color: string;
  isActive: boolean;
  isSystem: boolean;
  sortOrder: number;
}

export interface VisitTypeInput {
  code?: string;
  nameEn: string;
  nameAr: string;
  duration: number;
  color?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export const visitTypesApi = {
  // Get all visit types
  getAll: async (includeInactive: boolean = false): Promise<VisitType[]> => {
    const response = await api.get(`/visit-types?includeInactive=${includeInactive}`);
    return response.data.data;
  },

  // Get visit type by ID
  getById: async (id: string): Promise<VisitType> => {
    const response = await api.get(`/visit-types/${id}`);
    return response.data.data;
  },

  // Create a new visit type
  create: async (data: VisitTypeInput): Promise<VisitType> => {
    const response = await api.post('/visit-types', data);
    return response.data.data;
  },

  // Update a visit type
  update: async (id: string, data: Partial<VisitTypeInput>): Promise<VisitType> => {
    const response = await api.put(`/visit-types/${id}`, data);
    return response.data.data;
  },

  // Toggle active status
  toggleActive: async (id: string, isActive: boolean): Promise<VisitType> => {
    const response = await api.patch(`/visit-types/${id}/toggle-active`, { isActive });
    return response.data.data;
  },

  // Delete a visit type
  delete: async (id: string): Promise<void> => {
    await api.delete(`/visit-types/${id}`);
  },

  // Reorder visit types
  reorder: async (orderedIds: string[]): Promise<void> => {
    await api.post('/visit-types/reorder', { orderedIds });
  },

  // Seed default visit types
  seedDefaults: async (): Promise<void> => {
    await api.post('/visit-types/seed');
  },
};
