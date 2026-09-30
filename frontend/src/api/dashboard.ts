import { apiClient } from './client';

export interface DashboardStats {
  todayAppointments: number;
  // These have no vetId and come back null when the dashboard is scoped to a single vet
  registeredPets: number | null;
  registeredOwners: number | null;
  pendingInvoices: number | null;
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

export interface VetPerformanceStats {
  vetId: string;
  vetName: string;
  totalRecords: number;
  completeRecords: number;
  incompleteRecords: number;
  completionRate: number;
  lastActivity: string | null;
}

// Analytics Types
export interface TrendData {
  date: string;
  total: number;
  completed: number;
  cancelled: number;
}

export interface VisitTypeData {
  type: string;
  count: number;
}

export interface SpeciesData {
  species: string;
  count: number;
}

export interface VetAnalytics {
  vetId: string;
  vetName: string;
  appointments: number;
  completedRecords: number;
  totalRecords: number;
  completionRate: number;
}

export interface PatientsAnalytics {
  newPets: number;
  newOwners: number;
  totalPets: number;
  totalOwners: number;
  petsChange: number;
  ownersChange: number;
  bySpecies: SpeciesData[];
}

export interface AnalyticsData {
  appointments: {
    total: number;
    completed: number;
    cancelled: number;
    inProgress: number;
    change: number;
    trend: TrendData[];
    byVisitType: VisitTypeData[];
  };
  // null when the dashboard is scoped to a single vet (patient data has no vetId)
  patients: PatientsAnalytics | null;
  vets: {
    performance: VetAnalytics[];
    totalVets: number;
  };
}

export const dashboardApi = {
  // Get all dashboard data at once. Managers may pass a staffId to filter by vet.
  getData: async (staffId?: string): Promise<DashboardData> => {
    const response = await apiClient.get('/dashboard', {
      params: staffId ? { staffId } : undefined,
    });
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

  // Get vet performance stats
  getVetPerformance: async (): Promise<VetPerformanceStats[]> => {
    const response = await apiClient.get('/dashboard/vet-performance');
    return response.data.data;
  },

  // Get analytics with date range. Managers may pass a staffId to filter by vet.
  getAnalytics: async (startDate: string, endDate: string, staffId?: string): Promise<AnalyticsData> => {
    const response = await apiClient.get('/dashboard/analytics', {
      params: { startDate, endDate, ...(staffId ? { staffId } : {}) },
    });
    return response.data.data;
  },
};
