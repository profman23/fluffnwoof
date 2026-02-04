import { apiClient } from './client';

export interface StaffNotification {
  id: string;
  type: 'CUSTOMER_BOOKING' | 'CUSTOMER_CANCELLATION';
  isRead: boolean;
  createdAt: string;
  // Approval workflow fields
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  actionBy?: string;
  actionAt?: string;
  rejectReason?: string;
  appointment: {
    id: string;
    appointmentDate: string;
    appointmentTime: string;
    pet: {
      name: string;
      species: string;
      owner?: {
        firstName: string;
        lastName: string;
        phone: string;
      };
    };
    vet: {
      firstName: string;
      lastName: string;
    };
  };
}

export interface NotificationsResponse {
  data: StaffNotification[];
  unreadCount: number;
}

export const notificationsApi = {
  getAll: async (unreadOnly = false): Promise<NotificationsResponse> => {
    const response = await apiClient.get('/notifications', {
      params: { unreadOnly },
    });
    return response.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get('/notifications/count');
    return response.data.count;
  },

  markAsRead: async (id: string): Promise<void> => {
    await apiClient.put(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.put('/notifications/read-all');
  },

  // Booking approval workflow
  approveBooking: async (id: string): Promise<void> => {
    await apiClient.put(`/notifications/${id}/approve`);
  },

  rejectBooking: async (id: string, reason?: string): Promise<void> => {
    await apiClient.put(`/notifications/${id}/reject`, { reason });
  },
};

export default notificationsApi;
