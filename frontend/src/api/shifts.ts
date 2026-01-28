import api from './client';

// Types
export type DayOfWeek = 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';

export interface VetSchedule {
  id: string;
  vetId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isWorkingDay: boolean;
}

export interface VetDayOff {
  id: string;
  vetId: string;
  date: string;
  reason?: string;
}

export interface VetBreak {
  id: string;
  vetId: string;
  dayOfWeek?: DayOfWeek;
  specificDate?: string;
  startTime: string;
  endTime: string;
  description?: string;
  isRecurring: boolean;
}

export interface VetWithSchedule {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  schedules: VetSchedule[];
}

// New Schedule Period types (فترة جدولة محددة بتاريخ)
export interface VetSchedulePeriod {
  id: string;
  vetId: string;
  startDate: string;
  endDate: string;
  workingDays: DayOfWeek[];
  workStartTime: string;
  workEndTime: string;
  breakStartTime?: string | null;
  breakEndTime?: string | null;
  isActive: boolean;
}

export interface SchedulePeriodInput {
  startDate: string;
  endDate: string;
  workingDays: DayOfWeek[];
  workStartTime: string;
  workEndTime: string;
  breakStartTime?: string;
  breakEndTime?: string;
}

export interface VetWithSchedulePeriods {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  role: string;
  schedulePeriods: VetSchedulePeriod[];
}

export interface ScheduleInput {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isWorkingDay: boolean;
}

export interface BreakInput {
  dayOfWeek?: DayOfWeek;
  specificDate?: string;
  startTime: string;
  endTime: string;
  description?: string;
  isRecurring: boolean;
}

export type UnavailableReason = 'dayOff' | 'weekendOff' | 'noSchedule' | 'fullyBooked' | null;

export interface AvailabilityResponse {
  slots: string[];
  unavailableReason: UnavailableReason;
}

export const shiftsApi = {
  // Get all vets with their schedules
  getAllVetsWithSchedules: async (): Promise<VetWithSchedule[]> => {
    const response = await api.get('/shifts/vets');
    return response.data.data;
  },

  // Get schedules for a specific vet
  getSchedules: async (vetId: string): Promise<VetSchedule[]> => {
    const response = await api.get(`/shifts/schedules/${vetId}`);
    return response.data.data;
  },

  // Bulk update schedules for a vet
  updateSchedulesBulk: async (vetId: string, schedules: ScheduleInput[]): Promise<VetSchedule[]> => {
    const response = await api.put(`/shifts/schedules/${vetId}/bulk`, { schedules });
    return response.data.data;
  },

  // Get days off for a vet
  getDaysOff: async (vetId: string, startDate?: string, endDate?: string): Promise<VetDayOff[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get(`/shifts/days-off/${vetId}${query}`);
    return response.data.data;
  },

  // Add a day off
  addDayOff: async (vetId: string, date: string, reason?: string): Promise<VetDayOff> => {
    const response = await api.post(`/shifts/days-off/${vetId}`, { date, reason });
    return response.data.data;
  },

  // Remove a day off
  removeDayOff: async (id: string): Promise<void> => {
    await api.delete(`/shifts/days-off/${id}`);
  },

  // Get breaks for a vet
  getBreaks: async (vetId: string): Promise<VetBreak[]> => {
    const response = await api.get(`/shifts/breaks/${vetId}`);
    return response.data.data;
  },

  // Add a break
  addBreak: async (vetId: string, data: BreakInput): Promise<VetBreak> => {
    const response = await api.post(`/shifts/breaks/${vetId}`, data);
    return response.data.data;
  },

  // Update a break
  updateBreak: async (id: string, data: Partial<BreakInput>): Promise<VetBreak> => {
    const response = await api.put(`/shifts/breaks/${id}`, data);
    return response.data.data;
  },

  // Remove a break
  removeBreak: async (id: string): Promise<void> => {
    await api.delete(`/shifts/breaks/${id}`);
  },

  // Get available slots for a vet on a specific date
  getAvailability: async (vetId: string, date: string, duration: number = 30): Promise<AvailabilityResponse> => {
    const response = await api.get(`/shifts/availability/${vetId}?date=${date}&duration=${duration}`);
    return response.data.data;
  },

  // ==================== Schedule Periods (New System) ====================

  // Get all vets with their schedule periods
  getAllVetsWithSchedulePeriods: async (): Promise<VetWithSchedulePeriods[]> => {
    const response = await api.get('/shifts/periods/vets');
    return response.data.data;
  },

  // Get schedule periods for a specific vet
  getSchedulePeriods: async (vetId: string): Promise<VetSchedulePeriod[]> => {
    const response = await api.get(`/shifts/periods/${vetId}`);
    return response.data.data;
  },

  // Create a new schedule period
  createSchedulePeriod: async (vetId: string, data: SchedulePeriodInput): Promise<VetSchedulePeriod> => {
    const response = await api.post(`/shifts/periods/${vetId}`, data);
    return response.data.data;
  },

  // Update a schedule period
  updateSchedulePeriod: async (id: string, data: Partial<SchedulePeriodInput>): Promise<VetSchedulePeriod> => {
    const response = await api.put(`/shifts/periods/${id}`, data);
    return response.data.data;
  },

  // Delete a schedule period
  deleteSchedulePeriod: async (id: string): Promise<void> => {
    await api.delete(`/shifts/periods/${id}`);
  },

  // Get availability using the new period-based system
  getAvailabilityV2: async (vetId: string, date: string, duration: number = 30): Promise<AvailabilityResponse> => {
    const response = await api.get(`/shifts/availability-v2/${vetId}?date=${date}&duration=${duration}`);
    return response.data.data;
  },
};
