import api from './client';
import { FlowBoardAppointment } from '../types';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetNextAppointmentsParams {
  startDate?: string;
  endDate?: string;
  vetId?: string;
  page?: number;
  limit?: number;
}

export const reportsApi = {
  getNextAppointments: async (params: GetNextAppointmentsParams): Promise<PaginatedResult<FlowBoardAppointment>> => {
    const response = await api.get('/reports/next-appointments', { params });
    return response.data;
  },
};
