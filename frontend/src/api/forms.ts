/**
 * Forms API Client
 * API methods for form templates and pet forms
 */

import axios from 'axios';
import { Capacitor } from '@capacitor/core';

// Automatically detect the correct API URL based on platform
const getApiUrl = (): string => {
  if (Capacitor.getPlatform() === 'android') {
    return 'http://10.0.2.2:5000/api';
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
};

const API_BASE_URL = getApiUrl();

// Create axios instance with auth header
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Types
export type FormCategory = 'BOARDING' | 'SURGERY' | 'VACCINATION' | 'GROOMING' | 'CONSENT' | 'DISCHARGE' | 'OTHER';
export type FormStatus = 'DRAFT' | 'PENDING_CLIENT' | 'PENDING_VET' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
export type SignerType = 'CLIENT' | 'VET' | 'WITNESS';

export interface FormVariable {
  key: string;
  labelEn: string;
  labelAr: string;
  example: string;
}

export interface FormTemplate {
  id: string;
  nameEn: string;
  nameAr: string;
  contentEn: string;
  contentAr: string;
  category: FormCategory;
  requiresClientSignature: boolean;
  requiresVetSignature: boolean;
  isActive: boolean;
  headerLogoUrl?: string;
  footerText?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  _count?: {
    petForms: number;
  };
}

export interface FormSignature {
  id: string;
  petFormId: string;
  signerType: SignerType;
  signerName: string;
  signerId?: string;
  signatureData: string;
  signedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface PetForm {
  id: string;
  templateId: string;
  petId: string;
  appointmentId?: string;
  filledContentEn: string;
  filledContentAr: string;
  status: FormStatus;
  expiresAt?: string;
  notificationSentAt?: string;
  notificationMethod?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  template?: {
    id: string;
    nameEn: string;
    nameAr: string;
    category: FormCategory;
    requiresClientSignature?: boolean;
    requiresVetSignature?: boolean;
  };
  pet?: {
    id: string;
    name: string;
    petCode: string;
    owner?: {
      id: string;
      firstName: string;
      lastName: string;
      email?: string;
      phone: string;
    };
  };
  signatures?: FormSignature[];
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateTemplateInput {
  nameEn: string;
  nameAr: string;
  contentEn: string;
  contentAr: string;
  category: FormCategory;
  requiresClientSignature: boolean;
  requiresVetSignature: boolean;
  headerLogoUrl?: string;
  footerText?: string;
}

export interface UpdateTemplateInput extends Partial<CreateTemplateInput> {
  isActive?: boolean;
}

export interface AttachFormInput {
  templateId: string;
  appointmentId?: string;
  vetId?: string;
}

// API Methods
export const formsApi = {
  // =====================================================
  // TEMPLATES
  // =====================================================

  /**
   * Get all form templates
   */
  getTemplates: async (filters?: {
    category?: FormCategory;
    isActive?: boolean;
    search?: string;
  }): Promise<FormTemplate[]> => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
    if (filters?.search) params.append('search', filters.search);

    const response = await api.get(`/forms/templates?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get template by ID
   */
  getTemplateById: async (id: string): Promise<FormTemplate> => {
    const response = await api.get(`/forms/templates/${id}`);
    return response.data.data;
  },

  /**
   * Get available variables for templates
   */
  getAvailableVariables: async (): Promise<FormVariable[]> => {
    const response = await api.get('/forms/templates/variables');
    return response.data.data;
  },

  /**
   * Create new template
   */
  createTemplate: async (data: CreateTemplateInput): Promise<FormTemplate> => {
    const response = await api.post('/forms/templates', data);
    return response.data.data;
  },

  /**
   * Update template
   */
  updateTemplate: async (id: string, data: UpdateTemplateInput): Promise<FormTemplate> => {
    const response = await api.put(`/forms/templates/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete template (soft delete)
   */
  deleteTemplate: async (id: string): Promise<void> => {
    await api.delete(`/forms/templates/${id}`);
  },

  /**
   * Preview template with sample data
   */
  previewTemplate: async (contentEn: string, contentAr: string): Promise<{ contentEn: string; contentAr: string }> => {
    const response = await api.post('/forms/templates/preview', { contentEn, contentAr });
    return response.data.data;
  },

  // =====================================================
  // PET FORMS
  // =====================================================

  /**
   * Get forms for a specific pet
   */
  getPetForms: async (petId: string, appointmentId?: string): Promise<PetForm[]> => {
    const params = appointmentId ? { appointmentId } : {};
    const response = await api.get(`/forms/pet/${petId}`, { params });
    return response.data.data;
  },

  /**
   * Get form by ID
   */
  getFormById: async (formId: string): Promise<PetForm> => {
    const response = await api.get(`/forms/${formId}`);
    return response.data.data;
  },

  /**
   * Attach form template to pet
   */
  attachFormToPet: async (petId: string, data: AttachFormInput): Promise<PetForm> => {
    const response = await api.post(`/forms/pet/${petId}/attach`, data);
    return response.data.data;
  },

  /**
   * Send notification to client
   */
  sendFormNotification: async (formId: string, method: 'EMAIL' | 'PORTAL' | 'BOTH' = 'BOTH'): Promise<void> => {
    await api.post(`/forms/${formId}/send-notification`, { method });
  },

  /**
   * Sign form as staff (vet)
   */
  signFormAsStaff: async (formId: string, signatureData: string): Promise<FormSignature> => {
    const response = await api.post(`/forms/${formId}/sign`, { signatureData });
    return response.data.data;
  },

  /**
   * Sign form as client (on behalf - from tablet in clinic)
   * Used when client signs on doctor's tablet
   */
  signFormAsClient: async (formId: string, signatureData: string): Promise<FormSignature> => {
    const response = await api.post(`/forms/${formId}/sign-client`, { signatureData });
    return response.data.data;
  },
};

export default formsApi;
