import { apiClient } from './client';

export interface DashboardStats {
  todayAppointments: number;
  registeredPets: number;
  registeredOwners: number;
  pendingInvoices: number;
  totalMedicalRecords: number;
}

export interface UpcomingAppointment {
  id: string;
  type: string;
  petName: string;
  petSpecies: string;
  ownerName: string;
  vetName: string;
  time: string;
  date: string;
}

export interface UpcomingVaccination {
  id: string;
  petName: string;
  petSpecies: string;
  ownerName: string;
  vaccineName: string;
  dueDate: string;
  daysUntil: number;
}

export interface DashboardData {
  stats: DashboardStats;
  upcomingAppointments: UpcomingAppointment[];
  upcomingVaccinations: UpcomingVaccination[];
}

export const dashboardApi = {
  // Get all dashboard data at once
  getData: async (): Promise<DashboardData> => {
    const response = await apiClient.get('/dashboard');
    return response.data.data;
  },

  // Get stats only
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get('/dashboard/stats');
    return response.data.data;
  },

  // Get upcoming appointments
  getUpcomingAppointments: async (limit = 5): Promise<UpcomingAppointment[]> => {
    const response = await apiClient.get(`/dashboard/appointments?limit=${limit}`);
    return response.data.data;
  },

  // Get upcoming vaccinations
  getUpcomingVaccinations: async (limit = 5): Promise<UpcomingVaccination[]> => {
    const response = await apiClient.get(`/dashboard/vaccinations?limit=${limit}`);
    return response.data.data;
  },
};
