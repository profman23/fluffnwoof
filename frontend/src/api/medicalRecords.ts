import { apiClient } from './client';
import { MedicalRecord, MedicalRecordInput, PaginatedResponse, AuditLog } from '../types';

export const medicalRecordsApi = {
  // Get all medical records with pagination and search
  getAll: async (
    page = 1,
    limit = 20,
    search?: string
  ): Promise<PaginatedResponse<MedicalRecord>> => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (search) params.append('search', search);

    const response = await apiClient.get(`/medical-records?${params}`);
    return response.data;
  },

  // Get audit log for a medical record
  getAuditLog: async (id: string): Promise<AuditLog[]> => {
    const response = await apiClient.get(`/medical-records/${id}/audit`);
    return response.data.data;
  },

  // Get or create medical record for appointment
  getOrCreateForAppointment: async (appointmentId: string): Promise<MedicalRecord> => {
    const response = await apiClient.post(`/medical-records/appointment/${appointmentId}`);
    return response.data.data;
  },

  // Get medical record by ID
  getById: async (id: string): Promise<MedicalRecord> => {
    const response = await apiClient.get(`/medical-records/${id}`);
    return response.data.data;
  },

  // Get medical record by appointment ID
  getByAppointmentId: async (appointmentId: string): Promise<MedicalRecord | null> => {
    try {
      const response = await apiClient.get(`/medical-records/appointment/${appointmentId}`);
      return response.data.data;
    } catch {
      return null;
    }
  },

  // Get all medical records for a pet
  getByPetId: async (
    petId: string,
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<MedicalRecord>> => {
    const response = await apiClient.get(
      `/medical-records/pet/${petId}?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  // Update medical record
  update: async (id: string, data: MedicalRecordInput): Promise<MedicalRecord> => {
    const response = await apiClient.patch(`/medical-records/${id}`, data);
    return response.data.data;
  },

  // Create medical record
  create: async (data: MedicalRecordInput & { petId: string; vetId: string; appointmentId?: string }): Promise<MedicalRecord> => {
    const response = await apiClient.post('/medical-records', data);
    return response.data.data;
  },

  // Delete medical record
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/medical-records/${id}`);
  },
};
