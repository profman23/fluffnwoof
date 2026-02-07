/**
 * Boarding & ICU API Client
 * API methods for boarding slot configuration and session management
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

// =====================================================
// Types
// =====================================================

export type BoardingType = 'BOARDING' | 'ICU';
export type Species = 'DOG' | 'CAT' | 'BIRD' | 'RABBIT' | 'HAMSTER' | 'GUINEA_PIG' | 'TURTLE' | 'FISH' | 'OTHER' | 'HORSE' | 'GOAT';
export type BoardingSessionStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface BoardingSlotConfig {
  id: string;
  nameEn: string;
  nameAr: string;
  type: BoardingType;
  species: Species;
  totalSlots: number;
  pricePerDay: number | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Computed fields
  availableSlots?: number;
  occupiedSlots?: number;
  sessions?: BoardingSession[];
}

export interface BoardingSession {
  id: string;
  configId: string;
  petId: string;
  slotNumber: number;
  checkInDate: string;
  checkOutDate: string | null;
  expectedCheckOutDate: string | null;
  status: BoardingSessionStatus;
  notes: string | null;
  dailyRate: number | null;
  totalAmount: number | null;
  assignedVetId: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  pet?: {
    id: string;
    name: string;
    species: Species;
    photoUrl: string | null;
    owner?: {
      id: string;
      firstName: string;
      lastName: string;
      phone: string | null;
    };
  };
  config?: BoardingSlotConfig;
}

export interface BoardingStats {
  boarding: {
    dog: { total: number; occupied: number; available: number };
    cat: { total: number; occupied: number; available: number };
  };
  icu: {
    dog: { total: number; occupied: number; available: number };
    cat: { total: number; occupied: number; available: number };
  };
}

export interface CreateConfigData {
  nameEn: string;
  nameAr: string;
  type: BoardingType;
  species: Species;
  totalSlots: number;
  pricePerDay?: number | null;
  notes?: string | null;
}

export interface UpdateConfigData {
  nameEn?: string;
  nameAr?: string;
  totalSlots?: number;
  pricePerDay?: number | null;
  notes?: string | null;
  isActive?: boolean;
}

export interface BoardingSessionWithDetails extends Omit<BoardingSession, 'pet' | 'config'> {
  daysRemaining?: number;
  column?: 'green' | 'yellow' | 'red';
  pet: {
    id: string;
    name: string;
    species: Species;
    breed?: string;
    gender?: 'MALE' | 'FEMALE';
    photoUrl: string | null;
    birthDate?: string;
    owner: {
      id: string;
      firstName: string;
      lastName: string;
      phone: string | null;
      email?: string;
    };
  };
  config: {
    id: string;
    nameEn: string;
    nameAr: string;
    type: BoardingType;
    species: Species;
    pricePerDay?: number | null;
  };
  assignedVet?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface KanbanData {
  green: BoardingSessionWithDetails[];
  yellow: BoardingSessionWithDetails[];
  red: BoardingSessionWithDetails[];
}

export interface KanbanResponse {
  data: KanbanData;
  counts: {
    green: number;
    yellow: number;
    red: number;
    total: number;
  };
}

export interface CreateSessionData {
  configId: string;
  petId: string;
  slotNumber?: number;
  checkInDate: string;
  expectedCheckOutDate: string;
  notes?: string;
  assignedVetId?: string;
}

export interface UpdateSessionData {
  expectedCheckOutDate?: string;
  notes?: string;
  assignedVetId?: string | null;
}

export interface BoardingNotification {
  id: string;
  sessionId: string;
  type: 'RED_ALERT' | 'YELLOW_WARNING';
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  session: {
    id: string;
    pet: {
      id: string;
      name: string;
      species: Species;
      photoUrl: string | null;
    };
    config: {
      type: BoardingType;
      nameEn: string;
      nameAr: string;
    };
    expectedCheckOutDate: string | null;
  };
}

// =====================================================
// API Response Types
// =====================================================

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  messageAr?: string;
  error?: string;
  errorAr?: string;
}

// =====================================================
// Slot Configuration API
// =====================================================

/**
 * Get all boarding slot configurations
 */
export const getConfigs = async (params?: {
  type?: BoardingType;
  species?: Species;
  isActive?: boolean;
}): Promise<BoardingSlotConfig[]> => {
  const response = await api.get<ApiResponse<BoardingSlotConfig[]>>('/boarding/config', { params });
  return response.data.data || [];
};

/**
 * Get single configuration by ID
 */
export const getConfigById = async (id: string): Promise<BoardingSlotConfig | null> => {
  const response = await api.get<ApiResponse<BoardingSlotConfig>>(`/boarding/config/${id}`);
  return response.data.data || null;
};

/**
 * Create new boarding slot configuration
 */
export const createConfig = async (data: CreateConfigData): Promise<BoardingSlotConfig> => {
  const response = await api.post<ApiResponse<BoardingSlotConfig>>('/boarding/config', data);
  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to create configuration');
  }
  return response.data.data!;
};

/**
 * Update boarding slot configuration
 */
export const updateConfig = async (id: string, data: UpdateConfigData): Promise<BoardingSlotConfig> => {
  const response = await api.put<ApiResponse<BoardingSlotConfig>>(`/boarding/config/${id}`, data);
  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to update configuration');
  }
  return response.data.data!;
};

/**
 * Delete boarding slot configuration
 */
export const deleteConfig = async (id: string): Promise<void> => {
  const response = await api.delete<ApiResponse<void>>(`/boarding/config/${id}`);
  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to delete configuration');
  }
};

/**
 * Get boarding statistics
 */
export const getStats = async (): Promise<BoardingStats> => {
  const response = await api.get<ApiResponse<BoardingStats>>('/boarding/config/stats');
  return response.data.data || {
    boarding: {
      dog: { total: 0, occupied: 0, available: 0 },
      cat: { total: 0, occupied: 0, available: 0 },
    },
    icu: {
      dog: { total: 0, occupied: 0, available: 0 },
      cat: { total: 0, occupied: 0, available: 0 },
    },
  };
};

// =====================================================
// Session Management API
// =====================================================

/**
 * Get sessions organized by Kanban columns
 */
export const getKanbanSessions = async (params?: {
  type?: BoardingType;
  configId?: string;
}): Promise<KanbanResponse> => {
  const response = await api.get<ApiResponse<KanbanData> & { counts: KanbanResponse['counts'] }>(
    '/boarding/sessions/kanban',
    { params }
  );
  return {
    data: response.data.data || { green: [], yellow: [], red: [] },
    counts: response.data.counts || { green: 0, yellow: 0, red: 0, total: 0 },
  };
};

/**
 * Get all sessions
 */
export const getSessions = async (params?: {
  type?: BoardingType;
  configId?: string;
  status?: BoardingSessionStatus;
}): Promise<BoardingSessionWithDetails[]> => {
  const response = await api.get<ApiResponse<BoardingSessionWithDetails[]>>('/boarding/sessions', { params });
  return response.data.data || [];
};

/**
 * Get single session by ID
 */
export const getSessionById = async (id: string): Promise<BoardingSessionWithDetails | null> => {
  const response = await api.get<ApiResponse<BoardingSessionWithDetails>>(`/boarding/sessions/${id}`);
  return response.data.data || null;
};

/**
 * Create new boarding session
 */
export const createSession = async (data: CreateSessionData): Promise<BoardingSession> => {
  const response = await api.post<ApiResponse<BoardingSession>>('/boarding/sessions', data);
  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to create session');
  }
  return response.data.data!;
};

/**
 * Update boarding session
 */
export const updateSession = async (id: string, data: UpdateSessionData): Promise<BoardingSession> => {
  const response = await api.put<ApiResponse<BoardingSession>>(`/boarding/sessions/${id}`, data);
  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to update session');
  }
  return response.data.data!;
};

/**
 * Checkout (complete) a boarding session
 */
export const checkoutSession = async (id: string, data?: { checkOutNotes?: string }): Promise<BoardingSession> => {
  const response = await api.post<ApiResponse<BoardingSession>>(`/boarding/sessions/${id}/checkout`, data || {});
  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to checkout session');
  }
  return response.data.data!;
};

// =====================================================
// Notifications API
// =====================================================

/**
 * Get boarding notifications
 */
export const getBoardingNotifications = async (unreadOnly?: boolean): Promise<{
  data: BoardingNotification[];
  unreadCount: number;
}> => {
  const response = await api.get<ApiResponse<BoardingNotification[]> & { unreadCount: number }>(
    '/boarding/notifications',
    { params: { unreadOnly } }
  );
  return {
    data: response.data.data || [],
    unreadCount: response.data.unreadCount || 0,
  };
};

/**
 * Mark all boarding notifications as read
 */
export const markAllNotificationsRead = async (): Promise<void> => {
  const response = await api.put<ApiResponse<void>>('/boarding/notifications/read-all');
  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to mark notifications as read');
  }
};

// Export as default object for consistency with other API clients
export const boardingApi = {
  // Config
  getConfigs,
  getConfigById,
  createConfig,
  updateConfig,
  deleteConfig,
  getStats,
  // Sessions
  getKanbanSessions,
  getSessions,
  getSessionById,
  createSession,
  updateSession,
  checkoutSession,
  // Notifications
  getBoardingNotifications,
  markAllNotificationsRead,
};

export default boardingApi;
