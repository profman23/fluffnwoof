import api from './client';
import { Pet, Species, Gender, Owner } from '../types';

export interface CreatePetInput {
  name: string;
  species: Species;
  breed?: string;
  gender: Gender;
  ownerId: string;
  birthDate?: string;
  color?: string;
  weight?: number;
  microchipId?: string;
  photoUrl?: string;
  notes?: string;
}

export interface UpdatePetInput {
  name?: string;
  species?: Species;
  breed?: string;
  gender?: Gender;
  birthDate?: string;
  color?: string;
  weight?: number;
  microchipId?: string;
  photoUrl?: string;
  notes?: string;
  isActive?: boolean;
}

export interface PetWithOwner extends Omit<Pet, 'owner'> {
  petCode?: string;
  owner: Pick<Owner, 'id' | 'firstName' | 'lastName' | 'phone' | 'email'> & {
    customerCode?: string;
  };
}

export interface PaginatedPets {
  data: PetWithOwner[];
  total: number;
  page: number;
  totalPages: number;
}

export const petsApi = {
  /**
   * Get all pets with pagination, search, and optional owner filter
   */
  getAll: async (
    page = 1,
    limit = 20,
    search?: string,
    ownerId?: string
  ): Promise<PaginatedPets> => {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));
    if (search) params.append('search', search);
    if (ownerId) params.append('ownerId', ownerId);
    const response = await api.get(`/pets?${params.toString()}`);
    // Map backend response to frontend expected format
    return {
      data: response.data.data || [],
      total: response.data.pagination?.total || 0,
      page: response.data.pagination?.page || 1,
      totalPages: response.data.pagination?.totalPages || 1,
    };
  },

  /**
   * Get pet by ID with full details
   */
  getById: async (id: string): Promise<Pet> => {
    const response = await api.get(`/pets/${id}`);
    return response.data.data;
  },

  /**
   * Create a new pet
   */
  create: async (data: CreatePetInput): Promise<Pet> => {
    const response = await api.post('/pets', data);
    return response.data.data;
  },

  /**
   * Update pet
   */
  update: async (id: string, data: UpdatePetInput): Promise<Pet> => {
    const response = await api.put(`/pets/${id}`, data);
    return response.data.data;
  },

  /**
   * Deactivate pet (soft delete)
   */
  deactivate: async (id: string): Promise<void> => {
    await api.delete(`/pets/${id}`);
  },

  /**
   * Reactivate pet
   */
  reactivate: async (id: string): Promise<void> => {
    await api.put(`/pets/${id}`, { isActive: true });
  },
};
