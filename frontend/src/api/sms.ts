import apiClient from './client';

export interface SmsBalance {
  balance: number;
  status: string;
}

export interface SmsLog {
  id: string;
  messageId?: string;
  recipientPhone: string;
  recipientName?: string;
  messageBody: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
  sentAt?: string;
  errorMessage?: string;
  createdAt: string;
  sentBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface SendSmsInput {
  phone: string;
  message: string;
  recipientName?: string;
}

export interface SmsLogsResponse {
  data: SmsLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const smsApi = {
  /**
   * Get SMS balance from Madar
   */
  getBalance: async (): Promise<SmsBalance> => {
    const response = await apiClient.get('/sms/balance');
    return response.data;
  },

  /**
   * Send SMS
   */
  sendSms: async (data: SendSmsInput): Promise<SmsLog> => {
    const response = await apiClient.post('/sms/send', data);
    return response.data;
  },

  /**
   * Get SMS logs with pagination
   */
  getLogs: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    phone?: string;
  }): Promise<SmsLogsResponse> => {
    const response = await apiClient.get('/sms/logs', { params });
    return response.data;
  },

  /**
   * Get message status from Madar
   */
  getMessageStatus: async (messageId: string): Promise<any> => {
    const response = await apiClient.get(`/sms/status/${messageId}`);
    return response.data;
  },
};
