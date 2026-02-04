/**
 * Clinic Settings API Client
 * API methods for clinic form settings
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
export interface FormSettings {
  id: string;
  logoUrl: string | null;
  logoPosition: 'left' | 'center' | 'right';
  clinicNameEn: string;
  clinicNameAr: string;
  addressEn: string;
  addressAr: string;
  phoneNumber: string | null;
  fontSize: number;
  showClientSignature: boolean;
  clientSignatureLabelEn: string;
  clientSignatureLabelAr: string;
  showVetSignature: boolean;
  vetSignatureLabelEn: string;
  vetSignatureLabelAr: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateFormSettingsData {
  logoPosition?: 'left' | 'center' | 'right';
  clinicNameEn?: string;
  clinicNameAr?: string;
  addressEn?: string;
  addressAr?: string;
  phoneNumber?: string;
  fontSize?: number;
  showClientSignature?: boolean;
  clientSignatureLabelEn?: string;
  clientSignatureLabelAr?: string;
  showVetSignature?: boolean;
  vetSignatureLabelEn?: string;
  vetSignatureLabelAr?: string;
}

// API Methods

/**
 * Get form settings
 */
export const getFormSettings = async (): Promise<FormSettings> => {
  const response = await api.get('/clinic-settings/forms');
  return response.data.data;
};

/**
 * Update form settings
 */
export const updateFormSettings = async (data: UpdateFormSettingsData): Promise<FormSettings> => {
  const response = await api.put('/clinic-settings/forms', data);
  return response.data.data;
};

/**
 * Upload logo
 */
export const uploadFormLogo = async (file: File): Promise<FormSettings> => {
  const formData = new FormData();
  formData.append('logo', file);
  const response = await api.post('/clinic-settings/forms/logo', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data;
};

/**
 * Remove logo
 */
export const removeFormLogo = async (): Promise<FormSettings> => {
  const response = await api.delete('/clinic-settings/forms/logo');
  return response.data.data;
};
