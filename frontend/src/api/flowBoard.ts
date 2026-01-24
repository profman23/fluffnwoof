import api from './client';
import { FlowBoardData, AppointmentStatus, VisitType, User, Appointment } from '../types';

export interface CreateFlowBoardAppointmentInput {
  petId: string;
  vetId: string;
  appointmentDate: string;
  appointmentTime: string;
  visitType: VisitType;
  duration?: number;
  notes?: string;
  scheduledFromRecordId?: string;
}

export const flowBoardApi = {
  /**
   * Get Flow Board data for a specific date
   */
  getData: async (date?: string): Promise<FlowBoardData> => {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    const response = await api.get(`/appointments/flow-board?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Update appointment status (for drag & drop)
   */
  updateStatus: async (id: string, status: AppointmentStatus): Promise<Appointment> => {
    const response = await api.patch(`/appointments/${id}/status`, { status });
    return response.data.data;
  },

  /**
   * Create a new appointment from Flow Board
   */
  createAppointment: async (data: CreateFlowBoardAppointmentInput): Promise<Appointment> => {
    const response = await api.post('/appointments', data);
    return response.data.data;
  },

  /**
   * Create multiple appointments in batch
   * Used for booking next appointments from PatientRecordModal
   * Returns created and skipped appointments with reasons
   */
  createBatchAppointments: async (appointments: CreateFlowBoardAppointmentInput[]): Promise<{
    created: Appointment[];
    skipped: Array<{ visitType?: VisitType; appointmentTime: string; appointmentDate: string; reason: string }>;
  }> => {
    const response = await api.post('/appointments/batch', { appointments });
    return response.data.data;
  },

  /**
   * Get staff/vets list for appointment assignment
   */
  getStaff: async (): Promise<User[]> => {
    try {
      const response = await api.get('/users?limit=100');
      // Response structure is { data: { users: [...], total, page, totalPages } }
      const users = response.data?.data?.users;
      return Array.isArray(users) ? users : [];
    } catch (error) {
      console.error('Failed to fetch staff:', error);
      return [];
    }
  },

  /**
   * Get booked appointments for a specific vet on a specific date
   */
  getVetAppointments: async (vetId: string, date: string): Promise<{ appointmentTime: string; duration: number }[]> => {
    try {
      const response = await api.get(`/appointments?vetId=${vetId}&date=${date}&limit=100`);
      const appointments = response.data?.data?.appointments || response.data?.data || [];
      return Array.isArray(appointments)
        ? appointments.map((a: { appointmentTime: string; duration?: number }) => ({
            appointmentTime: a.appointmentTime,
            duration: a.duration || 30, // Default 30 min if not specified
          }))
        : [];
    } catch (error) {
      console.error('Failed to fetch vet appointments:', error);
      return [];
    }
  },

  /**
   * Reschedule an appointment (change date, time, or vet)
   */
  reschedule: async (
    id: string,
    data: { appointmentDate: string; appointmentTime: string; vetId: string }
  ): Promise<Appointment> => {
    const response = await api.put(`/appointments/${id}`, data);
    return response.data.data;
  },

  /**
   * Update appointment confirmation status
   */
  updateConfirmation: async (id: string, isConfirmed: boolean): Promise<Appointment> => {
    const response = await api.patch(`/appointments/${id}/confirmation`, { isConfirmed });
    return response.data.data;
  },

  /**
   * Get upcoming appointments for a specific pet
   */
  getUpcomingByPetId: async (petId: string): Promise<Appointment[]> => {
    try {
      const response = await api.get(`/appointments/pet/${petId}/upcoming`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Failed to fetch pet upcoming appointments:', error);
      return [];
    }
  },

  /**
   * Get appointments scheduled from a specific medical record
   */
  getByScheduledFromRecordId: async (recordId: string): Promise<Appointment[]> => {
    try {
      const response = await api.get(`/appointments/record/${recordId}/scheduled`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Failed to fetch record scheduled appointments:', error);
      return [];
    }
  },
};
