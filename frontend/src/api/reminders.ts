import apiClient from './client';

export type ReminderEventType =
  | 'APPOINTMENT_BOOKED'
  | 'APPOINTMENT_CONFIRMED'
  | 'APPOINTMENT_CANCELLED'
  | 'PRE_APPOINTMENT'
  | 'FOLLOW_UP'
  | 'OWNER_CREATED';

export type NotificationChannel = 'SMS' | 'WHATSAPP' | 'EMAIL' | 'PUSH';

export type ReminderLogStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'SKIPPED';

export interface ReminderSetting {
  id: string;
  eventType: ReminderEventType;
  isEnabled: boolean;
  sendBeforeHours: number | null;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  templateAr: string | null;
  templateEn: string | null;
  reminderOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReminderLog {
  id: string;
  settingId: string;
  appointmentId: string | null;
  channel: NotificationChannel;
  status: ReminderLogStatus;
  recipientPhone: string | null;
  recipientEmail: string | null;
  recipientName: string | null;
  messageBody: string | null;
  scheduledFor: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  errorMessage: string | null;
  externalId: string | null;
  createdAt: string;
}

export interface UpdateReminderSettingInput {
  isEnabled?: boolean;
  sendBeforeHours?: number | null;
  smsEnabled?: boolean;
  whatsappEnabled?: boolean;
  emailEnabled?: boolean;
  pushEnabled?: boolean;
  templateAr?: string | null;
  templateEn?: string | null;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetLogsParams {
  page?: number;
  limit?: number;
  status?: ReminderLogStatus;
  channel?: NotificationChannel;
}

export const remindersApi = {
  // Get all reminder settings
  getSettings: async (): Promise<ReminderSetting[]> => {
    const response = await apiClient.get('/reminders/settings');
    return response.data;
  },

  // Get a specific reminder setting
  getSetting: async (eventType: ReminderEventType, reminderOrder: number = 1): Promise<ReminderSetting> => {
    const response = await apiClient.get(`/reminders/settings/${eventType}/${reminderOrder}`);
    return response.data;
  },

  // Update a reminder setting
  updateSetting: async (
    eventType: ReminderEventType,
    data: UpdateReminderSettingInput,
    reminderOrder: number = 1
  ): Promise<ReminderSetting> => {
    const response = await apiClient.put(`/reminders/settings/${eventType}/${reminderOrder}`, data);
    return response.data;
  },

  // Toggle a reminder setting (enable/disable)
  toggleSetting: async (eventType: ReminderEventType, enabled: boolean, reminderOrder: number = 1): Promise<ReminderSetting> => {
    const response = await apiClient.patch(`/reminders/settings/${eventType}/${reminderOrder}/toggle`, { isEnabled: enabled });
    return response.data;
  },

  // Get reminder logs
  getLogs: async (params: GetLogsParams = {}): Promise<PaginatedResult<ReminderLog>> => {
    const response = await apiClient.get('/reminders/logs', { params });
    return response.data;
  },

  // Get reminder stats
  getStats: async (): Promise<{
    totalSent: number;
    delivered: number;
    failed: number;
    pending: number;
  }> => {
    const response = await apiClient.get('/reminders/stats');
    return response.data;
  },

  // Get message templates
  getTemplates: async () => {
    const response = await apiClient.get('/reminders/templates');
    return response.data;
  },
};
